import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';
import { Response, NextFunction } from 'express';
import { uploadFile } from '../utils/fileUpload';
import config from '../config';
import { AppError } from '../utils/errors';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: config.fileUpload.maxFileSize },
});

// All routes require authentication
router.use(authenticate);

// Upload documents
router.post('/documents', upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'coverLetter', maxCount: 1 }
]), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files.resume) {
      throw new AppError('Resume is required', 400, 'VALIDATION_ERROR');
    }

    const resumeResult = await uploadFile(files.resume[0], 'resumes');
    let coverLetterUrl;

    if (files.coverLetter) {
      const coverResult = await uploadFile(files.coverLetter[0], 'cover-letters');
      coverLetterUrl = coverResult.url;
    }

    res.json({
      success: true,
      data: {
        resumeUrl: resumeResult.url,
        ...(coverLetterUrl && { coverLetterUrl }),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Start voice interview
router.post('/voice/start', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body;

    // Create interview session
    // Return interview questions
    res.json({
      success: true,
      data: {
        sessionId: 'session_' + Date.now(),
        questions: [
          { id: 'q1', question: 'Tell me about your experience with ' + role, category: 'experience' },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
});

// Submit voice interview
router.post('/voice/submit', upload.single('audio'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('Audio file is required', 400, 'VALIDATION_ERROR');
    }

    const audioResult = await uploadFile(req.file, 'interviews');

    res.json({
      success: true,
      message: 'Interview submitted for evaluation',
    });
  } catch (error) {
    next(error);
  }
});

// Get MCQ questions
router.get('/mcq', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role } = req.query;

    // In production, fetch from database
    res.json({
      success: true,
      data: [
        {
          id: 'mcq_1',
          question: 'What is React?',
          options: ['A library', 'A framework', 'A language', 'An IDE'],
          category: 'react',
          difficulty: 'easy',
        },
      ],
    });
  } catch (error) {
    next(error);
  }
});

// Submit MCQ test
router.post('/mcq/submit', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { answers } = req.body;

    // Calculate score
    res.json({
      success: true,
      data: {
        score: 18,
        totalQuestions: 20,
        percentage: 90,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get coding challenge
router.get('/coding', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: {
        id: 'coding_1',
        title: 'Create a Todo Component',
        description: 'Implement a functional React component...',
        difficulty: 'medium',
        starterCode: 'import React from "react";\n\nfunction Todo() {\n  // Your code here\n}\n\nexport default Todo;',
        testCases: [],
      },
    });
  } catch (error) {
    next(error);
  }
});

// Submit coding challenge
router.post('/coding/submit', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: {
        passed: true,
        testResults: [],
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get evaluation results
router.get('/evaluation', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: [
        { category: 'React Fundamentals', score: 92, feedback: 'Excellent' },
        { category: 'JavaScript', score: 88, feedback: 'Strong skills' },
      ],
    });
  } catch (error) {
    next(error);
  }
});

// Generate certificate
router.post('/certificate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const certificateNumber = 'SH-' + new Date().getFullYear() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();

    res.json({
      success: true,
      data: {
        certificateId: 'cert_' + Date.now(),
        certificateUrl: `${config.appUrl}/certificate/${certificateNumber}`,
        certificateNumber,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
