/**
 * Assessment Controller
 * Handles assessment plan creation and start-assessment endpoint
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import { AppError } from '../../utils/errors';
import logger from '../../config/logger';
import { parseResumeFile } from '../resume/parsers';
import { openaiService } from '../ai/openai.service';
import { profileClassifierService } from './profile-classifier.service';
import { assessmentPlannerService } from './assessment-planner.service';
import { questionGeneratorService } from './question-generator.service';
import { uploadFile } from '../../utils/fileUpload';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';

const prisma = new PrismaClient();

/**
 * Start Assessment
 * POST /api/interviews/start-assessment
 * 
 * Steps:
 * 1. Parse resume (PDF/DOCX)
 * 2. Analyze resume with OpenAI
 * 3. Classify candidate profile
 * 4. Plan assessment (voice, MCQ, code)
 * 5. Generate voice questions
 * 6. Upload ID card to S3
 * 7. Create AssessmentPlan record
 * 8. Return sessionId, plan, analysis
 */
export async function startAssessment(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  let tempResumeDir: string | null = null;

  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Validate resume file
    if (!files.resume || files.resume.length === 0) {
      throw new AppError('Resume file is required', 400, 'VALIDATION_ERROR');
    }

    const resumeFile = files.resume[0];
    const idCardFile = files.idCard?.[0];

    logger.info(`Starting assessment for user ${req.user.id}`);

    // Step 1: Save resume to temp directory and parse
    tempResumeDir = path.join('/tmp', `resume-${Date.now()}`);
    await fs.mkdir(tempResumeDir, { recursive: true });
    const resumePath = path.join(tempResumeDir, resumeFile.originalname);
    await fs.writeFile(resumePath, resumeFile.buffer);

    logger.info('Parsing resume file');
    const resumeText = await parseResumeFile(
      resumePath,
      resumeFile.mimetype,
      resumeFile.originalname
    );

    // Step 2: Analyze resume with OpenAI
    logger.info('Analyzing resume with OpenAI');
    const analysis = await openaiService.analyzeResumeDeep(resumeText);

    // Step 3: Classify candidate profile
    logger.info('Classifying candidate profile');
    const classification = await profileClassifierService.classifyProfile(analysis);

    // Step 4: Plan assessment
    logger.info('Planning assessment');
    const plan = assessmentPlannerService.planAssessment(classification);

    // Step 5: Generate voice questions (if voice component enabled)
    let voiceQuestions: any[] = [];
    if (plan.components.includes('VOICE') && plan.questionCounts.voice > 0) {
      logger.info(`Generating ${plan.questionCounts.voice} voice questions`);
      voiceQuestions = await questionGeneratorService.generateVoiceQuestions(
        analysis,
        classification,
        plan.questionCounts.voice
      );
    }

    // Step 6: Upload resume and ID card to S3
    logger.info('Uploading files to S3');
    const resumeUpload = await uploadFile(resumeFile, 'resumes');

    let idCardUrl: string | undefined;
    if (idCardFile) {
      const idCardUpload = await uploadFile(idCardFile, 'id-cards');
      idCardUrl = idCardUpload.url;
    }

    // Step 7: Create AssessmentPlan record in database
    logger.info('Creating assessment plan in database');
    const assessmentPlan = await prisma.assessmentPlan.create({
      data: {
        userId: req.user.id,
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
        } as any,
        idCardUrl,
        status: 'DRAFT',
      },
    });

    // Clean up temp directory
    if (tempResumeDir) {
      await fs.rm(tempResumeDir, { recursive: true, force: true });
    }

    logger.info(`Assessment plan created: ${assessmentPlan.id}`);

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
  } catch (error: any) {
    // Clean up temp directory on error
    if (tempResumeDir) {
      try {
        await fs.rm(tempResumeDir, { recursive: true, force: true });
      } catch (cleanupError) {
        logger.error('Error cleaning up temp directory:', cleanupError);
      }
    }

    logger.error('Error starting assessment:', error);
    next(error);
  }
}

export const assessmentController = {
  startAssessment,
};
