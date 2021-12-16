export const IOT_VERIFY = 'iot-vib/verify';
export const IOT_BROADCAST = 'iot-vib/broadcast';
export const IOT_BROADCAST_VERIFY = 'iot-vib/broadcast/verify';
export const IOT_UNVERIFIED_AVAILABLE_DEVICES = 'iot-vib/unverified-available-devices';
export const IOT_DEVICE_STATE = 'iot-vib/state';
export const IOT_DEVICE_GET_STATE = 'iot-vib/device';

export const TOPIC_CONFIG = {
  [IOT_BROADCAST]: {
    shouldSubscribe: true,
    name: IOT_BROADCAST
  },
  [IOT_VERIFY]: {
    shouldSubscribe: true,
    name: IOT_VERIFY
  },
  [IOT_DEVICE_GET_STATE]: {
    shouldSubscribe: true,
    name: IOT_DEVICE_GET_STATE
  }
};

export const TOPICS = [IOT_BROADCAST, IOT_VERIFY, IOT_DEVICE_GET_STATE];
