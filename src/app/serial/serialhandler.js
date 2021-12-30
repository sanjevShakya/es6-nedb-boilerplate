import EventEmitter from 'events';
import * as serialUtil from './serialUtil';
import * as serialEventNames from './serialEventNames';
import logger from '../../core/utils/logger';

const BAUD_RATE = 9600;
const PORT = '/dev/ttyACM0';

export function connect() {
  try {
    const serialEventEmitter = new EventEmitter();
    const { port, parser } = serialUtil.initialize(PORT, BAUD_RATE);

    port.on('open', () => {
      logger.info(`Serial port open on ${PORT} at ${BAUD_RATE} baudrate`);

      serialEventEmitter.emit(serialEventNames.SERIAL_PORT_OPEN);
    });

    parser.on('data', (data) => {
      serialEventEmitter.emit(serialEventNames.SERIAL_INPUT, data);
    });

    serialEventEmitter.on('write', (data) => {
      port.write(data, (err) => {
        if (err) {
          return serialEventEmitter.emit(serialEventNames.SERIAL_WRITE_FAIL, err);
        }

        return serialEventEmitter.emit(serialEventNames.SERIAL_WRITE_SUCCESS);
      });
    });

    return {
      port: port,
      parser: parser,
      serialEventEmitter: serialEventEmitter,
    };
  } catch (err) {
    logger.error('Error connecting to serial port. Is serial device attached?');

    return null;
  }
}
