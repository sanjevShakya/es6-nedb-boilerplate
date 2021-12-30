import { Router } from 'express';

import swaggerSpec from './core/utils/swagger';
import userRoutes from './app/user/user.route';
import subjectRoutes from './app/subject/subject.route';

/**
 * Contains all API routes for the application.
 */
const router = Router();

/**
 * GET /api/swagger.json.
 */
router.get('/swagger.json', (req, res) => {
  res.json(swaggerSpec);
});

/**
 * GET /api.
 */
router.get('/', (req, res) => {
  res.json({
    app: req.app.locals.title,
    apiVersion: req.app.locals.version,
  });
});

router.use('/users', userRoutes);
router.use('/subjects', subjectRoutes);

export default router;
