/**
 * Audit Logging Middleware
 * Logs all API requests for security and debugging purposes
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import logger from '../config/logger';

interface AuditLogEntry {
  timestamp: string;
  method: string;
  path: string;
  userId?: string;
  userEmail?: string;
  ip: string;
  userAgent?: string;
  statusCode?: number;
  responseTime?: number;
  error?: string;
}

export const auditLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Extract user info if authenticated
  const authReq = req as AuthRequest;
  const userId = authReq.user?.id;
  const userEmail = authReq.user?.email;
  
  // Get client IP (handle proxy)
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
    || req.socket.remoteAddress 
    || 'unknown';
  
  // Get user agent
  const userAgent = req.headers['user-agent'];

  // Log on response finish
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    const auditEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      userId,
      userEmail,
      ip,
      userAgent,
      statusCode: res.statusCode,
      responseTime,
    };

    // Only log API requests, not health checks or static files
    if (req.path.startsWith('/api/') && !req.path.includes('/health')) {
      // Log with appropriate level based on status code
      if (res.statusCode >= 500) {
        logger.error('API Request - Server Error', auditEntry);
      } else if (res.statusCode >= 400) {
        logger.warn('API Request - Client Error', auditEntry);
      } else {
        logger.info('API Request', auditEntry);
      }
    }
  });

  next();
};
