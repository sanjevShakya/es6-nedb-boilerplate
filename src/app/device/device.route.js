import { Router } from 'express';

import * as deviceController from './device.controller';
import { findDevice, deviceValidator } from './device.validator';

const router = Router();

/**
 * GET /api/devices.
 */
router.get('/', deviceController.fetchAll);

/**
 * GET /api/devices/:id.
 */
router.get('/:id', deviceController.fetchById);

/**
 * POST /api/devices.
 */
router.post('/', deviceValidator, deviceController.create);

/**
 * PUT /api/devices/:id.
 */
router.put('/:id', findDevice, deviceValidator, deviceController.update);

/**
 * DELETE /api/devices/:id.
 */
router.delete('/:id', findDevice, deviceController.deleteDevice);

export default router;
