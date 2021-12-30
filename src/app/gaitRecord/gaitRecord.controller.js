import HttpStatus from 'http-status-codes';

import * as gaitRecordService from './gaitRecord.service';

/**
 * Get all gaitRecords.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
export function fetchAll(req, res, next) {
  gaitRecordService
    .getAllGaitRecords()
    .then((data) => res.json({ data }))
    .catch((err) => next(err));
}

/**
 * Get a gaitRecord by its id.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
export function fetchById(req, res, next) {
  gaitRecordService
    .getGaitRecord(req.params.id)
    .then((data) => res.json({ data }))
    .catch((err) => next(err));
}

/**
 * Create a new gaitRecord.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
export function create(req, res, next) {
  gaitRecordService
    .createGaitRecord(req.body)
    .then((data) => res.status(HttpStatus.CREATED).json({ data }))
    .catch((err) => next(err));
}

/**
 * Update a gaitRecord.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
export function update(req, res, next) {
  gaitRecordService
    .updateGaitRecord(req.params.id, req.body)
    .then(() => res.json({ data: req.body }))
    .catch((err) => next(err));
}

/**
 * Delete a gaitRecord.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
export function deleteGaitRecord(req, res, next) {
  gaitRecordService
    .deleteGaitRecord(req.params.id)
    .then((data) => res.status(HttpStatus.NO_CONTENT).json({ data }))
    .catch((err) => next(err));
}
