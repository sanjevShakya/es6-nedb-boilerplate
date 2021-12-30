import { Router } from 'express';

import * as subjectController from './subject.controller';
import { findSubject, subjectValidator } from './subject.validator';

const router = Router();

/**
 * GET /api/subjects.
 */
router.get('/', subjectController.fetchAll);

/**
 * GET /api/subjects/:id.
 */
router.get('/:id', subjectController.fetchById);

/**
 * POST /api/subjects.
 */
router.post('/', subjectValidator, subjectController.create);

/**
 * PUT /api/subjects/:id.
 */
router.put('/:id', findSubject, subjectValidator, subjectController.update);

/**
 * DELETE /api/subjects/:id.
 */
router.delete('/:id', findSubject, subjectController.deleteSubject);

export default router;
