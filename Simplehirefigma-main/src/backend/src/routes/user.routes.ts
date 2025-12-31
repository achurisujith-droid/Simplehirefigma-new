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
  validate([
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').not().exists().withMessage('Email cannot be updated')
  ]),
  userController.updateProfile
);

router.get('/me/products', userController.getPurchasedProducts);

// Add validation for interview progress
router.patch(
  '/me/interview-progress',
  validate([
    body('documentsUploaded').optional().isBoolean().withMessage('documentsUploaded must be boolean'),
    body('voiceInterview').optional().isBoolean().withMessage('voiceInterview must be boolean'),
    body('mcqTest').optional().isBoolean().withMessage('mcqTest must be boolean'),
    body('codingChallenge').optional().isBoolean().withMessage('codingChallenge must be boolean'),
    body().custom((value) => {
      const validKeys = ['documentsUploaded', 'voiceInterview', 'mcqTest', 'codingChallenge'];
      const keys = Object.keys(value);
      const hasInvalid = keys.some(key => !validKeys.includes(key));
      if (hasInvalid) {
        throw new Error('Invalid fields in interview progress');
      }
      return true;
    })
  ]),
  userController.updateInterviewProgress
);

// Add validation for ID verification status
router.patch(
  '/me/id-verification-status',
  validate([
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(['not-started', 'in-progress', 'completed', 'failed'])
      .withMessage('Invalid status value')
  ]),
  userController.updateIdVerificationStatus
);

// Add validation for reference check status
router.patch(
  '/me/reference-check-status',
  validate([
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(['not-started', 'in-progress', 'completed', 'failed'])
      .withMessage('Invalid status value')
  ]),
  userController.updateReferenceCheckStatus
);

export default router;
