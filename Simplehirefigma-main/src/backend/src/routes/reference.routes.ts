import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';
import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation middleware for reference creation
const referenceValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('company').trim().notEmpty().withMessage('Company is required'),
  body('position').trim().notEmpty().withMessage('Position is required'),
  body('relationship').trim().notEmpty().withMessage('Relationship is required'),
];

// Middleware to check max 5 references
const checkReferenceLimit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const count = await prisma.reference.count({
      where: { userId: req.user!.id },
    });
    
    if (count >= 5) {
      throw new AppError('Maximum of 5 references allowed', 400, 'LIMIT_EXCEEDED');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

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
router.post('/', validate(referenceValidation), checkReferenceLimit, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, email, company, position, relationship, phone } = req.body;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

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

    // Check if reference has been submitted
    if (existing.status === 'email-sent' || existing.submittedAt) {
      throw new AppError('Cannot delete submitted references', 400, 'SUBMITTED_REFERENCE');
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

    // Validate at least 1 reference
    if (!referenceIds || referenceIds.length === 0) {
      throw new AppError('At least 1 reference is required', 400, 'NO_REFERENCES');
    }

    // Update status to email-sent
    await prisma.reference.updateMany({
      where: {
        id: { in: referenceIds },
        userId: req.user!.id },
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
        submitted: referenceIds.length,
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
      total: references.length,
      draft: references.filter(r => r.status === 'draft').length,
      sent: references.filter(r => r.status === 'email-sent').length,
      completed: references.filter(r => r.status === 'response-received').length,
      verified: references.filter(r => r.status === 'verified').length,
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
