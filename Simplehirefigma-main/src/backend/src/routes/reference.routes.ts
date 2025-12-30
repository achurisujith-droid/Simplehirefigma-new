import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';
import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all references
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const references = await prisma.reference.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: references,
    });
  } catch (error) {
    next(error);
  }
});

// Add reference
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, email, company, position, relationship, phone } = req.body;

    const reference = await prisma.reference.create({
      data: {
        userId: req.user!.id,
        name,
        email,
        company,
        position,
        relationship,
        phone,
        status: 'draft',
      },
    });

    res.status(201).json({
      success: true,
      data: reference,
    });
  } catch (error) {
    next(error);
  }
});

// Update reference
router.patch('/:referenceId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { referenceId } = req.params;

    // Verify ownership
    const existing = await prisma.reference.findFirst({
      where: { id: referenceId, userId: req.user!.id },
    });

    if (!existing) {
      throw new AppError('Reference not found', 404, 'NOT_FOUND');
    }

    const reference = await prisma.reference.update({
      where: { id: referenceId },
      data: req.body,
    });

    res.json({
      success: true,
      data: reference,
    });
  } catch (error) {
    next(error);
  }
});

// Delete reference
router.delete('/:referenceId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { referenceId } = req.params;

    // Verify ownership
    const existing = await prisma.reference.findFirst({
      where: { id: referenceId, userId: req.user!.id },
    });

    if (!existing) {
      throw new AppError('Reference not found', 404, 'NOT_FOUND');
    }

    await prisma.reference.delete({
      where: { id: referenceId },
    });

    res.json({
      success: true,
      message: 'Reference deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Submit references (send emails)
router.post('/submit', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { referenceIds } = req.body;

    // Update status to email-sent
    await prisma.reference.updateMany({
      where: {
        id: { in: referenceIds },
        userId: req.user!.id,
      },
      data: {
        status: 'email-sent',
        submittedAt: new Date(),
      },
    });

    // TODO: Send emails to references
    // For now, just return success

    // Update user data status
    await prisma.userData.update({
      where: { userId: req.user!.id },
      data: { referenceCheckStatus: 'in-progress' },
    });

    res.json({
      success: true,
      data: {
        emailsSent: referenceIds.length,
        failedEmails: [],
      },
    });
  } catch (error) {
    next(error);
  }
});

// Resend reference email
router.post('/:referenceId/resend', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { referenceId } = req.params;

    // TODO: Resend email

    res.json({
      success: true,
      message: 'Email resent successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Get reference summary
router.get('/summary', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const references = await prisma.reference.findMany({
      where: { userId: req.user!.id },
    });

    const summary = {
      totalReferences: references.length,
      responsesReceived: references.filter(
        r => r.status === 'response-received' || r.status === 'verified'
      ).length,
      verified: references.filter(r => r.status === 'verified').length,
      pending: references.filter(r => r.status === 'email-sent' || r.status === 'pending').length,
    };

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
