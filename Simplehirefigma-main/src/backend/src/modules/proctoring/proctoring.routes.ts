/**
 * Proctoring Routes
 * Handles identity verification and session monitoring
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { verifyIdentity, monitorSession } from './proctoring.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/proctoring/verify-identity
 * Verifies identity using face matching against reference image
 */
router.post('/verify-identity', verifyIdentity);

/**
 * POST /api/proctoring/monitor
 * Continuous monitoring during interview
 */
router.post('/monitor', monitorSession);

export default router;
