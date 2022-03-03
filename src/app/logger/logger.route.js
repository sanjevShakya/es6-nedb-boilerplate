import { Router } from 'express';

import * as loggerController from './logger.controller';

const router = Router();

/**
 * GET /api/users.
 */
router.post('/reconnect', loggerController.reconnect);

export default router;
