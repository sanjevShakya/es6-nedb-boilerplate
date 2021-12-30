import { Router } from 'express';

import * as gaitRecordController from './gaitRecord.controller';
import { findGaitRecord, gaitRecordValidator } from './gaitRecrod.validator';

const router = Router();

/**
 * GET /api/gaitRecords.
 */
router.get('/', gaitRecordController.fetchAll);

/**
 * GET /api/gaitRecords/:id.
 */
router.get('/:id', gaitRecordController.fetchById);

/**
 * POST /api/gaitRecords.
 */
router.post('/', gaitRecordValidator, gaitRecordController.create);

/**
 * PUT /api/gaitRecords/:id.
 */
router.put('/:id', findGaitRecord, gaitRecordValidator, gaitRecordController.update);

/**
 * DELETE /api/gaitRecords/:id.
 */
router.delete('/:id', findGaitRecord, gaitRecordController.deleteGaitRecord);

export default router;
