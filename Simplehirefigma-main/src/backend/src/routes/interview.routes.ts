import { Router, Request } from 'express';
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
import { sessionManager, VoiceQuestion } from '../services/session-manager';
import logger from '../config/logger';

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

// Start assessment - Upload documents and create assessment plan
router.post(
  '/start-assessment',
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'idCard', maxCount: 1 },
  ]),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!files.resume) {
        throw new AppError('Resume is required', 400, 'VALIDATION_ERROR');
      }

      // Upload resume
      const resumeResult = await uploadFile(files.resume[0], 'resumes');
      
      // Upload ID card if provided
      let idCardUrl: string | undefined;
      if (files.idCard) {
        const idCardResult = await uploadFile(files.idCard[0], 'id-cards');
        idCardUrl = idCardResult.url;
      }

      // Create or update assessment plan for this user
      const existingPlan = await prisma.assessmentPlan.findFirst({
        where: { userId: req.user!.id, status: 'DRAFT' },
        orderBy: { createdAt: 'desc' },
      });

      let assessmentPlan;
      
      if (existingPlan) {
        // Update existing plan with resume info
        const currentPlan = (existingPlan.interviewPlan as InterviewPlanData) ?? {};
        assessmentPlan = await prisma.assessmentPlan.update({
          where: { id: existingPlan.id },
          data: {
            resumeUrl: resumeResult.url,
            resumeText: '', // Will be populated by resume parser later
            interviewPlan: {
              ...currentPlan,
              resumeUrl: resumeResult.url,
              ...(idCardUrl && { idCardUrl }),
            },
          },
        });
      } else {
        // Create new assessment plan
        assessmentPlan = await prisma.assessmentPlan.create({
          data: {
            userId: req.user!.id,
            resumeUrl: resumeResult.url,
            resumeText: '', // Will be populated by resume parser later
            status: 'DRAFT',
            interviewPlan: {
              resumeUrl: resumeResult.url,
              ...(idCardUrl && { idCardUrl }),
            },
          },
        });
      }

      res.json({
        success: true,
        data: {
          sessionId: assessmentPlan.id,
          resumeUrl: resumeResult.url,
          ...(idCardUrl && { idCardUrl }),
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

    // Get or create assessment plan
    const assessmentPlan = await prisma.assessmentPlan.findFirst({
      where: { userId: req.user!.id, status: 'DRAFT' },
      orderBy: { createdAt: 'desc' },
    });

    if (!assessmentPlan) {
      throw new AppError(
        'No assessment plan found. Please upload your resume first.',
        404,
        'NOT_FOUND'
      );
    }

    const plan = assessmentPlan.interviewPlan as any;

    // Generate voice interview questions if not already present
    let voiceQuestions = plan?.voiceQuestions || [];
    
    if (voiceQuestions.length === 0) {
      // Generate default voice questions based on role and resume
      const classification = plan?.classification;
      const jobTitle = role || classification?.primaryRole || 'Software Engineer';
      
      voiceQuestions = [
        {
          id: 'voice_1',
          question: `Tell me about your experience as a ${jobTitle}.`,
          category: 'experience',
        },
        {
          id: 'voice_2',
          question: 'What are your greatest technical strengths?',
          category: 'technical',
        },
        {
          id: 'voice_3',
          question: 'Describe a challenging project you worked on and how you overcame obstacles.',
          category: 'problem_solving',
        },
        {
          id: 'voice_4',
          question: 'How do you stay updated with the latest technologies in your field?',
          category: 'learning',
        },
        {
          id: 'voice_5',
          question: 'Why are you interested in this position and what are your career goals?',
          category: 'motivation',
        },
      ];

      // Store questions in assessment plan
      await prisma.assessmentPlan.update({
        where: { id: assessmentPlan.id },
        data: {
          interviewPlan: {
            ...plan,
            voiceQuestions,
          },
        },
      });
    }

    // Create session
    const session = await sessionManager.createSession({
      userId: req.user!.id,
      assessmentPlanId: assessmentPlan.id,
      provider: 'elevenlabs',
      questions: voiceQuestions as VoiceQuestion[],
      resumeContext: assessmentPlan.resumeText || undefined,
      jobRole: role,
    });

    // Get ElevenLabs signed URL if configured
    let signedUrl: string | undefined;
    let agentConfig: any = null;

    if (config.elevenlabs.apiKey && config.elevenlabs.agentId) {
      try {
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${config.elevenlabs.agentId}`,
          {
            method: 'GET',
            headers: {
              'xi-api-key': config.elevenlabs.apiKey,
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = (await response.json()) as { signed_url?: string };
          signedUrl = data.signed_url;
          agentConfig = {
            agentId: config.elevenlabs.agentId,
            provider: 'elevenlabs',
          };
          logger.info('Got ElevenLabs signed URL', { sessionId: session.sessionId });
        } else {
          logger.warn('Failed to get ElevenLabs signed URL', {
            status: response.status,
            statusText: response.statusText,
          });
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          logger.error('ElevenLabs API request timed out', { error });
        } else {
          logger.error('Error getting ElevenLabs signed URL', { error });
        }
        // Continue without ElevenLabs - interview can still proceed without real-time voice
      }
    }

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        questions: voiceQuestions,
        ...(signedUrl && { signedUrl }),
        ...(agentConfig && { agentConfig }),
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
      const { sessionId, transcript } = req.body;

      if (!sessionId) {
        throw new AppError('sessionId is required', 400, 'VALIDATION_ERROR');
      }

      // Get session
      const session = await sessionManager.getSession(sessionId);
      if (!session) {
        throw new AppError('Session not found', 404, 'NOT_FOUND');
      }

      // Verify ownership
      if (session.userId !== req.user!.id) {
        throw new AppError('Unauthorized', 403, 'FORBIDDEN');
      }

      // Upload audio file if provided
      let audioUrl: string | undefined;
      if (req.file) {
        const audioResult = await uploadFile(req.file, 'interviews');
        audioUrl = audioResult.url;
      }

      // Mark session as completed and persist to database
      await sessionManager.completeSession(sessionId);

      // Get assessment plan
      const assessmentPlan = await prisma.assessmentPlan.findUnique({
        where: { id: session.assessmentPlanId },
      });

      if (!assessmentPlan) {
        throw new AppError('Assessment plan not found', 404, 'NOT_FOUND');
      }

      // The evaluation will be done when the user requests /evaluation endpoint
      // This allows them to complete MCQ and coding challenges first

      res.json({
        success: true,
        message: 'Voice interview submitted successfully',
        data: {
          sessionId,
          answersCount: session.answers.length,
          ...(audioUrl && { audioUrl }),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Webhook: Notify when user answers a question (called by ElevenLabs agent)
// Note: In production, add webhook signature verification
router.post('/notify-answer', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Add webhook signature verification for production
    // Verify ElevenLabs webhook signature to prevent unauthorized access
    const { sessionId, questionId, transcript } = req.body;

    if (!sessionId || !questionId || !transcript) {
      throw new AppError('sessionId, questionId, and transcript are required', 400, 'VALIDATION_ERROR');
    }

    const session = await sessionManager.getSession(sessionId);
    if (!session) {
      throw new AppError('Session not found', 404, 'NOT_FOUND');
    }

    const question = session.questions.find((q: VoiceQuestion) => q.id === questionId);
    if (!question) {
      throw new AppError('Question not found', 404, 'NOT_FOUND');
    }

    // Store the answer
    await sessionManager.addAnswer(sessionId, {
      questionId,
      question: question.question,
      transcript,
      timestamp: new Date(),
    });

    logger.info('Answer recorded', { sessionId, questionId, transcriptLength: transcript.length });

    res.json({
      success: true,
      message: 'Answer recorded',
    });
  } catch (error) {
    next(error);
  }
});

// Webhook: Get next question (called by ElevenLabs agent)
// Note: In production, add webhook signature verification
router.post('/next-question', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Add webhook signature verification for production
    const { sessionId } = req.body;

    if (!sessionId) {
      throw new AppError('sessionId is required', 400, 'VALIDATION_ERROR');
    }

    const session = await sessionManager.getSession(sessionId);
    if (!session) {
      throw new AppError('Session not found', 404, 'NOT_FOUND');
    }

    const nextQuestion = await sessionManager.getNextQuestion(sessionId);

    if (!nextQuestion) {
      // No more questions - interview complete
      return res.json({
        success: true,
        completed: true,
        message: 'Interview completed',
      });
    }

    res.json({
      success: true,
      completed: false,
      data: {
        questionId: nextQuestion.id,
        question: nextQuestion.question,
        category: nextQuestion.category,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Webhook: Stop interview (called by ElevenLabs agent or user)
// Note: In production, add webhook signature verification
router.post('/stop-interview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Add webhook signature verification for production
    const { sessionId, reason } = req.body;

    if (!sessionId) {
      throw new AppError('sessionId is required', 400, 'VALIDATION_ERROR');
    }

    const session = await sessionManager.getSession(sessionId);
    if (!session) {
      throw new AppError('Session not found', 404, 'NOT_FOUND');
    }

    if (reason === 'completed') {
      await sessionManager.completeSession(sessionId);
      logger.info('Interview completed', { sessionId });
    } else {
      await sessionManager.cancelSession(sessionId);
      logger.info('Interview cancelled', { sessionId, reason });
    }

    res.json({
      success: true,
      message: 'Interview stopped',
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

    if (!Array.isArray(answers)) {
      throw new AppError('answers array is required', 400, 'VALIDATION_ERROR');
    }

    // Get assessment plan with stored questions
    const assessmentPlan = await prisma.assessmentPlan.findFirst({
      where: { userId: req.user!.id, status: 'DRAFT' },
      orderBy: { createdAt: 'desc' },
    });

    if (!assessmentPlan || !assessmentPlan.interviewPlan) {
      throw new AppError('Assessment plan not found', 404, 'NOT_FOUND');
    }

    const plan = assessmentPlan.interviewPlan as any;
    const mcqQuestions = plan.mcqQuestions || [];

    if (mcqQuestions.length === 0) {
      throw new AppError('No MCQ questions found', 400, 'VALIDATION_ERROR');
    }

    // Calculate score by comparing answers with correct answers
    let correctCount = 0;
    const mcqAnswers = answers.map((answer: any) => {
      const question = mcqQuestions.find((q: any) => q.id === answer.questionId);
      if (!question) {
        return null;
      }

      const isCorrect = answer.selectedOptionIndex === question.correctAnswerIndex;
      if (isCorrect) {
        correctCount++;
      }

      return {
        questionId: answer.questionId,
        question: question.questionText,
        selectedOption: question.options[answer.selectedOptionIndex],
        correctOption: question.options[question.correctAnswerIndex],
        isCorrect,
      };
    }).filter(Boolean);

    // Store answers in assessment plan
    await prisma.assessmentPlan.update({
      where: { id: assessmentPlan.id },
      data: {
        interviewPlan: {
          ...plan,
          mcqAnswers,
        },
      },
    });

    const totalQuestions = mcqQuestions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    res.json({
      success: true,
      data: {
        score: correctCount,
        totalQuestions,
        percentage,
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
    const { challengeId, code, language } = req.body;

    if (!code || !language || !challengeId) {
      throw new AppError('challengeId, code, and language are required', 400, 'VALIDATION_ERROR');
    }

    // Get assessment plan with stored challenges
    const assessmentPlan = await prisma.assessmentPlan.findFirst({
      where: { userId: req.user!.id, status: 'DRAFT' },
      orderBy: { createdAt: 'desc' },
    });

    if (!assessmentPlan || !assessmentPlan.interviewPlan) {
      throw new AppError('Assessment plan not found', 404, 'NOT_FOUND');
    }

    const plan = assessmentPlan.interviewPlan as any;
    const codingChallenges = plan.codingChallenges || [];
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

    // Store submission in assessment plan
    const codeAnswers = plan.codeAnswers || [];
    codeAnswers.push({
      questionId: challengeId,
      question: challenge.questionText,
      language,
      submission: code,
      evaluation,
      score,
    });

    await prisma.assessmentPlan.update({
      where: { id: assessmentPlan.id },
      data: {
        interviewPlan: {
          ...plan,
          codeAnswers,
        },
      },
    });

    res.json({
      success: true,
      data: {
        passed: score >= 60,
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
