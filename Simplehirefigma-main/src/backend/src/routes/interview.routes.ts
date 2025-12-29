import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';
import { Response, NextFunction } from 'express';
import { uploadFile } from '../utils/fileUpload';
import config from '../config';
import { AppError } from '../utils/errors';
import prisma from '../config/database';
import { mcqGeneratorService } from '../modules/assessment/mcq-generator.service';
import { codeGeneratorService } from '../modules/assessment/code-generator.service';
import { componentEvaluatorService } from '../modules/assessment/component-evaluator.service';
import { interviewEvaluatorService } from '../modules/assessment/interview-evaluator.service';

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

// Get MCQ questions - DYNAMIC GENERATION
router.get('/mcq', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get or create assessment plan for this user
    const assessmentPlan = await prisma.assessmentPlan.findFirst({
      where: { userId: req.user!.id, status: 'DRAFT' },
      orderBy: { createdAt: 'desc' }
    });

    if (!assessmentPlan || !assessmentPlan.interviewPlan) {
      throw new AppError('No assessment plan found. Please upload your resume first.', 404, 'NOT_FOUND');
    }

    const plan = assessmentPlan.interviewPlan as any;
    
    // Check if MCQ questions already exist
    if (plan.mcqQuestions && Array.isArray(plan.mcqQuestions) && plan.mcqQuestions.length > 0) {
      // Return existing questions without correctAnswerIndex
      return res.json({
        success: true,
        data: plan.mcqQuestions.map((q: any) => ({
          id: q.id,
          question: q.questionText,
          options: q.options,
          category: q.skillCategory,
          difficulty: q.difficulty,
        }))
      });
    }

    const classification = plan.classification;
    if (!classification) {
      throw new AppError('Assessment plan is incomplete', 400, 'VALIDATION_ERROR');
    }

    // Generate MCQ questions using the MCQ generator service
    const mcqQuestions = await mcqGeneratorService.generateMCQQuestions(
      classification,
      plan.questionCounts?.mcq || 12,
      plan.difficulty,
      plan.topics || []
    );

    // Store questions in assessment plan (with correct answers)
    await prisma.assessmentPlan.update({
      where: { id: assessmentPlan.id },
      data: {
        interviewPlan: {
          ...plan,
          mcqQuestions
        }
      }
    });

    // Return questions without correct answers
    res.json({
      success: true,
      data: mcqQuestions.map(q => ({
        id: q.id,
        question: q.questionText,
        options: q.options,
        category: q.skillCategory,
        difficulty: q.difficulty,
      }))
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

// Get coding challenge - DYNAMIC GENERATION
router.get('/coding', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const assessmentPlan = await prisma.assessmentPlan.findFirst({
      where: { userId: req.user!.id, status: 'DRAFT' },
      orderBy: { createdAt: 'desc' }
    });

    if (!assessmentPlan || !assessmentPlan.interviewPlan) {
      throw new AppError('No assessment plan found. Please upload your resume first.', 404, 'NOT_FOUND');
    }

    const plan = assessmentPlan.interviewPlan as any;
    
    // Check if coding challenges already exist
    if (plan.codingChallenges && Array.isArray(plan.codingChallenges) && plan.codingChallenges.length > 0) {
      // Return existing challenges
      return res.json({
        success: true,
        data: plan.codingChallenges.map((c: any) => ({
          id: c.id,
          title: c.questionText ? c.questionText.split('\n')[0].substring(0, 100) : 'Coding Challenge',
          description: c.questionText,
          difficulty: c.difficulty,
          evaluationCriteria: c.evaluationCriteria,
          language: c.language,
          starterCode: c.starterCode || '',
          testCases: c.testCases || []
        }))
      });
    }

    const classification = plan.classification;
    if (!classification) {
      throw new AppError('Assessment plan is incomplete', 400, 'VALIDATION_ERROR');
    }

    // Generate coding challenges
    const codingChallenges = await codeGeneratorService.generateCodingChallenges(
      classification,
      plan.questionCounts?.code || 2,
      plan.taskStyle || 'implement_function',
      classification.primaryLanguages?.[0] || 'JavaScript'
    );

    // Store challenges
    await prisma.assessmentPlan.update({
      where: { id: assessmentPlan.id },
      data: {
        interviewPlan: {
          ...plan,
          codingChallenges
        }
      }
    });

    res.json({
      success: true,
      data: codingChallenges.map(c => ({
        id: c.id,
        title: c.questionText ? c.questionText.split('\n')[0].substring(0, 100) : 'Coding Challenge',
        description: c.questionText,
        difficulty: c.difficulty,
        evaluationCriteria: c.evaluationCriteria,
        language: c.language,
        starterCode: c.starterCode || '',
        testCases: c.testCases || []
      }))
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

// POST /api/interviews/evaluate - Comprehensive interview evaluation with multi-LLM arbiter
router.post('/evaluate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      voiceAnswers,
      mcqAnswers,
      codingAnswers,
      candidateProfile,
      componentScores,
      useMultiLLM,
    } = req.body;

    // Validate required data
    if (!candidateProfile) {
      throw new AppError('candidateProfile is required', 400, 'VALIDATION_ERROR');
    }

    // Perform comprehensive evaluation
    const evaluation = await interviewEvaluatorService.evaluateInterview(
      {
        voiceAnswers,
        mcqAnswers,
        codingAnswers,
        candidateProfile,
        componentScores,
      },
      useMultiLLM
    );

    // Store evaluation in the latest assessment plan
    const assessmentPlan = await prisma.assessmentPlan.findFirst({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    if (assessmentPlan) {
      const plan = assessmentPlan.interviewPlan as any;
      await prisma.assessmentPlan.update({
        where: { id: assessmentPlan.id },
        data: {
          interviewPlan: {
            ...plan,
            evaluation: evaluation,
          },
          status: 'COMPLETED',
        },
      });
    }

    res.json({
      success: true,
      data: {
        overallScore: evaluation.overallScore,
        skillLevel: evaluation.skillLevel,
        categoryScores: evaluation.categoryScores,
        componentScores: evaluation.componentScores,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        recommendation: evaluation.recommendation,
        rationale: evaluation.rationale,
        multiLLMEnabled: evaluation.multiLLMEnabled,
        providersUsed: evaluation.providersUsed,
        evaluatedAt: evaluation.evaluatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/interviews/:interviewId/re-evaluate - Admin re-evaluation endpoint
router.post('/:interviewId/re-evaluate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { interviewId } = req.params;
    const { forceMultiLLM } = req.body;

    // TODO: Add admin authentication check here
    // For now, we allow authenticated users to re-evaluate their own interviews

    // Get the assessment plan
    const assessmentPlan = await prisma.assessmentPlan.findFirst({
      where: {
        id: interviewId,
        userId: req.user!.id, // Ensure user owns this assessment
      },
    });

    if (!assessmentPlan) {
      throw new AppError('Assessment plan not found', 404, 'NOT_FOUND');
    }

    const plan = assessmentPlan.interviewPlan as any;

    // Prepare evaluation input from stored data
    const evaluationInput = {
      voiceAnswers: plan.voiceAnswers || [],
      mcqAnswers: plan.mcqAnswers?.map((q: any, idx: number) => ({
        questionId: q.id,
        questionText: q.questionText,
        selectedAnswer: plan.mcqUserAnswers?.[idx],
        correctAnswer: q.options[q.correctAnswerIndex],
        isCorrect: plan.mcqUserAnswers?.[idx] === q.correctAnswerIndex,
      })) || [],
      codingAnswers: plan.codingAnswers || [],
      candidateProfile: {
        role: plan.classification?.roleCategory || 'Unknown',
        experience: `${plan.classification?.yearsExperience || 0} years`,
        skills: plan.classification?.keySkills || [],
      },
    };

    // Re-evaluate with multi-LLM arbiter
    const evaluation = await interviewEvaluatorService.reEvaluateInterview(
      evaluationInput,
      forceMultiLLM ?? true
    );

    // Update assessment plan with new evaluation
    await prisma.assessmentPlan.update({
      where: { id: assessmentPlan.id },
      data: {
        interviewPlan: {
          ...plan,
          evaluation: evaluation,
          reEvaluatedAt: new Date().toISOString(),
        },
      },
    });

    res.json({
      success: true,
      data: {
        message: 'Interview re-evaluated successfully',
        evaluation: {
          overallScore: evaluation.overallScore,
          skillLevel: evaluation.skillLevel,
          categoryScores: evaluation.categoryScores,
          strengths: evaluation.strengths,
          improvements: evaluation.improvements,
          recommendation: evaluation.recommendation,
          rationale: evaluation.rationale,
          multiLLMEnabled: evaluation.multiLLMEnabled,
          providersUsed: evaluation.providersUsed,
          evaluatedAt: evaluation.evaluatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/interviews/mcq/evaluate - Evaluate MCQ answer
router.post('/mcq/evaluate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { questionId, selectedOptionIndex } = req.body;
    
    if (typeof selectedOptionIndex !== 'number') {
      throw new AppError('selectedOptionIndex is required', 400, 'VALIDATION_ERROR');
    }
    
    // Get stored question with correct answer
    const assessmentPlan = await prisma.assessmentPlan.findFirst({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!assessmentPlan || !assessmentPlan.interviewPlan) {
      throw new AppError('Assessment plan not found', 404, 'NOT_FOUND');
    }

    const mcqQuestions = (assessmentPlan.interviewPlan as any)?.mcqQuestions || [];
    const question = mcqQuestions.find((q: any) => q.id === questionId);

    if (!question) {
      throw new AppError('Question not found', 404, 'NOT_FOUND');
    }

    // Evaluate using component evaluator
    const evaluation = await componentEvaluatorService.evaluateMCQAnswer(
      question.questionText,
      question.options,
      question.correctAnswerIndex,
      selectedOptionIndex
    );

    res.json({
      success: true,
      data: {
        isCorrect: evaluation.isCorrect,
        feedback: evaluation.feedback,
        score: evaluation.rawScore
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/interviews/coding/evaluate - Evaluate coding submission
router.post('/coding/evaluate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { challengeId, code, language } = req.body;
    
    if (!code || !language) {
      throw new AppError('code and language are required', 400, 'VALIDATION_ERROR');
    }
    
    // Get stored challenge
    const assessmentPlan = await prisma.assessmentPlan.findFirst({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!assessmentPlan || !assessmentPlan.interviewPlan) {
      throw new AppError('Assessment plan not found', 404, 'NOT_FOUND');
    }

    const codingChallenges = (assessmentPlan.interviewPlan as any)?.codingChallenges || [];
    const challenge = codingChallenges.find((c: any) => c.id === challengeId);

    if (!challenge) {
      throw new AppError('Challenge not found', 404, 'NOT_FOUND');
    }

    // Evaluate using LLM
    const evaluation = await componentEvaluatorService.evaluateCodeAnswer(
      challenge.questionText,
      language,
      challenge.evaluationCriteria,
      code
    );

    const score = componentEvaluatorService.calculateCodeScore(evaluation);

    res.json({
      success: true,
      data: {
        score,
        dimensions: evaluation.dimensions,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/interviews/assessment-plan/:sessionId - Get assessment plan details
router.get('/assessment-plan/:sessionId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    
    const assessmentPlan = await prisma.assessmentPlan.findUnique({
      where: { id: sessionId }
    });

    if (!assessmentPlan) {
      throw new AppError('Assessment plan not found', 404, 'NOT_FOUND');
    }

    // Verify ownership
    if (assessmentPlan.userId !== req.user!.id) {
      throw new AppError('Unauthorized', 403, 'FORBIDDEN');
    }

    const plan = assessmentPlan.interviewPlan as any;

    res.json({
      success: true,
      data: {
        sessionId: assessmentPlan.id,
        plan: {
          components: assessmentPlan.components,
          questionCounts: assessmentPlan.questionCounts,
          difficulty: assessmentPlan.difficulty,
          duration: assessmentPlan.estimatedDuration
        },
        voiceQuestions: plan?.voiceQuestions || [],
        mcqQuestions: plan?.mcqQuestions?.map((q: any) => ({
          id: q.id,
          text: q.questionText,
          topic: q.skillCategory,
          difficulty: q.difficulty
        })) || [],
        codingChallenges: plan?.codingChallenges?.map((c: any) => ({
          id: c.id,
          title: c.questionText ? c.questionText.split('\n')[0].substring(0, 100) : 'Coding Challenge',
          description: c.questionText,
          difficulty: c.difficulty,
          language: c.language
        })) || [],
        resumeUrl: assessmentPlan.resumeText ? 'resume-uploaded' : null
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
