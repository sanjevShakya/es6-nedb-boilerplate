import EventEmitter from 'events';
import * as serialUtil from './serialUtil';
import logger from '../../core/utils/logger';

const BAUD_RATE = 115200;
const PORT_NAMES = {
  left: 'LEFT',
  right: 'RIGHT',
};

export async function connect() {
  const devicesPort = (await serialUtil.getArduinoPorts()) || [];
  const leftPortPath = devicesPort[0];
  const rightPortPath = devicesPort[1];

  try {
    const serialEventEmitter = new EventEmitter();
    const { port, parser } = serialUtil.initialize(rightPortPath, BAUD_RATE);
    const { port: leftPort, parser: leftParser } = serialUtil.initialize(leftPortPath, BAUD_RATE);

    if (!port || !parser) {
      throw new Error('Device not connected');
    }

    if (!leftPort || !leftParser) {
      throw new Error('Left device not connected');
    }

    port.on('open', () => {
      portOpenHandler({ name: PORT_NAMES.right, port: rightPortPath, baudRate: BAUD_RATE, serialEventEmitter });
    });

    parser.on('data', (data) => {
      dataReceiveHandler({ data, name: PORT_NAMES.right, serialEventEmitter });
    });

    leftPort.on('open', () => {
      portOpenHandler({ name: PORT_NAMES.left, port: leftPortPath, baudRate: BAUD_RATE, serialEventEmitter });
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
