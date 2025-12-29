import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../types';
import sessionService from './session.service';
import { AppError } from '../../utils/errors';

export const heartbeat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      throw new AppError('Session ID is required', 400, 'MISSING_SESSION_ID');
    }
    const updated = await sessionService.updateSessionActivity(sessionId);
    if (!updated) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }
    res.json({ success: true, message: 'Session heartbeat recorded' });
  } catch (error) {
    next(error);
  }
};

export const expireSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, reason } = req.body;
    if (!sessionId) {
      throw new AppError('Session ID is required', 400, 'MISSING_SESSION_ID');
    }
    const expired = await sessionService.expireSession(sessionId, reason);
    if (!expired) {
      throw new AppError('Session not found', 404, 'SESSION_NOT_FOUND');
    }
    res.json({ success: true, message: 'Session expired' });
  } catch (error) {
    next(error);
  }
};

export const getSessionStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      throw new AppError('Session ID is required', 400, 'MISSING_SESSION_ID');
    }
    const session = await sessionService.getSession(sessionId);
    if (!session) {
      throw new AppError('Session not found or expired', 404, 'SESSION_NOT_FOUND');
    }
    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        status: session.status,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserSessions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }
    const sessions = await sessionService.getUserSessions(req.user.id);
    res.json({
      success: true,
      data: sessions.map((session) => ({
        sessionId: session.sessionId,
        status: session.status,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};
