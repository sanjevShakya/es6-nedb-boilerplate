import mqtt from 'mqtt';
import logger from '../../core/utils/logger';
import { TOPICS, IOT_BROADCAST, IOT_DEVICE_GET_STATE } from '../../core/constants/topics';
import * as mqttService from './mqttService';

class MqttHandler {
  constructor() {
    this.client = null;
    this.host = 'mqtt://127.0.0.1';
    this.topics = TOPICS;
    this.username = '';
    this.password = '';
  }

  handleClientError(err) {
    // logger.error('error connecting to mqtt server');
    console.error(err);
    this.mqttClient.end();
  }

  handleConnect() {
    logger.info(`Mqtt Client connected`);
  }

  handleMessage(topic, message) {
    logger.info(`Message arrived in topic ${topic}`);
    const payload = message.toString('utf-8');
    const data = JSON.parse(payload);

    switch (topic) {
      case IOT_BROADCAST:
        mqttService.generateUnverifiedAvailableDevices(this.client, data, topic);
        break;
      case IOT_DEVICE_GET_STATE:
        mqttService.fetchDeviceState(this.client, data, topic);
        break;
    }
  }

  handleClose() {
    logger.info('Mqtt client disconnected');
  }

  connect() {
    this.client = mqtt.connect(this.host);
    this.client.on('error', this.handleClientError.bind(this));
    this.client.on('connect', this.handleConnect.bind(this));
    this.client.on('message', this.handleMessage.bind(this));
    this.client.on('close', this.handleClose.bind(this));
    this.topics.map((topic) => this.subscribe(topic));
  }

  sendMessage(topic, message) {
    this.client.publish(topic, message);
  }

  subscribe(topic, config = { qos: 0 }) {
    logger.info(`Subscribed to topic :${topic}`);
    this.client.subscribe(topic, config);
  }
}
export default MqttHandler;
