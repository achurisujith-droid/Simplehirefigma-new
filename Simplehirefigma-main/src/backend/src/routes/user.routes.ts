import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import * as userController from '../controllers/user.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/me/data', userController.getUserData);
router.patch(
  '/me',
  validate([body('name').optional().trim().isLength({ min: 2 })]),
  userController.updateProfile
);
router.get('/me/products', userController.getPurchasedProducts);
router.patch('/me/interview-progress', userController.updateInterviewProgress);
router.patch('/me/id-verification-status', userController.updateIdVerificationStatus);
router.patch('/me/reference-check-status', userController.updateReferenceCheckStatus);

export default router;
