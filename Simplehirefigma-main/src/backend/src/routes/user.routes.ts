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

// Interview progress validation
router.patch(
  '/me/interview-progress',
  validate([
    body('documentsUploaded').optional().isBoolean().withMessage('documentsUploaded must be boolean'),
    body('voiceInterview').optional().isBoolean().withMessage('voiceInterview must be boolean'),
    body('mcqTest').optional().isBoolean().withMessage('mcqTest must be boolean'),
    body('codingChallenge').optional().isBoolean().withMessage('codingChallenge must be boolean'),
    body().custom((value) => {
      const validKeys = ['documentsUploaded', 'voiceInterview', 'mcqTest', 'codingChallenge'];
      const hasInvalid = Object.keys(value).some(key => !validKeys.includes(key));
      if (hasInvalid) {
        throw new Error('Invalid fields in interview progress');
      }
      return true;
    })
  ]),
  userController.updateInterviewProgress
);

// ID verification status validation
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

// Reference check status validation
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
