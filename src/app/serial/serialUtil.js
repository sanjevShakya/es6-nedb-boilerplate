import { ReadlineParser } from '@serialport/parser-readline';
import { SerialPort } from 'serialport';

export function getArduinoPorts() {
  return SerialPort.list().then((ports) => {
    return ports.filter((val) => val.manufacturer === 'Arduino').map((val) => val.path);
  });
}

export function initialize(portNum, baudRate) {
  const serialPort = new SerialPort({ path: portNum, baudRate: baudRate });

  return {
    port: serialPort,
    parser: serialPort.pipe(new ReadlineParser({ delimiter: '\n' })),
  };
}
