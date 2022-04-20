import logger from '../../core/utils/logger';
import * as serialEventNames from '../serial/serialEventNames';
import * as serialDataService from '../serial/serialDataService';
import { interpreter, modelNames, mlModelMap } from '../ml/predict';
import CircularBuffer from 'circular-buffer';
import * as tf from '@tensorflow/tfjs-node';
import { performance } from 'perf_hooks';
require('dotenv');
import np from 'numjs';

const modelName = process.env.MODEL;
const currentModelConfig = mlModelMap[modelName];

export const SENSORS = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
};

export const STATES = {
  INIT: 1,
  RECORD: 2,
  PAUSE: 3,
  INFERENCE: 4,
};

export const SOCKET_EVENTS = {
  initState: 'initState',
  connection: 'connection',
  serialData: 'serialData',
  stateChange: 'stateChange',
  gaitClassChange: 'gaitClassChange',
  serialDataInference: 'serialDataInference',
  INFERENCE_START: 'INFERENCE_START',
  INFERENCE_STOP: 'INFERENCE_STOP',
  INFERENCE_RESULT: 'INFERENCE_RESULT',
  INFERENCE_STARTED: 'INFERENCE_STARTED',
};

// const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
// const arrMax = (arr = []) => Math.max(...arr);
// const arrMin = (arr = []) => Math.min(...arr);
// const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const npMax = (arr, channel) => np.max(arr.tolist()[channel]);
const npMean = (arr, channel) => np.mean(arr.tolist()[channel]);
const npStd = (arr, channel) => np.std(arr.tolist()[channel]);
const computeMedian = (arr, channel) => {
  const values = arr.tolist()[channel].sort((a, b) => a - b);
  const mid = 63; // because list is always of len 128

  return values[mid];
};

export const timeit = () => {
  let t1 = null;
  let t2 = null;

  return {
    start: start,
    stop: stop,
  };

  function start() {
    t2 = null;
    t1 = performance.now();
  }

  function stop() {
    if (!t1) {
      throw new Error('Start the timer first');
    }
    t2 = performance.now();
    const elapsedTime = (t2 - t1) / 1000;

    // console.log(`Time Elapsed: ${elapsedTime} s`);
    // logger.info(`Inference time for 1000 ${state} for subject: ${subjectId}`);

    return elapsedTime;
  }
};

let subjectId = null;
let gaitClassId = null;
let state = STATES.INIT;
let leftSerialToFileLogger = undefined;
let rightSerialToFileLogger = undefined;
let ml = undefined;
let bufferCount = 0;
const windowSize = 128;
let isBufferFilledOnce = false;
const circularBuffer = CircularBuffer(windowSize);
let predictionCountMap = {
  0: 0,
  1: 0,
  2: 0,
  3: 0,
  4: 0,
};
const PREDICTION_COUNT_THRESHOLD = 2;
// let inferenceTimings = [];
// const inferenceLimits = [1, 10, 100, 1000, 10000];

function setPredictionCountMap(key, value) {
  const initialValue = Array(5)
    .fill(0)
    .map((v, k) => k)
    .reduce((acc, curr) => {
      acc[curr] = 0;

      return acc;
    }, {});

  initialValue[key] = value;

  return initialValue;
}

function computeResultantVector(x, y, z) {
  return Math.sqrt(x ** 2 + y ** 2 + z ** 2);
}

function checkPredictionCount() {
  return Object.keys(predictionCountMap).reduce((acc, curr) => {
    if (predictionCountMap[curr] > PREDICTION_COUNT_THRESHOLD) {
      acc = curr;
    }

    return acc;
  }, null);
}

function clearCircularBuffer() {
  const itemNums = circularBuffer.size();

  for (let i = 0; i < itemNums; i++) circularBuffer.pop();
}

function setLeftSerialHandler(fn) {
  leftSerialToFileLogger = fn;
}

function setRightSerialHandler(fn) {
  rightSerialToFileLogger = fn;
}

function serialStateHandler(currentState, serial) {
  const { serialInterfaces } = serial;
  let payload = '';

  switch (currentState) {
    case STATES.INIT:
      payload = `${STATES.INIT}:INIT\n`;
      break;
    case STATES.RECORD:
      payload = `${STATES.RECORD}:RECORD\n`;
      break;
    case STATES.PAUSE:
      payload = `${STATES.PAUSE}:PAUSE\n`;
      break;
    case STATES.INFERENCE:
      payload = `${STATES.INFERENCE}:INFERENCE\n`;
  }
  // console.log('payload change', payload);
  if (payload) {
    serialInterfaces.forEach((serial) => {
      if (serial.port) {
        serial.port.write(payload);
      }
    });
  }
}

