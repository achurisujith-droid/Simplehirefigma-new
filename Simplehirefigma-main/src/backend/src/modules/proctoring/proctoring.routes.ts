/**
 * Proctoring Routes
 * DISABLED: causes class extension error - all routes disabled as quickfix
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// All proctoring routes disabled due to class extension error
// TODO: Fix the BaseRule and FaceMatchingRule class extension issue in the proctoring engine

export default router;
