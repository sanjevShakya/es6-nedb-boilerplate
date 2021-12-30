import Joi from '@hapi/joi';

import validate from '../../core/utils/validate';
import * as subjectService from './subject.service';

// Validation schema
const schema = Joi.object({
  firstname: Joi.string().label('firstname').max(90).required(),
  lastname: Joi.string().label('lastname').max(90),
  age: Joi.number().label('age').max(100),
  height: Joi.number().label('height').max(200),
  weight: Joi.number().label('weight').max(200),
});

/**
 * Validate create/update subject request.
 *
 * @param   {Object}   req
 * @param   {Object}   res
 * @param   {Function} next
 * @returns {Promise}
 */
function subjectValidator(req, res, next) {
  return validate(req.body, schema)
    .then(() => next())
    .catch((err) => next(err));
}

/**
 * Validate subjects existence.
 *
 * @param   {Object}   req
 * @param   {Object}   res
 * @param   {Function} next
 * @returns {Promise}
 */
function findSubject(req, res, next) {
  return subjectService
    .getSubject(req.params.id)
    .then(() => next())
    .catch((err) => next(err));
}

export { findSubject, subjectValidator };
