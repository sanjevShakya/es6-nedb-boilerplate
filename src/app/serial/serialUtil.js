import Serialport from 'serialport';
import Readline from '@serialport/parser-readline';

export function initialize(portNum, baudRate) {
  const serialPort = new Serialport(portNum, { baudRate: baudRate });
  const portConnected = serialPort.port;

  if (!portConnected) {
    return {
      port: null,
      parser: null,
    };
  }

  return {
    port: serialPort,
    parser: serialPort.pipe(new Readline({ delimiter: '\n' })),
  };
}
