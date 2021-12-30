import GaitRecord from './gaitRecord.model';
import GaitRecordDTO from './gaitRecord.dto';

/**
 * Get all gaitRecords.
 *
 * @returns {Promise}
 */
export function getAllGaitRecords() {
  return GaitRecord.find();
}

/**
 * Get a gaitRecord.
 *
 * @param   {Number|String}  id
 * @returns {Promise}
 */
export function getGaitRecord(id) {
  return GaitRecord.find({ _id: id });
}

/**
 * Create new gaitRecord.
 *
 * @param   {Object}  gaitRecord
 * @returns {Promise}
 */
export function createGaitRecord(gaitRecord) {
  const newGaitRecord = new GaitRecordDTO(gaitRecord);

  return GaitRecord.insert(newGaitRecord);
}

/**
 * Update a gaitRecord.
 *
 * @param   {Number|String}  id
 * @param   {Object}         gaitRecord
 * @returns {Promise}
 */
export function updateGaitRecord(id, gaitRecord) {
  return GaitRecord.update({ _id: id }, { ...gaitRecord });
}

/**
 * Delete a gaitRecord.
 *
 * @param   {Number|String}  id
 * @returns {Promise}
 */
export function deleteGaitRecord(id) {
  return GaitRecord.remove({ _id: id });
}