function parseSerialData(data) {
  const serialData = data.split(':');

  if (serialData.length > 0) {
    const action = serialData[0];
    const payload = serialData[1];

    return {
      action,
      payload,
    };
  }

  return null;
}

function serialDataInputHandler(sensorName, data, io) {
  const serialData = parseSerialData(data);

  if (serialData.action === '100') {
    io.emit(SOCKET_EVENTS.serialData, { value: serialData.payload, sensorName: sensorName });
    let serialToFileLogger = null;

    switch (sensorName) {
      case SENSORS.LEFT:
        serialToFileLogger = leftSerialToFileLogger;
        break;
      case SENSORS.RIGHT:
        serialToFileLogger = rightSerialToFileLogger;
        break;
    }
    if (typeof serialToFileLogger === 'function') {
      serialToFileLogger(serialData.payload + '\n');
    }
  }

  if (serialData.action === '900') {
    // io.emit(SOCKET_EVENTS.serialDataInference, { value: serialData.payload, sensorName: sensorName });
    const bufferIndex = bufferCount % windowSize;

    bufferCount++;

    const sD = serialData.payload.split(',').map((val) => Number(val));

    if (sD.length === 9) {
      sD.push(computeResultantVector(sD[0], sD[1], sD[2]));
      sD.push(computeResultantVector(sD[3], sD[4], sD[5]));
      sD.push(computeResultantVector(sD[6], sD[7], sD[8]));
    }
    circularBuffer.push(sD);

    if (bufferCount === windowSize) {
      isBufferFilledOnce = true;
    }

    if (isBufferFilledOnce) {
      // INFERENCE HERE
      // take the values from the circular buffer and make a tensor
      let tensor = tf.tensor(circularBuffer.toarray(), [128, 12], 'float32');
      let statValues = np.array(circularBuffer.toarray(), 'float32');
      const statFeatures = [];
      let statTensor;

      // compute statistical features based on what model is set in the environment variable
      if (modelName === modelNames.CNN_STAT) {
        statValues = np.reshape(statValues, [12, 128]);
        // compute statistical features of 128 window for specified channels of 9,10,11
        // as done during the training session
        for (let channel = 9; channel < 12; channel++) {
          const std = npStd(statValues, channel);
          const mean = npMean(statValues, channel);
          const max = npMax(statValues, channel);
          const median = computeMedian(statValues, channel);

          statFeatures.push(std, mean, max, median);
        }
        statTensor = tf.tensor(statFeatures, currentModelConfig.statTensorShape, 'float32');
      }

      const modelShape = currentModelConfig.tensorShape;

      tensor = tensor.reshape(modelShape);
      const channelPosition = currentModelConfig.tensorShape.length - 2;
      // Inference th model here

      if (ml && tensor.shape[channelPosition] === 12 && bufferIndex % 32 === 0) {
        // const timer = timeit();
        let result;

        // timer.start();

        if (modelName === modelNames.CNN_STAT && statTensor) {
          // model requires two input for statistical inference.
          result = ml([tensor, statTensor]);
        } else {
          // cnn, cnn-lstm requires just one input for inference
          result = ml(tensor);
        }
        const yPred = result.arraySync()[0];

        for (let i = 0; i < yPred.length; i++) {
          // if prediction is above 80% then increment counter
          if (yPred[i] > 0.8) {
            const count = predictionCountMap[i] + 1;

            predictionCountMap = setPredictionCountMap(i, count);
          }
        }
        const predictedLabel = checkPredictionCount();

        if (predictedLabel) {
          io.sockets.emit(SOCKET_EVENTS.INFERENCE_RESULT, { value: predictedLabel });
          // Reset after INFERENCE
          predictionCountMap = setPredictionCountMap(predictedLabel, 0);
        }
        // const elapsedIime = timer.stop();

        // inferenceTimings.push(elapsedIime);

        // if (
        //   Array.isArray(inferenceLimits) &&
        //   inferenceLimits.length > 0 &&
        //   inferenceTimings.length >= inferenceLimits[inferenceLimits.length - 1]
        // ) {
        //   // compute mean, max, mode for 1000 inferences
        //   const sumInferences = sum(inferenceTimings);

        //   logger.info(`MODEL NAME: ${currentModelConfig.name}`);
        //   logger.info('--------------------------------------------------');
        //   logger.info(`S | ${inferenceLimits[inferenceLimits.length - 1]} | ${String(sumInferences.toFixed(6))}`);
        //   logger.info(
        //     `A | ${inferenceLimits[inferenceLimits.length - 1]} | ${String(average(inferenceTimings).toFixed(6))}`
        //   );
        //   logger.info(
        //     `M | ${inferenceLimits[inferenceLimits.length - 1]} | ${String(arrMax(inferenceTimings).toFixed(6))}`
        //   );
        //   logger.info(
        //     `m | ${inferenceLimits[inferenceLimits.length - 1]} | ${String(arrMin(inferenceTimings).toFixed(6))}`
        //   );
        //   logger.info('--------------------------------------------------');
        //   logger.info('--------------------------------------------------');
        //   // clear the array
        //   inferenceLimits.pop();
        //   inferenceTimings = [];
        // }
        // check if predictionCountMap count is above some threshold
      }
    }

    if (isBufferFilledOnce && bufferCount === windowSize) {
      circularBuffer.pop();
    }

    if (bufferIndex === 0 && isBufferFilledOnce) {
      bufferCount = 0;
    }
  }
}

