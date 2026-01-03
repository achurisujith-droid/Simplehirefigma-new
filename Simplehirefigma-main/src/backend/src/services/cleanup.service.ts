/**
 * Cleanup Service
 * Handles cleanup of expired tokens and sessions
 */

import prisma from '../config/database';
import logger from '../config/logger';

export class CleanupService {
  /**
   * Clean up expired refresh tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      if (result.count > 0) {
        logger.info(`Cleaned up ${result.count} expired refresh tokens`);
      }

      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup expired tokens', error);
      return 0;
    }
  }

  /**
   * Clean up old inactive sessions (older than 30 days)
   */
  async cleanupOldSessions(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const result = await prisma.session.deleteMany({
        where: {
          OR: [
            {
              status: 'expired',
              expiredAt: {
                lt: thirtyDaysAgo,
              },
            },
            {
              status: 'cancelled',
              updatedAt: {
                lt: thirtyDaysAgo,
              },
            },
            {
              status: 'active',
              lastActivity: {
                lt: thirtyDaysAgo,
              },
            },
          ],
        },
      });

      if (result.count > 0) {
        logger.info(`Cleaned up ${result.count} old sessions`);
      }

      return result.count;
    } catch (error) {
      logger.error('Failed to cleanup old sessions', error);
      return 0;
    }
  }

  /**
   * Run all cleanup tasks
   */
  async runCleanup(): Promise<void> {
    logger.info('Starting cleanup tasks');

    const tokensCleanedCount = await this.cleanupExpiredTokens();
    const sessionsCleanedCount = await this.cleanupOldSessions();

    logger.info('Cleanup tasks completed', {
      tokensCleanedCount,
      sessionsCleanedCount,
    });
  }

  /**
   * Start periodic cleanup (every 1 hour)
   */
  startPeriodicCleanup(): void {
    // Run immediately on startup
    this.runCleanup();

    // Then run every hour
    setInterval(() => {
      this.runCleanup();
    }, 60 * 60 * 1000); // 1 hour

    logger.info('Periodic cleanup service started (runs every 1 hour)');
  }
}

// Export singleton instance
export const cleanupService = new CleanupService();
