/**
 * Session Manager Service
 * Manages interview sessions, state, questions, and answers
 * Supports both ElevenLabs and OpenAI voice providers
 * Uses Redis for session storage with graceful fallback to in-memory Map
 */

import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import prisma from '../config/database';
import logger from '../config/logger';
import config from '../config';

export interface VoiceQuestion {
  id: string;
  question: string;
  category: string;
  expectedDuration?: number;
}

export interface VoiceAnswer {
  questionId: string;
  question: string;
  transcript: string;
  timestamp: Date;
}

export interface InterviewSession {
  sessionId: string;
  userId: string;
  assessmentPlanId: string;
  provider: 'elevenlabs' | 'openai';
  status: 'active' | 'completed' | 'cancelled';
  questions: VoiceQuestion[];
  answers: VoiceAnswer[];
  currentQuestionIndex: number;
  resumeContext?: string;
  jobRole?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory session store (fallback when Redis is unavailable)
// Note: This implementation will lose data on server restarts and doesn't scale across multiple instances.
const sessions = new Map<string, InterviewSession>();

// Redis client for production session storage
let redisClient: Redis | null = null;
let useRedis = false;

// Session TTL in seconds (24 hours)
const SESSION_TTL = 24 * 60 * 60;

// Initialize Redis connection
try {
  if (config.redis.url) {
    redisClient = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      useRedis = true;
      logger.info('Redis client connected successfully');
    });

    redisClient.on('error', (err) => {
      useRedis = false;
      logger.error('Redis client error, falling back to in-memory storage', err);
    });

    // Attempt to connect
    redisClient.connect().catch((err) => {
      useRedis = false;
      logger.warn('Failed to connect to Redis, using in-memory storage', err);
    });
  } else {
    logger.info('REDIS_URL not configured, using in-memory session storage');
  }
} catch (error) {
  logger.warn('Failed to initialize Redis client, using in-memory storage', error);
}

export class SessionManager {
  /**
   * Store session in Redis or in-memory Map
   */
  private async setSession(sessionId: string, session: InterviewSession): Promise<void> {
    if (useRedis && redisClient) {
      try {
        await redisClient.setex(
          `session:${sessionId}`,
          SESSION_TTL,
          JSON.stringify(session)
        );
        return;
      } catch (error) {
        logger.error('Failed to store session in Redis, falling back to memory', error);
        useRedis = false;
      }
    }
    sessions.set(sessionId, session);
  }

  /**
   * Retrieve session from Redis or in-memory Map
   */
  private async getSessionData(sessionId: string): Promise<InterviewSession | undefined> {
    if (useRedis && redisClient) {
      try {
        const data = await redisClient.get(`session:${sessionId}`);
        if (data) {
          const session = JSON.parse(data) as InterviewSession;
          // Convert date strings back to Date objects
          session.createdAt = new Date(session.createdAt);
          session.updatedAt = new Date(session.updatedAt);
          session.answers = session.answers.map((a: VoiceAnswer) => ({
            ...a,
            timestamp: new Date(a.timestamp),
          }));
          return session;
        }
        return undefined;
      } catch (error) {
        logger.error('Failed to retrieve session from Redis, falling back to memory', error);
        useRedis = false;
      }
    }
    return sessions.get(sessionId);
  }

  /**
   * Delete session from Redis or in-memory Map
   */
  private async deleteSessionData(sessionId: string): Promise<void> {
    if (useRedis && redisClient) {
      try {
        await redisClient.del(`session:${sessionId}`);
        return;
      } catch (error) {
        logger.error('Failed to delete session from Redis, falling back to memory', error);
        useRedis = false;
      }
    }
    sessions.delete(sessionId);
  }

