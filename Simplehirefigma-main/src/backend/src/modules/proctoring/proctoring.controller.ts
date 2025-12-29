/**
 * Proctoring Controller
 * Handles identity verification and session monitoring
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import { AppError } from '../../utils/errors';
import logger from '../../config/logger';
import { proctoringEngine } from './engine/proctoring-engine';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Verify Identity
 * POST /api/proctoring/verify-identity
 * 
 * Compares live face capture with reference ID card photo
 * Logs result to ProctoringEvent table
 */
export async function verifyIdentity(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { interviewId, referenceImageBase64, liveImageBase64 } = req.body;

    // Validate inputs
    if (!interviewId) {
      throw new AppError('Interview ID is required', 400, 'VALIDATION_ERROR');
    }

    if (!referenceImageBase64 || !liveImageBase64) {
      throw new AppError(
        'Reference image and live image are required',
        400,
        'VALIDATION_ERROR'
      );
    }

    logger.info(`Verifying identity for interview ${interviewId}`);

    // Run proctoring checks
    const result = await proctoringEngine.runChecks({
      referenceImageBase64,
      liveImageBase64,
      userId: req.user.id,
      interviewId,
    });

    // Extract similarity from violations (if any)
    let similarity = 0;
    if (result.violations.length > 0) {
      const faceMatchViolation = result.violations.find(
        (v) => v.ruleId === 'face-matching'
      );
      if (faceMatchViolation?.data?.similarity !== undefined) {
        similarity = faceMatchViolation.data.similarity;
      }
    } else {
      // If no violations, assume high similarity (passed)
      similarity = 100;
    }

    // Log proctoring event to database
    await prisma.proctoringEvent.create({
      data: {
        interviewId,
        eventType: 'initial_verification',
        similarity,
        alertTriggered: !result.passed,
        violationData: (result.violations.length > 0 ? result.violations : null) as any,
      },
    });

    logger.info(
      `Identity verification ${result.passed ? 'passed' : 'failed'} for interview ${interviewId}`
    );

    res.json({
      success: true,
      data: {
        passed: result.passed,
        violations: result.violations,
        similarity,
      },
    });
  } catch (error: any) {
    logger.error('Error verifying identity:', error);
    next(error);
  }
}

/**
 * Monitor Session
 * POST /api/proctoring/monitor
 * 
 * Continuous monitoring during interview
 * Logs result to ProctoringEvent table
 */
export async function monitorSession(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { interviewId, referenceImageBase64, liveImageBase64 } = req.body;

    // Validate inputs
    if (!interviewId) {
      throw new AppError('Interview ID is required', 400, 'VALIDATION_ERROR');
    }

    if (!referenceImageBase64 || !liveImageBase64) {
      throw new AppError(
        'Reference image and live image are required',
        400,
        'VALIDATION_ERROR'
      );
    }

    logger.info(`Monitoring session for interview ${interviewId}`);

    // Run proctoring checks
    const result = await proctoringEngine.runChecks({
      referenceImageBase64,
      liveImageBase64,
      userId: req.user.id,
      interviewId,
    });

    // Extract similarity from violations (if any)
    let similarity = 0;
    if (result.violations.length > 0) {
      const faceMatchViolation = result.violations.find(
        (v) => v.ruleId === 'face-matching'
      );
      if (faceMatchViolation?.data?.similarity !== undefined) {
        similarity = faceMatchViolation.data.similarity;
      }
    } else {
      similarity = 100;
    }

    // Log proctoring event to database
    await prisma.proctoringEvent.create({
      data: {
        interviewId,
        eventType: 'continuous_monitor',
        similarity,
        alertTriggered: !result.passed,
        violationData: (result.violations.length > 0 ? result.violations : null) as any,
      },
    });

    logger.info(
      `Session monitoring ${result.passed ? 'passed' : 'failed'} for interview ${interviewId}`
    );

    res.json({
      success: true,
      data: {
        passed: result.passed,
        violations: result.violations,
        similarity,
      },
    });
  } catch (error: any) {
    logger.error('Error monitoring session:', error);
    next(error);
  }
}

export const proctoringController = {
  verifyIdentity,
  monitorSession,
};
