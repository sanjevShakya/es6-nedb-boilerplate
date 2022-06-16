export function injectML(ml) {
  return function (request, response, next) {
    request.ml = ml;
    next();
  };
}