  /**
   * Create a new interview session
   */
  async createSession(params: {
    userId: string;
    assessmentPlanId: string;
    provider: 'elevenlabs' | 'openai';
    questions: VoiceQuestion[];
    resumeContext?: string;
    jobRole?: string;
  }): Promise<InterviewSession> {
    const sessionId = uuidv4();
    const now = new Date();

    const session: InterviewSession = {
      sessionId,
      userId: params.userId,
      assessmentPlanId: params.assessmentPlanId,
      provider: params.provider,
      status: 'active',
      questions: params.questions,
      answers: [],
      currentQuestionIndex: 0,
      resumeContext: params.resumeContext,
      jobRole: params.jobRole,
      createdAt: now,
      updatedAt: now,
    };

    await this.setSession(sessionId, session);
    logger.info('Created interview session', { sessionId, userId: params.userId });

    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<InterviewSession | undefined> {
    return this.getSessionData(sessionId);
  }

  /**
   * Add an answer to the session
   */
  async addAnswer(sessionId: string, answer: VoiceAnswer): Promise<void> {
    const session = await this.getSessionData(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.answers.push(answer);
    session.updatedAt = new Date();
    await this.setSession(sessionId, session);

    logger.info('Added answer to session', {
      sessionId,
      questionId: answer.questionId,
      answerLength: answer.transcript.length,
    });
  }

  /**
   * Get the next question in the interview
   */
  async getNextQuestion(sessionId: string): Promise<VoiceQuestion | null> {
    const session = await this.getSessionData(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const nextIndex = session.currentQuestionIndex + 1;
    if (nextIndex >= session.questions.length) {
      return null; // No more questions
    }
    
    session.currentQuestionIndex = nextIndex;
    session.updatedAt = new Date();
    await this.setSession(sessionId, session);

    return session.questions[session.currentQuestionIndex];
  }

  /**
   * Get current question
   */
  async getCurrentQuestion(sessionId: string): Promise<VoiceQuestion | null> {
    const session = await this.getSessionData(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.currentQuestionIndex >= session.questions.length) {
      return null;
    }

    return session.questions[session.currentQuestionIndex];
  }

  /**
   * Mark session as completed
   */
  async completeSession(sessionId: string): Promise<void> {
    const session = await this.getSessionData(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = 'completed';
    session.updatedAt = new Date();
    await this.setSession(sessionId, session);

    // Persist answers to database
    await this.persistSessionToDatabase(session);

    logger.info('Completed interview session', { sessionId });
  }

  /**
   * Cancel session
   */
  async cancelSession(sessionId: string): Promise<void> {
    const session = await this.getSessionData(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = 'cancelled';
    session.updatedAt = new Date();
    await this.setSession(sessionId, session);

    logger.info('Cancelled interview session', { sessionId });
  }

  /**
   * Delete session from storage
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.deleteSessionData(sessionId);
    logger.info('Deleted interview session', { sessionId });
  }

  /**
   * Persist session data to database
   */
  private async persistSessionToDatabase(session: InterviewSession): Promise<void> {
    try {
      const assessmentPlan = await prisma.assessmentPlan.findUnique({
        where: { id: session.assessmentPlanId },
      });

      if (!assessmentPlan) {
        throw new Error(`Assessment plan ${session.assessmentPlanId} not found`);
      }

      const interviewPlan = (assessmentPlan.interviewPlan as any) || {};

      // Update the interview plan with voice answers
      await prisma.assessmentPlan.update({
        where: { id: session.assessmentPlanId },
        data: {
          interviewPlan: {
            ...interviewPlan,
            voiceAnswers: session.answers.map(a => ({
              questionId: a.questionId,
              question: a.question,
              transcript: a.transcript,
              timestamp: a.timestamp,
            })),
          },
        },
      });

      logger.info('Persisted session to database', {
        sessionId: session.sessionId,
        answersCount: session.answers.length,
      });
    } catch (error) {
      logger.error('Failed to persist session to database', {
        sessionId: session.sessionId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get all active sessions for a user
   * Note: This only works efficiently with in-memory storage.
   * For Redis, consider implementing with key pattern scanning if needed.
   */
  async getUserActiveSessions(userId: string): Promise<InterviewSession[]> {
    const userSessions: InterviewSession[] = [];
    
    // For in-memory storage
    if (!useRedis || !redisClient) {
      sessions.forEach(session => {
        if (session.userId === userId && session.status === 'active') {
          userSessions.push(session);
        }
      });
      return userSessions;
    }

    // For Redis, we'd need to scan keys or maintain a separate index
    // For now, fall back to in-memory check
    logger.warn('getUserActiveSessions not optimized for Redis, using in-memory fallback');
    sessions.forEach(session => {
      if (session.userId === userId && session.status === 'active') {
        userSessions.push(session);
      }
    });
    return userSessions;
  }

  /**
   * Clean up old sessions (call this periodically)
   * Note: With Redis, sessions automatically expire via TTL
   * This cleanup is primarily for in-memory sessions
   */
  async cleanupOldSessions(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<number> {
    const now = new Date();
    let cleaned = 0;

    // For in-memory storage
    if (!useRedis || !redisClient) {
      const toDelete: string[] = [];
      sessions.forEach((session, sessionId) => {
        const ageMs = now.getTime() - session.updatedAt.getTime();
        if (ageMs > maxAgeMs && session.status !== 'active') {
          toDelete.push(sessionId);
        }
      });

      toDelete.forEach(sessionId => {
        sessions.delete(sessionId);
        cleaned++;
      });

      if (cleaned > 0) {
        logger.info('Cleaned up old sessions from memory', { count: cleaned });
      }

      return cleaned;
    }

    // For Redis, sessions expire automatically via TTL
    logger.info('Redis sessions expire automatically via TTL');
    return 0;
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
