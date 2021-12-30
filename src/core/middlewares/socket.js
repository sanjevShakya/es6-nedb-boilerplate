export function injectSocketObject(io) {
  return function (request, response, next) {
    request.io = io;
    next();
  };
}
