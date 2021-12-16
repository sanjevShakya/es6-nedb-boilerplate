import Joi from '@hapi/joi';

import validate from '../../core/utils/validate';
import * as userService from './user.service';

// Validation schema
const schema = Joi.object({
  name: Joi.string().label('Name').max(90).required()
});

/**
 * Validate create/update user request.
 *
 * @param   {Object}   req
 * @param   {Object}   res
 * @param   {Function} next
 * @returns {Promise}
 */
function userValidator(req, res, next) {
  return validate(req.body, schema)
    .then(() => next())
    .catch((err) => next(err));
}

/**
 * Validate users existence.
 *
 * @param   {Object}   req
 * @param   {Object}   res
 * @param   {Function} next
 * @returns {Promise}
 */
function findUser(req, res, next) {
  return userService
    .getUser(req.params.id)
    .then(() => next())
    .catch((err) => next(err));
}

export { findUser, userValidator };
