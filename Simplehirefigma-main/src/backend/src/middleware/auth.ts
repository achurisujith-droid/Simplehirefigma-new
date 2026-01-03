import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, TokenPayload } from '../types';
import config from '../config';
import { AppError } from '../utils/errors';
import logger from '../config/logger';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || 'unknown';
  const path = req.path;
  
  try {
    let token: string | undefined;
    let tokenSource: 'header' | 'cookie' | 'none' = 'none';
    
    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      tokenSource = 'header';
    }
    
    // Fallback to cookies (check multiple cookie names)
    if (!token && req.cookies) {
      token = req.cookies[config.cookie.name] || req.cookies.accessToken || req.cookies.token;
      if (token) {
        tokenSource = 'cookie';
      }
    }

    if (!token) {
      logger.warn('Authentication failed: No token provided', {
        path,
        requestId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      throw new AppError('No token provided', 401, 'UNAUTHORIZED');
    }

    const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: '',
    };

    logger.debug('Authentication successful', {
      userId: decoded.userId,
      email: decoded.email,
      tokenSource,
      path,
      requestId,
    });

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Authentication failed: Token expired', {
        path,
        requestId,
        ip: req.ip,
        error: error.message,
        expiredAt: error.expiredAt,
      });
      return next(new AppError('Token expired', 401, 'TOKEN_EXPIRED'));
    }
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Authentication failed: Invalid token', {
        path,
        requestId,
        ip: req.ip,
        error: error.message,
      });
      return next(new AppError('Invalid token', 401, 'INVALID_TOKEN'));
    }
    logger.error('Authentication error', {
      path,
      requestId,
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || 'unknown';
  const path = req.path;
  
  try {
    let token: string | undefined;
    let tokenSource: 'header' | 'cookie' | 'none' = 'none';
    
    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      tokenSource = 'header';
    }
    
    // Fallback to cookies (check multiple cookie names)
    if (!token && req.cookies) {
      token = req.cookies[config.cookie.name] || req.cookies.accessToken || req.cookies.token;
      if (token) {
        tokenSource = 'cookie';
      }
    }

    if (!token) {
      logger.debug('Optional auth: No token provided', { path, requestId });
      req.user = undefined;
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        name: '',
      };
      logger.debug('Optional auth: Authentication successful', {
        userId: decoded.userId,
        tokenSource,
        path,
        requestId,
      });
    } catch (error: any) {
      logger.debug('Optional auth: Token invalid or expired', {
        path,
        requestId,
        error: error.message,
      });
      req.user = undefined;
    }

    next();
  } catch (error) {
    logger.debug('Optional auth: Error occurred', {
      path,
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    req.user = undefined;
    next();
  }
};
