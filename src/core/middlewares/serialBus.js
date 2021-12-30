export function injectSerial(serial) {
  return function (request, response, next) {
    request.serial = serial;
    next();
  };
}
