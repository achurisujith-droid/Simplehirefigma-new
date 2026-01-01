import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { comparePassword, hashPassword } from '../utils/password';

export const getUserData = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        userData: true,
        references: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    // Calculate reference check status dynamically
    const references = user.references || [];
    let referenceCheckStatus = user.userData?.referenceCheckStatus || 'not-started';

    if (references.length > 0) {
      const hasSubmitted = references.some(ref => ref.status !== 'draft');
      const allVerified =
        references.length > 0 && references.every(ref => ref.status === 'verified');

      if (allVerified) {
        referenceCheckStatus = 'verified';
      } else if (hasSubmitted) {
        referenceCheckStatus = 'in-progress';
      }
    }

    res.json({
      success: true,
      data: {
        userId: user.id,
        id: user.id,
        email: user.email,
        name: user.name,
        purchasedProducts: user.userData?.purchasedProducts || [],
        interviewProgress: user.userData?.interviewProgress || {
          documentsUploaded: false,
          voiceInterview: false,
          mcqTest: false,
          codingChallenge: false,
        },
        idVerificationStatus: user.userData?.idVerificationStatus || 'not-started',
        referenceCheckStatus,
        references,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getPurchasedProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userData = await prisma.userData.findUnique({
      where: { userId: req.user!.id },
    });

    res.json({
      success: true,
      data: userData?.purchasedProducts || [],
    });
  } catch (error) {
    next(error);
  }
};

export const updateInterviewProgress = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const progress = req.body;

    const userData = await prisma.userData.update({
      where: { userId: req.user!.id },
      data: {
        interviewProgress: progress,
      },
    });

    res.json({
      success: true,
      data: userData,
      message: 'Progress updated',
    });
  } catch (error) {
    next(error);
  }
};

export const updateIdVerificationStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.body;

    const userData = await prisma.userData.update({
      where: { userId: req.user!.id },
      data: {
        idVerificationStatus: status,
      },
    });

    res.json({
      success: true,
      data: userData,
      message: 'Status updated',
    });
  } catch (error) {
    next(error);
  }
};

export const updateReferenceCheckStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.body;

    const userData = await prisma.userData.update({
      where: { userId: req.user!.id },
      data: {
        referenceCheckStatus: status,
      },
    });

    res.json({
      success: true,
      data: userData,
      message: 'Status updated',
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('currentPassword and newPassword are required', 400, 'VALIDATION_ERROR');
    }

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user || !user.passwordHash) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.passwordHash);

    if (!isValidPassword) {
      throw new AppError('Current password is incorrect', 401, 'INVALID_CREDENTIALS');
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate all refresh tokens for this user (force re-login on all devices)
    await prisma.refreshToken.deleteMany({
      where: { userId: req.user!.id },
    });

    res.json({
      success: true,
      message: 'Password changed successfully. Please log in again on all devices.',
    });
  } catch (error) {
    next(error);
  }
};