function handleAfterConnection(io, socket, serial) {
  socket.on(SOCKET_EVENTS.initState, function (data) {
    logger.info(SOCKET_EVENTS.initState, data);
    subjectId = data.subjectId;
    io.sockets.emit(SOCKET_EVENTS.stateChange, { value: STATES.INIT, subjectId: subjectId });
  });

  socket.on(SOCKET_EVENTS.stateChange, function (data) {
    state = +data.value;
    if (!subjectId) {
      subjectId = data.subjectId;
    }

    logger.info(`socket state change: ${state} for subject: ${subjectId}`);

    serialStateHandler(state, serial);

    io.sockets.emit(SOCKET_EVENTS.stateChange, { value: state });
  });

  socket.on(SOCKET_EVENTS.gaitClassChange, function (data) {
    gaitClassId = data.value;
    subjectId = data.subjectId;
    logger.info(`Gait class set to: ${gaitClassId}`);
    io.sockets.emit(SOCKET_EVENTS.gaitClassChange, { value: gaitClassId });
    io.sockets.emit(SOCKET_EVENTS.stateChange, { value: STATES.PAUSE });
    setLeftSerialHandler(serialDataService.parseSaveAccelData(subjectId, gaitClassId, SENSORS.LEFT));
    setRightSerialHandler(serialDataService.parseSaveAccelData(subjectId, gaitClassId, SENSORS.RIGHT));
  });

  socket.on(SOCKET_EVENTS.INFERENCE_START, async function () {
    ml = await interpreter();
    clearCircularBuffer();
    logger.info(`INFERENCE started state change: ${state}`);

    serialStateHandler(STATES.INFERENCE, serial);

    io.sockets.emit(SOCKET_EVENTS.INFERENCE_STARTED, { value: STATES.INFERENCE });
  });

  socket.on(SOCKET_EVENTS.INFERENCE_STOP, function () {
    clearCircularBuffer();
    logger.info(`INFERENCE stopped`);
    serialStateHandler(STATES.INIT, serial);
  });

  // socket.emit('led', { value: brightness });
  socket.emit(SOCKET_EVENTS.stateChange, { value: state });
  serial.serialEventEmitter.on(serialEventNames.RIGHT_SERIAL_INPUT, (data) =>
    serialDataInputHandler(SENSORS.LEFT, data, io)
  );
  serial.serialEventEmitter.on(serialEventNames.LEFT_SERIAL_INPUT, (data) =>
    serialDataInputHandler(SENSORS.RIGHT, data, io)
  );
}

export function handleSerialSocketBridge(io, serialInterfaces) {
  if (!serialInterfaces) {
    return;
  }

  if (serialInterfaces.length <= 0) {
    return;
  }

  io.sockets.on(SOCKET_EVENTS.connection, function (socket) {
    handleAfterConnection(io, socket, serialInterfaces);
  });
}
