import Boom from '@hapi/boom';

import Device from './device.model';

/**
 * Get all devices.
 *
 * @returns {Promise}
 */
export function getAllDevices() {
  return Device.fetchAll();
}

/**
 * Get a device.
 *
 * @param   {Number|String}  id
 * @returns {Promise}
 */
export function getDevice(id) {
  return new Device({ id })
    .fetch()
    .then((device) => device)
    .catch(Device.NotFoundError, () => {
      throw Boom.notFound('Device not found');
    });
}

/**
 * Get a device by MAC id.
 *
 * @param {Number|String}  macId
 * @param {boolean} throwErr
 * @returns {Promise}
 */
export function getDeviceByMacId(macId, throwErr = true) {
  return new Device({ macId })
    .fetch()
    .then((device) => device)
    .catch(Device.NotFoundError, () => {
      if (throwErr) {
        throw Boom.notFound('Device not found');
      }

      return null;
    });
}

/**
 * Create new device.
 *
 * @param   {Object}  device
 * @returns {Promise}
 */
export function createDevice(device) {
  return new Device(device).save();
}

/**
 * Update a device.
 *
 * @param   {Number|String}  id
 * @param   {Object}         device
 * @returns {Promise}
 */
export function updateDevice(id, device) {
  return new Device({ id }).save(device);
}

/**
 * Delete a device.
 *
 * @param   {Number|String}  id
 * @returns {Promise}
 */
export function deleteDevice(id) {
  return new Device({ id }).fetch().then((device) => device.destroy());
}
