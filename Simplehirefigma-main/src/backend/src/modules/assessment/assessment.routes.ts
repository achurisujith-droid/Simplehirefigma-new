/**
 * Assessment Routes
 * Routes for assessment plan creation and management
 */

import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/auth';
import { assessmentController } from './assessment.controller';
import config from '../../config';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.fileUpload.maxFileSize,
  },
});

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/interviews/start-assessment
 * Start a new assessment by uploading resume and optional ID card
 * 
 * Form fields:
 * - resume: Resume file (PDF/DOCX) - required
 * - idCard: ID card image - optional
 */
router.post(
  '/start-assessment',
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'idCard', maxCount: 1 },
  ]),
  assessmentController.startAssessment
);

export default router;
