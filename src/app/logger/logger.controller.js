import * as loggerService from './logger.service';

/**
 * Get all users.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
export function reconnect(req, res, next) {
  loggerService
    .reconnect(req)
    .then((data) => res.json({ data }))
    .catch((err) => next(err));
}
