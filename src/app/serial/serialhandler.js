import EventEmitter from 'events';
import * as serialUtil from './serialUtil';
import logger from '../../core/utils/logger';

const BAUD_RATE = 115200;
const PORT = '/dev/ttyACM0';
const LEFT_PORT = '/dev/ttyACM1';
const PORT_NAMES = {
  left: 'LEFT',
  right: 'RIGHT',
};

export function connect() {
  try {
    const serialEventEmitter = new EventEmitter();
    const { port, parser } = serialUtil.initialize(PORT, BAUD_RATE);
    const { port: leftPort, parser: leftParser } = serialUtil.initialize(LEFT_PORT, BAUD_RATE);

    if (!port || !parser) {
      throw new Error('Device not connected');
    }

    if (!leftPort || !leftParser) {
      throw new Error('Left device not connected');
    }

    port.on('open', () => {
      portOpenHandler({ name: PORT_NAMES.right, port: PORT, baudRate: BAUD_RATE, serialEventEmitter });
    });

    parser.on('data', (data) => {
      dataReceiveHandler({ data, name: PORT_NAMES.right, serialEventEmitter });
    });

    leftPort.on('open', () => {
      portOpenHandler({ name: PORT_NAMES.left, port: PORT, baudRate: BAUD_RATE, serialEventEmitter });
    });

    leftParser.on('data', (data) => {
      dataReceiveHandler({ data, name: PORT_NAMES.left, serialEventEmitter });
    });

    return {
      port: port,
      parser: parser,
      leftPort: leftPort,
      leftParser: leftParser,
      serialEventEmitter: serialEventEmitter,
    };
  } catch (err) {
    logger.error('Error connecting to serial port. Is serial device attached?');

    // return null;
    throw err;
  }

  function portOpenHandler({ name, port, baudRate, serialEventEmitter }) {
    logger.info(`${name} foot Serial port open on ${port} at ${baudRate} baudrate`);
    const eventName = name + '_SERIAL_PORT_OPEN';

    serialEventEmitter.emit(eventName);
  }

  function dataReceiveHandler({ name, serialEventEmitter, data }) {
    const eventName = name + '_SERIAL_INPUT';

    serialEventEmitter.emit(eventName, data);
  }
}
