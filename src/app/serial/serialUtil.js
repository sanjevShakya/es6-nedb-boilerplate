import Serialport from 'serialport';
import Readline from '@serialport/parser-readline';

export function initialize(portNum, baudRate) {
  const serialPort = new Serialport(portNum, { baudRate: baudRate });

  return {
    port: serialPort,
    parser: serialPort.pipe(new Readline({ delimiter: '\n' })),
  };
}
