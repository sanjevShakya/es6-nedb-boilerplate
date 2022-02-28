import logger from '../../core/utils/logger';
import * as serialEventNames from '../serial/serialEventNames';
import * as serialDataService from '../serial/serialDataService';

export const SENSORS = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
};

export const STATES = {
  INIT: 1,
  RECORD: 2,
  PAUSE: 3,
};

export const SOCKET_STATES = {
  initState: 'initState',
  connection: 'connection',
  serialData: 'serialData',
  stateChange: 'stateChange',
  gaitClassChange: 'gaitClassChange',
};

let subjectId = null;
let gaitClassId = null;
let state = STATES.INIT;
let leftSerialToFileLogger = (f) => f;
let rightSerialToFileLogger = (f) => f;

const SENSOR_SERIAL_HANDLER_MAP = {
  [SENSORS.LEFT]: leftSerialToFileLogger,
  [SENSORS.RIGHT]: rightSerialToFileLogger,
};

function serialStateHandler(currentState, serial) {
  switch (currentState) {
    case STATES.INIT:
      serial.port.write(`${STATES.INIT}:INIT\n`);
      serial.leftPort.write(`${STATES.INIT}:INIT\n`);
      break;
    case STATES.RECORD:
      serial.port.write(`${STATES.RECORD}:RECORD\n`);
      serial.leftPort.write(`${STATES.RECORD}:RECORD\n`);
      break;
    case STATES.PAUSE:
      serial.port.write(`${STATES.PAUSE}:PAUSE\n`);
      serial.leftPort.write(`${STATES.PAUSE}:PAUSE\n`);
      break;
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
    io.emit(SOCKET_STATES.serialData, { value: serialData.payload, sensorName: sensorName });
    const serialToFileLogger = SENSOR_SERIAL_HANDLER_MAP[sensorName];

    serialToFileLogger(serialData.payload + '\n');
  }
}

function handleAfterConnection(io, socket, serial) {
  socket.on(SOCKET_STATES.initState, function (data) {
    logger.info(SOCKET_STATES.initState, data);
    subjectId = data.subjectId;
    io.sockets.emit(SOCKET_STATES.stateChange, { value: STATES.INIT, subjectId: subjectId });
  });

  socket.on(SOCKET_STATES.stateChange, function (data) {
    state = +data.value;
    if (!subjectId) {
      subjectId = data.subjectId;
    }

    logger.info(`socket state change: ${state} for subject: ${subjectId}`);

    serialStateHandler(state, serial);

    io.sockets.emit(SOCKET_STATES.stateChange, { value: state });
  });

  socket.on(SOCKET_STATES.gaitClassChange, function (data) {
    gaitClassId = data.value;
    subjectId = data.subjectId;
    logger.info(`Gait class set to: ${gaitClassId}`);
    io.sockets.emit(SOCKET_STATES.gaitClassChange, { value: gaitClassId });
    io.sockets.emit(SOCKET_STATES.stateChange, { value: STATES.PAUSE });
    leftSerialToFileLogger = serialDataService.parseSaveAccelData(subjectId, gaitClassId, SENSORS.LEFT);
    rightSerialToFileLogger = serialDataService.parseSaveAccelData(subjectId, gaitClassId, SENSORS.RIGHT);
  });

  // socket.emit('led', { value: brightness });
  socket.emit(SOCKET_STATES.stateChange, { value: state });

  serial.serialEventEmitter.on(serialEventNames.RIGHT_SERIAL_INPUT, (data) =>
    serialDataInputHandler(SENSORS.LEFT, data, io)
  );
  serial.serialEventEmitter.on(serialEventNames.LEFT_SERIAL_INPUT, (data) =>
    serialDataInputHandler(SENSORS.RIGHT, data, io)
  );
}

export function handleSerialSocketBridge(io, serial) {
  if (!serial) {
    return;
  }

  io.sockets.on(SOCKET_STATES.connection, (socket) => handleAfterConnection(io, socket, serial));
}
