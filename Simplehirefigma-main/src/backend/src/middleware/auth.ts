import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, TokenPayload } from '../types';
import config from '../config';
import { AppError } from '../utils/errors';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;
    
    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // Fallback to session cookie
    if (!token && req.cookies?.[config.cookie.name]) {
      token = req.cookies[config.cookie.name];
    }

    if (!token) {
      throw new AppError('No token provided', 401, 'UNAUTHORIZED');
    }

    const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: '',
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401, 'TOKEN_EXPIRED'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401, 'INVALID_TOKEN'));
    }
    next(error);
  }
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;
    
    // Check Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // Fallback to session cookie
    if (!token && req.cookies?.[config.cookie.name]) {
      token = req.cookies[config.cookie.name];
    }

    if (!token) {
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
    } catch (error) {
      req.user = undefined;
    }

    next();
  } catch (error) {
    req.user = undefined;
    next();
  }
};
