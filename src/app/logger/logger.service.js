import * as serialhandler from '../serial/serialhandler';
import { handleSerialSocketBridge } from '../serialSocketBridge/bridge';

export async function reconnect(req) {
  const serialObj = await serialhandler.connect();
  const io = req.io;
  const serial = serialObj;

  handleSerialSocketBridge(io, serial);
}
