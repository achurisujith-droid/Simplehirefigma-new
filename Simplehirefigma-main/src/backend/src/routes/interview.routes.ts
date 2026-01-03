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
import { parseResumeFile } from '../modules/resume/parsers';
import { openaiService } from '../modules/ai/openai.service';
import { profileClassifierService } from '../modules/assessment/profile-classifier.service';
import { assessmentPlannerService } from '../modules/assessment/assessment-planner.service';
import { questionGeneratorService } from '../modules/assessment/question-generator.service';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

// Helper function to normalize question format for backward compatibility
// Handles both old format { question, category } and new format { text, topic }
function normalizeQuestionText(question: any): string {
  return question.question || question.text || 'Question';
}

function normalizeQuestionCategory(question: any): string {
  return question.category || question.topic || 'General';
}

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
      // Validate that multer processed the files
      if (!req.files) {
        logger.error('[upload-documents] req.files is undefined - multer may have failed to process the request');
        throw new AppError(
          'File upload failed. Please ensure you are uploading files as multipart/form-data.',
          400,
          'FILE_UPLOAD_ERROR'
        );
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!files.resume || files.resume.length === 0) {
        logger.error('[upload-documents] No resume file in request');
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
    let tempResumeDir: string | null = null;

    try {
      logger.info('[Step 0] Starting assessment process');
      
      if (!req.user) {
        logger.error('[Step 0] Unauthorized: No user in request');
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      // Validate that multer processed the files
      if (!req.files) {
        logger.error('[start-assessment] req.files is undefined - multer may have failed to process the request');
        throw new AppError(
          'File upload failed. Please ensure you are uploading files as multipart/form-data.',
          400,
          'FILE_UPLOAD_ERROR'
        );
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!files.resume || files.resume.length === 0) {
        logger.error('[start-assessment] No resume file in request');
        throw new AppError('Resume is required', 400, 'VALIDATION_ERROR');
      }

      const resumeFile = files.resume[0];
      const idCardFile = files.idCard?.[0];

      logger.info(`[Step 0] Assessment initiated for user ${req.user.id}, resume: ${resumeFile.originalname}`);

      // Step 1: Save resume to temp directory and parse
      try {
        logger.info('[Step 1] Creating temp directory and saving resume');
        tempResumeDir = path.join(os.tmpdir(), `resume-${Date.now()}`);
        await fs.mkdir(tempResumeDir, { recursive: true });
        const resumePath = path.join(tempResumeDir, resumeFile.originalname);
        await fs.writeFile(resumePath, resumeFile.buffer);
        logger.info(`[Step 1] Resume saved to ${resumePath}`);

        logger.info('[Step 1] Parsing resume file');
        const resumeText = await parseResumeFile(
          resumePath,
          resumeFile.mimetype,
          resumeFile.originalname
        );
        logger.info(`[Step 1] Resume parsed successfully, length: ${resumeText.length} characters`);

        // Step 2: Analyze resume with OpenAI
        logger.info('[Step 2] Analyzing resume with OpenAI');
        const analysis = await openaiService.analyzeResumeDeep(resumeText);
        logger.info(`[Step 2] Resume analysis complete, role: ${analysis.candidateProfile.currentRole}`);

        // Step 3: Classify candidate profile
        logger.info('[Step 3] Classifying candidate profile');
        const classification = await profileClassifierService.classifyProfile(analysis);
        logger.info(`[Step 3] Classification complete, category: ${classification.roleCategory}, experience: ${classification.yearsExperience}`);

        // Step 4: Plan assessment
        logger.info('[Step 4] Planning assessment');
        const plan = assessmentPlannerService.planAssessment(classification);
        logger.info(`[Step 4] Assessment plan created, components: ${plan.components.join(', ')}`);

        // Step 5: Generate voice questions (if voice component enabled)
        let voiceQuestions: any[] = [];
        if (plan.components.includes('VOICE') && plan.questionCounts.voice > 0) {
          logger.info(`[Step 5] Generating ${plan.questionCounts.voice} voice questions`);
          voiceQuestions = await questionGeneratorService.generateVoiceQuestions(
            analysis,
            classification,
            plan.questionCounts.voice
          );
          logger.info(`[Step 5] Generated ${voiceQuestions.length} voice questions`);
        } else {
          logger.info('[Step 5] Skipping voice question generation (not required)');
        }

        // Step 6: Upload resume and ID card to S3
        logger.info('[Step 6] Uploading files to S3');
        const resumeUpload = await uploadFile(resumeFile, 'resumes');
        logger.info(`[Step 6] Resume uploaded to S3: ${resumeUpload.url}`);

        let idCardUrl: string | undefined;
        if (idCardFile) {
          logger.info('[Step 6] Uploading ID card to S3');
          const idCardUpload = await uploadFile(idCardFile, 'id-cards');
          idCardUrl = idCardUpload.url;
          logger.info(`[Step 6] ID card uploaded to S3: ${idCardUrl}`);
        }

        // Step 7: Check if existing draft plan exists
        const existingPlan = await prisma.assessmentPlan.findFirst({
          where: { userId: req.user.id, status: 'DRAFT' },
          orderBy: { createdAt: 'desc' },
        });

        let assessmentPlan;
        
        if (existingPlan) {
          // Update existing plan with full data
          logger.info('[Step 7] Updating existing assessment plan');
          assessmentPlan = await prisma.assessmentPlan.update({
            where: { id: existingPlan.id },
            data: {
              resumeUrl: resumeUpload.url,
              resumeText,
              primarySkill: classification.keySkills[0] || analysis.candidateProfile.currentRole,
              components: plan.components,
              questionCounts: plan.questionCounts as any,
              difficulty: plan.difficulty,
              estimatedDuration: plan.duration,
              skillBuckets: {
                technical: analysis.coreSkills.technical,
                business: analysis.coreSkills.business,
                soft: analysis.coreSkills.soft,
              },
              interviewPlan: {
                classification: classification as any,
                voiceQuestions,
                extractedEntities: analysis.extractedEntities,
                analysis,
                resumeUrl: resumeUpload.url,
                ...(idCardUrl && { idCardUrl }),
              } as any,
              ...(idCardUrl && { idCardUrl }),
            },
          });
        } else {
          // Create new assessment plan
          logger.info('[Step 7] Creating new assessment plan');
          assessmentPlan = await prisma.assessmentPlan.create({
            data: {
              userId: req.user.id,
              resumeUrl: resumeUpload.url,
              resumeText,
              primarySkill: classification.keySkills[0] || analysis.candidateProfile.currentRole,
              components: plan.components,
              questionCounts: plan.questionCounts as any,
              difficulty: plan.difficulty,
              estimatedDuration: plan.duration,
              skillBuckets: {
                technical: analysis.coreSkills.technical,
                business: analysis.coreSkills.business,
                soft: analysis.coreSkills.soft,
              },
              status: 'DRAFT',
              interviewPlan: {
                classification: classification as any,
                voiceQuestions,
                extractedEntities: analysis.extractedEntities,
                analysis,
                resumeUrl: resumeUpload.url,
                ...(idCardUrl && { idCardUrl }),
              } as any,
              ...(idCardUrl && { idCardUrl }),
            },
          });
        }
        logger.info(`[Step 7] Assessment plan created/updated successfully with ID: ${assessmentPlan.id}`);

        // Clean up temp directory
        if (tempResumeDir) {
          logger.info('[Step 8] Cleaning up temp directory');
          await fs.rm(tempResumeDir, { recursive: true, force: true });
        }

        logger.info(`[Step 8] Assessment completed successfully for user ${req.user.id}`);

        // Step 8: Return response
        res.json({
          success: true,
          data: {
            sessionId: assessmentPlan.id,
            plan: {
              components: plan.components,
              questionCounts: plan.questionCounts,
              duration: plan.duration,
              difficulty: plan.difficulty,
              rationale: plan.rationale,
            },
            analysis: {
              candidateProfile: analysis.candidateProfile,
              professionalSummary: analysis.professionalSummary,
              interviewFocus: analysis.interviewFocus,
              classification: {
                roleCategory: classification.roleCategory,
                yearsExperience: classification.yearsExperience,
                codingExpected: classification.codingExpected,
                keySkills: classification.keySkills,
              },
            },
            voiceQuestions,
            resumeUrl: resumeUpload.url,
            ...(idCardUrl && { idCardUrl }),
          },
        });
      } catch (stepError: any) {
        logger.error(`[Assessment Error] Failed during execution: ${stepError.message}`, {
          error: stepError,
          stack: stepError.stack,
          userId: req.user.id,
        });
        throw stepError;
      }
    } catch (error: any) {
      // Clean up temp directory on error
      if (tempResumeDir) {
        try {
          await fs.rm(tempResumeDir, { recursive: true, force: true });
          logger.info('Temp directory cleaned up after error');
        } catch (cleanupError) {
          logger.error('Error cleaning up temp directory:', cleanupError);
        }
      }

      logger.error('[Assessment Error] Top-level error handler:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        userId: req.user?.id,
      });
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

    // Use voice questions from assessment plan if they exist
    let voiceQuestions = plan?.voiceQuestions || [];
    
    if (voiceQuestions.length === 0) {
      // No personalized questions found - throw error
      logger.error('[voice/start] No personalized questions found in assessment plan');
      throw new AppError(
        'Unable to generate interview questions. Please ensure your resume is uploaded.',
        400,
        'NO_QUESTIONS_AVAILABLE'
      );
    }
    
    logger.info(`[voice/start] Using ${voiceQuestions.length} personalized questions from assessment plan`);

    // Determine job role from various sources
    const jobRole = role || plan?.classification?.primaryRole || assessmentPlan.primarySkill || 'Software Engineer';

    // Create session
    const session = await sessionManager.createSession({
      userId: req.user!.id,
      assessmentPlanId: assessmentPlan.id,
      provider: 'elevenlabs',
      questions: voiceQuestions as VoiceQuestion[],
      resumeContext: assessmentPlan.resumeText || undefined,
      jobRole: jobRole,
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
        candidateName: req.user!.name,
        jobRole: jobRole,
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

    // Store the answer - handle both old and new question formats
    await sessionManager.addAnswer(sessionId, {
      questionId,
      question: normalizeQuestionText(question),
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

    // Handle both old and new question formats
    res.json({
      success: true,
      completed: false,
      data: {
        questionId: nextQuestion.id,
        question: normalizeQuestionText(nextQuestion),
        category: normalizeQuestionCategory(nextQuestion),
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
