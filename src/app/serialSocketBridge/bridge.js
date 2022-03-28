import logger from '../../core/utils/logger';
import * as serialEventNames from '../serial/serialEventNames';
import * as serialDataService from '../serial/serialDataService';
import { interpreter } from '../ml/predict';
import CircularBuffer from 'circular-buffer';
import * as tf from '@tensorflow/tfjs';

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
const PREDICTION_COUNT_THRESHOLD = 10;

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

function checkPredictionCount() {
  return Object.keys(predictionCountMap).reduce((acc, curr) => {
    if (predictionCountMap[curr] >= PREDICTION_COUNT_THRESHOLD) {
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

    circularBuffer.push(serialData.payload.split(','));

    if (bufferCount === windowSize) {
      isBufferFilledOnce = true;
    }

    if (bufferIndex % 64 === 0 && isBufferFilledOnce) {
      // INFERENCE HERE
      let tensor = tf.tensor(circularBuffer.toarray(), [128, 9], 'float32');

      tensor = tensor.reshape([1, 128, 9, 1]);

      if (ml && tensor.shape[1] === 128 && tensor.shape[2] === 9) {
        const result = ml(tensor);
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
