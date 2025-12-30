import { Router, Request } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';
import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';

const router = Router();

// Rate limiter for public certificate endpoints
const publicCertificateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many certificate verification requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Get all certificates (authenticated)
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const certificates = await prisma.certificate.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: certificates,
    });
  } catch (error) {
    next(error);
  }
});

// Get certificate by ID (authenticated)
router.get(
  '/:certificateId',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const certificate = await prisma.certificate.findFirst({
        where: {
          id: req.params.certificateId,
          userId: req.user!.id,
        },
      });

      if (!certificate) {
        throw new AppError('Certificate not found', 404, 'NOT_FOUND');
      }

      res.json({
        success: true,
        data: certificate,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get public certificate (no auth required, rate limited)
router.get(
  '/public/:certificateNumber',
  publicCertificateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const certificate = await prisma.certificate.findUnique({
        where: { certificateNumber: req.params.certificateNumber },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!certificate || certificate.status !== 'active') {
        throw new AppError('Certificate not found or invalid', 404, 'NOT_FOUND');
      }

      res.json({
        success: true,
        data: {
          certificateNumber: certificate.certificateNumber,
          candidateName: certificate.user.name,
          productId: certificate.productId,
          issueDate: certificate.issueDate,
          status: certificate.status,
          skillsData: certificate.skillsData,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Verify certificate (public, rate limited)
router.get(
  '/verify/:certificateNumber',
  publicCertificateLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const certificate = await prisma.certificate.findUnique({
        where: { certificateNumber: req.params.certificateNumber },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: {
          valid: !!certificate && certificate.status === 'active',
          ...(certificate && {
            certificate: {
              certificateNumber: certificate.certificateNumber,
              candidateName: certificate.user.name,
              issueDate: certificate.issueDate,
              status: certificate.status,
            },
          }),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Generate shareable link
router.post(
  '/:certificateId/share',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const certificate = await prisma.certificate.findFirst({
        where: {
          id: req.params.certificateId,
          userId: req.user!.id,
        },
      });

      if (!certificate) {
        throw new AppError('Certificate not found', 404, 'NOT_FOUND');
      }

      const shareableUrl = `${req.protocol}://${req.get('host')}/certificate/${certificate.certificateNumber}`;

      res.json({
        success: true,
        data: {
          shareableUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
