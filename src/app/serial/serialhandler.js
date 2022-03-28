import EventEmitter from 'events';
import * as serialUtil from './serialUtil';
import logger from '../../core/utils/logger';

const BAUD_RATE = 115200;
const PORT_NAMES = {
  left: 'LEFT',
  right: 'RIGHT',
};

function portOpenHandler({ name, port, baudRate, serialEventEmitter }) {
  logger.info(`${name} foot Serial port open on ${port} at ${baudRate} baudrate`);
  const eventName = name + '_SERIAL_PORT_OPEN';

  serialEventEmitter.emit(eventName);
}

function dataReceiveHandler({ name, serialEventEmitter, data }) {
  const eventName = name + '_SERIAL_INPUT';

  serialEventEmitter.emit(eventName, data);
}

// function initializePortAttachHandler(portPath, name, serialEventEmitter) {
//   const { port, parser } = serialUtil.initialize(portPath, BAUD_RATE);

//   if (!port || !parser) {
//     throw new Error(`${portPath}::Device not connected`);
//   }

//   port.on('open', () => {
//     portOpenHandler({ name: name, port: portPath, baudRate: BAUD_RATE, serialEventEmitter });
//   });

//   parser.on('data', (data) => {
//     dataReceiveHandler({ data, name: name, serialEventEmitter });
//   });
// }

export async function connect() {
  const devicesPort = (await serialUtil.getArduinoPorts()) || [];

  try {
    const serialEventEmitter = new EventEmitter();

    const serialInterfaces = devicesPort.map((devicePort, index) => {
      const { port, parser } = serialUtil.initialize(devicePort, BAUD_RATE);
      let deviceName;

      if (index === 0) {
        deviceName = PORT_NAMES.right;
        // assign right
      }

      if (index === 1) {
        // asign left
        deviceName = PORT_NAMES.left;
      }

      if (index > 1) {
        // assign anything
        deviceName = devicePort;
      }

      port.on('open', () => {
        portOpenHandler({ name: deviceName, port: devicePort, baudRate: BAUD_RATE, serialEventEmitter });
      });

      parser.on('data', (data) => {
        dataReceiveHandler({ data, name: deviceName, serialEventEmitter });
      });

      return {
        port,
        parser,
      };
    });

    return {
      serialEventEmitter,
      serialInterfaces,
    };
  } catch (err) {
    logger.error('Error connecting to serial port. Is serial device attached?');
    // return null;
    throw err;
  }
}
