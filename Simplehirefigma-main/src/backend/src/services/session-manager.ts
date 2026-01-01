/**
 * Session Manager Service
 * Manages interview sessions, state, questions, and answers
 * Supports both ElevenLabs and OpenAI voice providers
 */

import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import logger from '../config/logger';

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

// In-memory session store (can be replaced with Redis in production)
// Note: This implementation will lose data on server restarts and doesn't scale across multiple instances.
// For production, consider using Redis with a library like 'ioredis' or 'redis' npm package.
// Example migration path:
// 1. Install redis client: npm install ioredis
// 2. Replace Map with Redis client
// 3. Serialize/deserialize session data as JSON
const sessions = new Map<string, InterviewSession>();

export class SessionManager {
  /**
   * Create a new interview session
   */
  createSession(params: {
    userId: string;
    assessmentPlanId: string;
    provider: 'elevenlabs' | 'openai';
    questions: VoiceQuestion[];
    resumeContext?: string;
    jobRole?: string;
  }): InterviewSession {
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

    sessions.set(sessionId, session);
    logger.info('Created interview session', { sessionId, userId: params.userId });

    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): InterviewSession | undefined {
    return sessions.get(sessionId);
  }

  /**
   * Add an answer to the session
   */
  addAnswer(sessionId: string, answer: VoiceAnswer): void {
    const session = sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.answers.push(answer);
    session.updatedAt = new Date();
    sessions.set(sessionId, session);

    logger.info('Added answer to session', {
      sessionId,
      questionId: answer.questionId,
      answerLength: answer.transcript.length,
    });
  }

  /**
   * Get the next question in the interview
   */
  getNextQuestion(sessionId: string): VoiceQuestion | null {
    const session = sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.currentQuestionIndex++;
    session.updatedAt = new Date();
    sessions.set(sessionId, session);

    if (session.currentQuestionIndex >= session.questions.length) {
      return null; // No more questions
    }

    return session.questions[session.currentQuestionIndex];
  }

  /**
   * Get current question
   */
  getCurrentQuestion(sessionId: string): VoiceQuestion | null {
    const session = sessions.get(sessionId);
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
    const session = sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = 'completed';
    session.updatedAt = new Date();
    sessions.set(sessionId, session);

    // Persist answers to database
    await this.persistSessionToDatabase(session);

    logger.info('Completed interview session', { sessionId });
  }

  /**
   * Cancel session
   */
  cancelSession(sessionId: string): void {
    const session = sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = 'cancelled';
    session.updatedAt = new Date();
    sessions.set(sessionId, session);

    logger.info('Cancelled interview session', { sessionId });
  }

  /**
   * Delete session from memory
   */
  deleteSession(sessionId: string): void {
    sessions.delete(sessionId);
    logger.info('Deleted interview session from memory', { sessionId });
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
   */
  getUserActiveSessions(userId: string): InterviewSession[] {
    const userSessions: InterviewSession[] = [];
    sessions.forEach(session => {
      if (session.userId === userId && session.status === 'active') {
        userSessions.push(session);
      }
    });
    return userSessions;
  }

  /**
   * Clean up old sessions (call this periodically)
   * Note: In production, this should be called by a cron job or scheduled task
   * Example: setInterval(() => sessionManager.cleanupOldSessions(), 60 * 60 * 1000)
   */
  cleanupOldSessions(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const now = new Date();
    let cleaned = 0;

    sessions.forEach((session, sessionId) => {
      const ageMs = now.getTime() - session.updatedAt.getTime();
      if (ageMs > maxAgeMs && session.status !== 'active') {
        sessions.delete(sessionId);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      logger.info('Cleaned up old sessions', { count: cleaned });
    }

    return cleaned;
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
