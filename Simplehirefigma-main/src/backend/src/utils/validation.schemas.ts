import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required').toLowerCase(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required').toLowerCase(),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const resumeUploadSchema = z.object({
  body: z.object({
    primarySkill: z.string().min(1, 'Primary skill is required').optional(),
  }),
});

export const sessionHeartbeatSchema = z.object({
  body: z.object({
    sessionId: z.string().uuid('Valid session ID is required'),
  }),
});

export const sessionExpireSchema = z.object({
  body: z.object({
    sessionId: z.string().uuid('Valid session ID is required'),
    reason: z.string().optional(),
  }),
});

export const createAssessmentSchema = z.object({
  body: z.object({
    primarySkill: z.string().min(1, 'Primary skill is required'),
  }),
});

export type SignupInput = z.infer<typeof signupSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type ResumeUploadInput = z.infer<typeof resumeUploadSchema>['body'];
export type SessionHeartbeatInput = z.infer<typeof sessionHeartbeatSchema>['body'];
export type SessionExpireInput = z.infer<typeof sessionExpireSchema>['body'];
export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>['body'];
