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

// Type for stored evaluation data
interface StoredEvaluation {
  overallScore: number;
  categoryScores: {
    technicalAccuracy: number;
    communicationClarity: number;
    problemSolving: number;
    experienceAlignment: number;
  };
  strengths: string[];
  areasForImprovement: string[];
  summary: string;
  recommendation: 'strong_hire' | 'hire' | 'maybe_hire' | 'no_hire';
  confidenceLevel: 'high' | 'medium' | 'low';
  evaluationAgreement: string;
  selectedProvider: string;
  arbiterSkipped: boolean;
  providerResults?: any[];
}

// Type for interview plan data
interface InterviewPlanData {
  voiceAnswers?: Array<{
    questionId?: string;
    id?: string;
    question: string;
    transcript?: string;
    answer?: string;
  }>;
  mcqAnswers?: Array<{
    questionId?: string;
    id?: string;
    question: string;
    selectedOption: string;
    correctOption: string;
    isCorrect: boolean;
  }>;
  codeAnswers?: Array<{
    questionId?: string;
    id?: string;
    question: string;
    language: string;
    submission: string;
  }>;
  [key: string]: any;
}

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.fileUpload.maxFileSize },
});

// All routes require authentication
router.use(authenticate);

// Upload documents
router.post(
  '/documents',
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'coverLetter', maxCount: 1 },
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
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
  }
);

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
          {
            id: 'q1',
            question: 'Tell me about your experience with ' + role,
            category: 'experience',
          },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
});

// Submit voice interview
router.post(
  '/voice/submit',
  upload.single('audio'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
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
  }
);

