import { v4 as uuidv4 } from 'uuid';
import prisma from '../../config/database';
import logger from '../../config/logger';

export interface SessionData {
  resumeText?: string;
  questions?: any[];
  analysis?: any;
  [key: string]: any;
}

export class SessionService {
  async createSession(sessionData: SessionData, ownerId: string, userId?: string): Promise<string> {
    const sessionId = uuidv4();
    try {
      await prisma.session.create({
        data: {
          sessionId,
          userId: userId || null,
          ownerId,
          status: 'active',
          data: sessionData,
          lastActivity: new Date(),
        },
      });
      logger.info('Session created', { sessionId, ownerId, userId });
      return sessionId;
    } catch (error) {
      logger.error('Failed to create session', { error, ownerId });
      throw new Error('Failed to create session');
    }
  }

  async getSession(sessionId: string, ownerId?: string): Promise<any | null> {
    try {
      const where: any = { sessionId };
      if (ownerId) {
        where.OR = [{ ownerId }, { userId: ownerId }];
      }
      const session = await prisma.session.findFirst({ where });
      if (!session || session.status === 'expired') {
        return null;
      }
      return session;
    } catch (error) {
      logger.error('Failed to get session', { error, sessionId });
      return null;
    }
  }

  async updateSession(sessionId: string, updates: Partial<SessionData>, ownerId?: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId, ownerId);
      if (!session) return false;
      const newData = { ...(session.data as SessionData), ...updates };
      await prisma.session.update({
        where: { sessionId },
        data: { data: newData, lastActivity: new Date() },
      });
      return true;
    } catch (error) {
      logger.error('Failed to update session', { error, sessionId });
      return false;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      await prisma.session.delete({ where: { sessionId } });
      logger.info('Session deleted', { sessionId });
      return true;
    } catch (error) {
      logger.error('Failed to delete session', { error, sessionId });
      return false;
    }
  }

  async expireSession(sessionId: string, reason?: string): Promise<boolean> {
    try {
      await prisma.session.update({
        where: { sessionId },
        data: {
          status: 'expired',
          expiryReason: reason || 'Manual expiry',
          expiredAt: new Date(),
        },
      });
      logger.info('Session expired', { sessionId, reason });
      return true;
    } catch (error) {
      logger.error('Failed to expire session', { error, sessionId });
      return false;
    }
  }

  async updateSessionActivity(sessionId: string): Promise<boolean> {
    try {
      await prisma.session.update({
        where: { sessionId },
        data: { lastActivity: new Date() },
      });
      return true;
    } catch (error) {
      logger.error('Failed to update session activity', { error, sessionId });
      return false;
    }
  }

  async cleanupOldSessions(maxAgeMs: number = 3600000): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - maxAgeMs);
      const result = await prisma.session.deleteMany({
        where: {
          lastActivity: { lt: cutoffDate },
          status: 'active',
        },
      });
      if (result.count > 0) {
        logger.info(`Cleaned up ${result.count} old sessions`);
      }
      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup old sessions', { error });
      return 0;
    }
  }

  async getUserSessions(userId: string): Promise<any[]> {
    try {
      return await prisma.session.findMany({
        where: { userId, status: 'active' },
        orderBy: { lastActivity: 'desc' },
      });
    } catch (error) {
      logger.error('Failed to get user sessions', { error, userId });
      return [];
    }
  }
}

export default new SessionService();
