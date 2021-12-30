import HttpStatus from 'http-status-codes';

import * as subjectService from './subject.service';

/**
 * Get all Subjects.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
export function fetchAll(req, res, next) {
  subjectService
    .getAllSubjects()
    .then((data) => res.json({ data }))
    .catch((err) => next(err));
}

/**
 * Get a subject by its id.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
export function fetchById(req, res, next) {
  subjectService
    .getSubject(req.params.id)
    .then((data) => res.json({ data }))
    .catch((err) => next(err));
}

/**
 * Create a new subject.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
export function create(req, res, next) {
  subjectService
    .createSubject(req.body)
    .then((data) => res.status(HttpStatus.CREATED).json({ data }))
    .catch((err) => next(err));
}

/**
 * Update a subject.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
export function update(req, res, next) {
  subjectService
    .updateSubject(req.params.id, req.body)
    .then(() => res.json({ data: req.body }))
    .catch((err) => next(err));
}

/**
 * Delete a subject.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
export function deleteSubject(req, res, next) {
  subjectService
    .deleteSubject(req.params.id)
    .then((data) => res.status(HttpStatus.NO_CONTENT).json({ data }))
    .catch((err) => next(err));
}
