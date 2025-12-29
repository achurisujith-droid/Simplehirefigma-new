import { Router } from 'express';
import { validateRequest } from '../../middleware/zodValidation';
import { authenticate } from '../../middleware/auth';
import { sessionHeartbeatSchema, sessionExpireSchema } from '../../utils/validation.schemas';
import * as sessionController from './session.controller';

const router = Router();

router.post('/heartbeat', validateRequest(sessionHeartbeatSchema), sessionController.heartbeat);
router.post('/expire', validateRequest(sessionExpireSchema), sessionController.expireSession);
router.get('/:sessionId/status', sessionController.getSessionStatus);
router.get('/user-sessions', authenticate, sessionController.getUserSessions);

export default router;