// Get MCQ questions - DYNAMIC GENERATION
router.get('/mcq', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get or create assessment plan for this user
    const assessmentPlan = await prisma.assessmentPlan.findFirst({
      where: { userId: req.user!.id, status: 'DRAFT' },
      orderBy: { createdAt: 'desc' },
    });

    if (!assessmentPlan || !assessmentPlan.interviewPlan) {
      throw new AppError(
        'No assessment plan found. Please upload your resume first.',
        404,
        'NOT_FOUND'
      );
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
        })),
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
          mcqQuestions,
        },
      },
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
      })),
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
      orderBy: { createdAt: 'desc' },
    });

    if (!assessmentPlan || !assessmentPlan.interviewPlan) {
      throw new AppError(
        'No assessment plan found. Please upload your resume first.',
        404,
        'NOT_FOUND'
      );
    }

    const plan = assessmentPlan.interviewPlan as any;

    // Check if coding challenges already exist
    if (
      plan.codingChallenges &&
      Array.isArray(plan.codingChallenges) &&
      plan.codingChallenges.length > 0
    ) {
      // Return existing challenges
      return res.json({
        success: true,
        data: plan.codingChallenges.map((c: any) => ({
          id: c.id,
          title: c.questionText
            ? c.questionText.split('\n')[0].substring(0, 100)
            : 'Coding Challenge',
          description: c.questionText,
          difficulty: c.difficulty,
          evaluationCriteria: c.evaluationCriteria,
          language: c.language,
          starterCode: c.starterCode || '',
          testCases: c.testCases || [],
        })),
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
          codingChallenges,
        },
      },
    });

    res.json({
      success: true,
      data: codingChallenges.map(c => ({
        id: c.id,
        title: c.questionText
          ? c.questionText.split('\n')[0].substring(0, 100)
          : 'Coding Challenge',
        description: c.questionText,
        difficulty: c.difficulty,
        evaluationCriteria: c.evaluationCriteria,
        language: c.language,
        starterCode: c.starterCode || '',
        testCases: c.testCases || [],
      })),
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

// Get evaluation results - Multi-LLM Arbiter Implementation
router.get('/evaluation', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    // Get the latest assessment plan for this user
    const assessmentPlan = await prisma.assessmentPlan.findFirst({
      where: {
        userId: req.user.id,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        interviews: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!assessmentPlan) {
      throw new AppError('No assessment found', 404, 'NOT_FOUND');
    }

    const interview = assessmentPlan.interviews[0];

    // If evaluation already exists, return it
    if (interview && interview.evaluation) {
      const evaluation = interview.evaluation as unknown as StoredEvaluation;
      return res.json({
        success: true,
        data: {
          overallScore: evaluation.overallScore,
          categoryScores: evaluation.categoryScores,
          strengths: evaluation.strengths,
          areasForImprovement: evaluation.areasForImprovement,
          summary: evaluation.summary,
          recommendation: evaluation.recommendation,
          confidenceLevel: evaluation.confidenceLevel,
          evaluationAgreement: evaluation.evaluationAgreement,
          selectedProvider: evaluation.selectedProvider,
          arbiterSkipped: evaluation.arbiterSkipped,
          evaluatedAt: interview.updatedAt,
        },
      });
    }

    // Generate evaluation using multi-LLM arbiter
    // Gather interview data from interviewPlan
    const interviewPlan = assessmentPlan.interviewPlan as unknown as InterviewPlanData;
    const voiceAnswers = interviewPlan.voiceAnswers || [];
    const mcqAnswers = interviewPlan.mcqAnswers || [];
    const codeAnswers = interviewPlan.codeAnswers || [];

    // Run multi-LLM evaluation
    const result = await interviewEvaluatorService.evaluateInterview({
      candidateName: req.user.name,
      candidateEmail: req.user.email,
      resumeText: assessmentPlan.resumeText,
      voiceAnswers: voiceAnswers.map((va: any) => ({
        questionId: va.questionId || va.id,
        question: va.question,
        answer: va.transcript || va.answer,
      })),
      mcqAnswers: mcqAnswers.map((mcq: any) => ({
        questionId: mcq.questionId || mcq.id,
        question: mcq.question,
        selectedOption: mcq.selectedOption,
        correctOption: mcq.correctOption,
        isCorrect: mcq.isCorrect,
      })),
      codeAnswers: codeAnswers.map((code: any) => ({
        questionId: code.questionId || code.id,
        question: code.question,
        language: code.language,
        code: code.submission,
      })),
    });

    // Store evaluation in interview record
    const evaluationData = {
      overallScore: result.finalScore,
      categoryScores: result.categoryScores,
      strengths: result.strengths,
      areasForImprovement: result.improvements,
      summary: result.summary,
      recommendation: result.recommendation,
      confidenceLevel: result.confidenceLevel,
      evaluationAgreement: result.evaluationAgreement,
      selectedProvider: result.selectedProvider,
      arbiterSkipped: result.arbiterSkipped,
      providerResults: result.providerResults,
    };

    // Create or update interview record with evaluation
    if (interview) {
      await prisma.interview.update({
        where: { id: interview.id },
        data: {
          evaluation: evaluationData as any,
          score: result.finalScore,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    } else {
      await prisma.interview.create({
        data: {
          userId: req.user.id,
          assessmentPlanId: assessmentPlan.id,
          questions: {},
          answers: {},
          evaluation: evaluationData as any,
          score: result.finalScore,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }

    // Return evaluation results
    res.json({
      success: true,
      data: {
        overallScore: result.finalScore,
        categoryScores: result.categoryScores,
        strengths: result.strengths,
        areasForImprovement: result.improvements,
        summary: result.summary,
        recommendation: result.recommendation,
        confidenceLevel: result.confidenceLevel,
        evaluationAgreement: result.evaluationAgreement,
        selectedProvider: result.selectedProvider,
        arbiterSkipped: result.arbiterSkipped,
        evaluatedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Generate certificate
router.post('/certificate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const certificateNumber =
      'SH-' +
      new Date().getFullYear() +
      '-' +
      Math.random().toString(36).substr(2, 6).toUpperCase();

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
      orderBy: { createdAt: 'desc' },
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
        score: evaluation.rawScore,
      },
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
      orderBy: { createdAt: 'desc' },
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
        improvements: evaluation.improvements,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/interviews/assessment-plan/:sessionId - Get assessment plan details
router.get(
  '/assessment-plan/:sessionId',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;

      const assessmentPlan = await prisma.assessmentPlan.findUnique({
        where: { id: sessionId },
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
            duration: assessmentPlan.estimatedDuration,
          },
          voiceQuestions: plan?.voiceQuestions || [],
          mcqQuestions:
            plan?.mcqQuestions?.map((q: any) => ({
              id: q.id,
              text: q.questionText,
              topic: q.skillCategory,
              difficulty: q.difficulty,
            })) || [],
          codingChallenges:
            plan?.codingChallenges?.map((c: any) => ({
              id: c.id,
              title: c.questionText
                ? c.questionText.split('\n')[0].substring(0, 100)
                : 'Coding Challenge',
              description: c.questionText,
              difficulty: c.difficulty,
              language: c.language,
            })) || [],
          resumeUrl: assessmentPlan.resumeText ? 'resume-uploaded' : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
