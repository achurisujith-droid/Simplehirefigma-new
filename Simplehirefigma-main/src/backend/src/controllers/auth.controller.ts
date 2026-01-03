import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../utils/errors';
import { sha256Hash } from '../utils/crypto';
import logger from '../config/logger';
import config, { getSessionCookieOptions } from '../config';
import { createDefaultUserData } from '../utils/userData';

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError('email already registered', 400, 'DUPLICATE_EMAIL');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        userData: {
          create: {
            purchasedProducts: [],
            interviewProgress: {
              documentsUploaded: false,
              voiceInterview: false,
              mcqTest: false,
              codingChallenge: false,
            },
            idVerificationStatus: 'not-started',
            referenceCheckStatus: 'not-started',
          },
        },
      },
    });

    // Generate tokens
    const token = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    // Hash refresh token before storing (SHA-256)
    const hashedRefreshToken = sha256Hash(refreshToken);

    // Store hashed refresh token (with error handling for foreign key constraint)
    try {
      await prisma.refreshToken.create({
        data: {
          token: hashedRefreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
    } catch (error: any) {
      // Handle foreign key constraint error (user was deleted during race condition)
      if (error.code === 'P2003') {
        throw new AppError('Account creation failed. Please try again.', 500, 'USER_CREATION_ERROR');
      }
      throw error;
    }

    // Create DB-backed session for persistent login
    const sessionId = `sess_${user.id}_${Date.now()}`;
    await prisma.session.create({
      data: {
        sessionId,
        userId: user.id,
        status: 'active',
        data: {
          userAgent: req.headers['user-agent'] || 'unknown',
          ip: req.ip || 'unknown',
        },
        lastActivity: new Date(),
      },
    });

    // Log signup event
    logger.info(`User signed up: ${user.email}`, { userId: user.id, sessionId });

    // Set HTTP-only session cookie
    const cookieOptions = getSessionCookieOptions();
    res.cookie(config.cookie.name, token, cookieOptions);
    
    // Log cookie being set
    logger.info('Session cookie set', {
      userId: user.id,
      cookieName: config.cookie.name,
      cookieOptions: {
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        maxAge: cookieOptions.maxAge,
        path: cookieOptions.path,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
        token,
        refreshToken,
      },
      message: 'Account created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);

    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Ensure userData exists (for accounts created before userData was added)
    // Use upsert to create userData if it doesn't exist
    await prisma.userData.upsert({
      where: { userId: user.id },
      update: {}, // Don't update if exists
      create: createDefaultUserData(user.id),
    });

    // Generate tokens
    const token = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    // Hash refresh token before storing (SHA-256)
    const hashedRefreshToken = sha256Hash(refreshToken);

    // Store hashed refresh token (with error handling for foreign key constraint)
    try {
      await prisma.refreshToken.create({
        data: {
          token: hashedRefreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    } catch (error: any) {
      // Handle foreign key constraint error (user was deleted)
      if (error.code === 'P2003') {
        throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
      }
      throw error;
    }

    // Create DB-backed session for persistent login
    const sessionId = `sess_${user.id}_${Date.now()}`;
    await prisma.session.create({
      data: {
        sessionId,
        userId: user.id,
        status: 'active',
        data: {
          userAgent: req.headers['user-agent'] || 'unknown',
          ip: req.ip || 'unknown',
        },
        lastActivity: new Date(),
      },
    });

    // Log login event
    logger.info(`User logged in: ${user.email}`, { userId: user.id, sessionId });

    // Set HTTP-only session cookie
    const cookieOptions = getSessionCookieOptions();
    res.cookie(config.cookie.name, token, cookieOptions);
    
    // Log cookie being set
    logger.info('Session cookie set', {
      userId: user.id,
      cookieName: config.cookie.name,
      cookieOptions: {
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        maxAge: cookieOptions.maxAge,
        path: cookieOptions.path,
      },
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token required', 400, 'MISSING_TOKEN');
    }

    // Verify refresh token JWT - wrap in try-catch for JWT errors
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error: any) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new AppError('Invalid or expired refresh token', 401, 'INVALID_TOKEN');
      }
      throw error;
    }

    // Hash the provided refresh token to match stored hash
    const hashedRefreshToken = sha256Hash(refreshToken);

    // Check if hashed refresh token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: hashedRefreshToken },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_TOKEN');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(decoded.userId, decoded.email);
    const newRefreshToken = generateRefreshToken(decoded.userId, decoded.email);

    // Hash new refresh token
    const hashedNewRefreshToken = sha256Hash(newRefreshToken);

    // Delete old refresh token and create new one
    await prisma.refreshToken.delete({
      where: { token: hashedRefreshToken },
    });

    await prisma.refreshToken.create({
      data: {
        token: hashedNewRefreshToken,
        userId: decoded.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    // If specific refresh token provided, logout from that session only
    if (refreshToken) {
      const hashedRefreshToken = sha256Hash(refreshToken);
      await prisma.refreshToken.deleteMany({
        where: { 
          userId: req.user!.id,
          token: hashedRefreshToken,
        },
      });
      
      logger.info(`User logged out from single session: ${req.user!.id}`);
    } else {
      // Delete all refresh tokens for user (logout from all devices)
      await prisma.refreshToken.deleteMany({
        where: { userId: req.user!.id },
      });
      
      logger.info(`User logged out from all sessions: ${req.user!.id}`);
    }

    // Expire all active sessions for this user
    await prisma.session.updateMany({
      where: { 
        userId: req.user!.id,
        status: 'active',
      },
      data: {
        status: 'expired',
        expiryReason: refreshToken ? 'logout' : 'logout_all',
        expiredAt: new Date(),
      },
    });

    // Clear the session cookie
    res.cookie(config.cookie.name, '', getSessionCookieOptions(true));

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const logoutAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Delete all refresh tokens for user (force logout from all devices)
    await prisma.refreshToken.deleteMany({
      where: { userId: req.user!.id },
    });

    // Expire all active sessions for this user
    await prisma.session.updateMany({
      where: { 
        userId: req.user!.id,
        status: 'active',
      },
      data: {
        status: 'expired',
        expiryReason: 'logout_all_forced',
        expiredAt: new Date(),
      },
    });

    // Clear the session cookie
    res.cookie(config.cookie.name, '', getSessionCookieOptions(true));

    logger.info(`User logged out from all sessions (forced): ${req.user!.id}`);

    res.json({
      success: true,
      message: 'Logged out from all devices successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Google OAuth login (simplified - you'd use google-auth-library in production)
export const googleLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idToken } = req.body;

    // In production, verify idToken with Google
    // const ticket = await client.verifyIdToken({ idToken, audience: config.google.clientId });
    // const payload = ticket.getPayload();

    // For now, this is a placeholder
    throw new AppError('Google OAuth not fully implemented', 501, 'NOT_IMPLEMENTED');

    // Once verified, create or find user and return tokens
  } catch (error) {
    next(error);
  }
};
