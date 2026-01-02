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
import prisma from '../../config/database';
import path from 'path';
import fs from 'fs/promises';

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
export async function startAssessment(req: AuthRequest, res: Response, next: NextFunction) {
  let tempResumeDir: string | null = null;

  try {
    logger.info('[Step 0] Starting assessment process');
    
    if (!req.user) {
      logger.error('[Step 0] Unauthorized: No user in request');
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    // Validate that multer processed the files
    if (!req.files) {
      logger.error('[Step 0] req.files is undefined - multer may have failed to process the request');
      throw new AppError(
        'File upload failed. Please ensure you are uploading files as multipart/form-data.',
        400,
        'FILE_UPLOAD_ERROR'
      );
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Validate resume file
    if (!files.resume || files.resume.length === 0) {
      logger.error('[Step 0] Validation failed: No resume file provided');
      throw new AppError('Resume file is required', 400, 'VALIDATION_ERROR');
    }

    const resumeFile = files.resume[0];
    const idCardFile = files.idCard?.[0];

    logger.info(`[Step 0] Assessment initiated for user ${req.user.id}, resume: ${resumeFile.originalname}`);

    // Step 1: Save resume to temp directory and parse
    try {
      logger.info('[Step 1] Creating temp directory and saving resume');
      tempResumeDir = path.join('/tmp', `resume-${Date.now()}`);
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

      // Step 7: Create AssessmentPlan record in database
      logger.info('[Step 7] Creating assessment plan in database');
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
      logger.info(`[Step 7] Assessment plan created successfully with ID: ${assessmentPlan.id}`);

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

export const assessmentController = {
  startAssessment,
};
