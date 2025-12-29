import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';
import { Response, NextFunction } from 'express';
import { uploadFile } from '../utils/fileUpload';
import { documentVerificationService } from '../services/document-verification.service';
import prisma from '../config/database';
import config from '../config';
import { AppError } from '../utils/errors';
import logger from '../config/logger';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: config.fileUpload.maxFileSize },
});

// All routes require authentication
router.use(authenticate);

// Upload ID document
router.post('/id', upload.single('file'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('File is required', 400, 'VALIDATION_ERROR');
    }

    const { documentType } = req.body;
    const result = await uploadFile(req.file, 'id-documents');

    // Update or create ID verification record
    await prisma.iDVerification.upsert({
      where: { userId: req.user!.id },
      create: {
        userId: req.user!.id,
        idDocumentUrl: result.url,
        idDocumentType: documentType,
        status: 'in-progress',
      },
      update: {
        idDocumentUrl: result.url,
        idDocumentType: documentType,
      },
    });

    res.json({
      success: true,
      data: {
        documentUrl: result.url,
        documentId: result.key,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Upload Visa document
router.post('/visa', upload.single('file'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('File is required', 400, 'VALIDATION_ERROR');
    }

    const { documentType } = req.body;
    const result = await uploadFile(req.file, 'visa-documents');

    await prisma.iDVerification.upsert({
      where: { userId: req.user!.id },
      create: {
        userId: req.user!.id,
        visaDocumentUrl: result.url,
        visaDocumentType: documentType,
        status: 'in-progress',
      },
      update: {
        visaDocumentUrl: result.url,
        visaDocumentType: documentType,
      },
    });

    res.json({
      success: true,
      data: {
        documentUrl: result.url,
        documentId: result.key,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Upload selfie
router.post('/selfie', upload.single('file'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new AppError('File is required', 400, 'VALIDATION_ERROR');
    }

    const result = await uploadFile(req.file, 'selfies');

    await prisma.iDVerification.upsert({
      where: { userId: req.user!.id },
      create: {
        userId: req.user!.id,
        selfieUrl: result.url,
        status: 'in-progress',
      },
      update: {
        selfieUrl: result.url,
      },
    });

    res.json({
      success: true,
      data: {
        selfieUrl: result.url,
        selfieId: result.key,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Submit verification
router.post('/submit', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const verification = await prisma.iDVerification.findUnique({
      where: { userId: req.user!.id },
    });

    if (!verification || !verification.idDocumentUrl || !verification.selfieUrl) {
      throw new AppError('Missing required documents', 400, 'MISSING_DOCUMENTS');
    }

    // Extract S3 keys from URLs
    const idS3Key = verification.idDocumentUrl.split('/').pop() || '';
    const selfieS3Key = verification.selfieUrl.split('/').pop() || '';

    // Perform AI verification if AWS is configured
    let verificationData = null;
    if (config.aws.accessKeyId && config.aws.secretAccessKey) {
      try {
        logger.info('Starting AI document verification...');
        verificationData = await documentVerificationService.performFullVerification(
          `id-documents/${idS3Key}`,
          `selfies/${selfieS3Key}`
        );

        logger.info('AI verification complete:', {
          success: verificationData.success,
          overallScore: verificationData.overallScore,
        });
      } catch (error: any) {
        logger.error('AI verification failed, will proceed with manual review:', error);
        // Don't fail the submission if AI verification fails
        // Admin will review manually
      }
    }

    // Update verification record
    const updated = await prisma.iDVerification.update({
      where: { userId: req.user!.id },
      data: {
        status: verificationData?.success ? 'verified' : 'pending',
        submittedAt: new Date(),
        reviewNotes: verificationData ? JSON.stringify({
          aiVerification: true,
          score: verificationData.overallScore,
          issues: verificationData.issues,
          idData: verificationData.idData,
          faceMatch: {
            match: verificationData.faceMatch.match,
            similarity: verificationData.faceMatch.similarity,
          },
        }) : null,
      },
    });

    // Update user data status
    await prisma.userData.update({
      where: { userId: req.user!.id },
      data: { 
        idVerificationStatus: verificationData?.success ? 'verified' : 'pending' 
      },
    });

    res.json({
      success: true,
      data: {
        verificationId: updated.id,
        status: updated.status,
        estimatedReviewTime: verificationData?.success ? 'Verified' : '24-48 hours',
        ...(verificationData && {
          aiVerification: {
            overallScore: verificationData.overallScore,
            autoVerified: verificationData.success,
            issues: verificationData.issues,
          },
        }),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get verification status
router.get('/status', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const verification = await prisma.iDVerification.findUnique({
      where: { userId: req.user!.id },
    });

    if (!verification) {
      return res.json({
        success: true,
        data: {
          userId: req.user!.id,
          status: 'not-started',
        },
      });
    }

    res.json({
      success: true,
      data: {
        userId: req.user!.id,
        status: verification.status,
        submittedAt: verification.submittedAt,
        reviewedAt: verification.reviewedAt,
        notes: verification.reviewNotes,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;