export function injectMqttClient(mqttClient) {
  return function (request, response, next) {
    request.mqttClient = mqttClient;
    next();
  };
}
