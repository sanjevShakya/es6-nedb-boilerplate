import * as topics from '../../core/constants/topics';
import * as deviceService from '../device/device.service';
import _get from 'lodash.get';

const availableDevices = {};

const validDevices = {};

export const fetchDeviceState = async (client, data) => {
  const deviceMacId = data.deviceMACId;

  if (deviceMacId) {
    let device = await deviceService.getDeviceByMacId(deviceMacId, false);

    if (device) {
      device = _get(device, 'attributes', {});
      const devicePayload = {
        deviceMACId: device.macId,
        minVibration: device.minVibrationAmplitude,
        maxVibration: device.maxVibrationAmplitude,
        tolerableSleepDuration: device.tolerableSleepDuration
      };

      client.publish(topics.IOT_DEVICE_STATE, JSON.stringify(devicePayload));
    }
  }
};

export const generateUnverifiedAvailableDevices = async (client, data) => {
  const deviceMacId = data.deviceMACId;

  if (deviceMacId) {
    const device = await deviceService.getDeviceByMacId(deviceMacId, false);

    if (device) {
      validDevices[deviceMacId] = {
        isVerified: true
      };
      delete availableDevices[deviceMacId];
    }
  }

  if (!(availableDevices && availableDevices[deviceMacId])) {
    availableDevices[deviceMacId] = data;
  }
  const isDeviceValid = validDevices[deviceMacId] ? validDevices[deviceMacId].isVerified : false;

  if (!(validDevices[deviceMacId] && isDeviceValid)) {
    client.publish(topics.IOT_UNVERIFIED_AVAILABLE_DEVICES, JSON.stringify(availableDevices));
  } else {
    const verifiedPayload = {
      deviceMACId: deviceMacId,
      verified: true
    };

    client.publish(topics.IOT_BROADCAST_VERIFY, JSON.stringify(verifiedPayload));
  }
};
