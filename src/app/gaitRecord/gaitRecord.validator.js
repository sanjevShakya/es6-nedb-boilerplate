import Joi from '@hapi/joi';

import validate from '../../core/utils/validate';
import * as gaitRecordService from './gaitRecord.service';

// Validation schema
const schema = Joi.object({
  subjectId: Joi.string().label('subjectId').required(),
  fileName: Joi.string().label('fileName').max(90),
  classificationId: Joi.number().label('classificationId').max(100),
});

/**
 * Validate create/update gaitRecord request.
 *
 * @param   {Object}   req
 * @param   {Object}   res
 * @param   {Function} next
 * @returns {Promise}
 */
function gaitRecordValidator(req, res, next) {
  return validate(req.body, schema)
    .then(() => next())
    .catch((err) => next(err));
}

/**
 * Validate gaitRecords existence.
 *
 * @param   {Object}   req
 * @param   {Object}   res
 * @param   {Function} next
 * @returns {Promise}
 */
function findGaitRecord(req, res, next) {
  return gaitRecordService
    .getGaitRecord(req.params.id)
    .then(() => next())
    .catch((err) => next(err));
}

export { findGaitRecord, gaitRecordValidator };
