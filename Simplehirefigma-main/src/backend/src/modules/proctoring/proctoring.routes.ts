/**
 * Proctoring Routes
 * Routes for identity verification and session monitoring
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { proctoringController } from './proctoring.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/proctoring/verify-identity
 * Verify candidate identity by comparing face with ID card
 *
 * Body:
 * - interviewId: Interview ID
 * - referenceImageBase64: Base64 encoded ID card image
 * - liveImageBase64: Base64 encoded live face capture
 */
router.post('/verify-identity', proctoringController.verifyIdentity);

/**
 * POST /api/proctoring/monitor
 * Monitor interview session for proctoring violations
 *
 * Body:
 * - interviewId: Interview ID
 * - referenceImageBase64: Base64 encoded reference image
 * - liveImageBase64: Base64 encoded live face capture
 */
router.post('/monitor', proctoringController.monitorSession);

export default router;
