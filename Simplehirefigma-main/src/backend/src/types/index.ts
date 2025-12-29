import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  details?: any;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  email: string;
  password: string;
  name: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface InterviewProgress {
  documentsUploaded: boolean;
  voiceInterview: boolean;
  mcqTest: boolean;
  codingChallenge: boolean;
}

export interface ProductConfig {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
}

export const PRODUCTS: ProductConfig[] = [
  {
    id: 'skill',
    name: 'Skill verification',
    description: 'AI-powered interview validates your professional skills',
    price: 4900, // $49.00 in cents
    features: [
      '15-min AI interview',
      'MCQ test (20 questions)',
      'Coding challenge',
      'Instant certificate',
    ],
  },
  {
    id: 'id-visa',
    name: 'ID + Visa verification',
    description: 'Validate government ID and work authorization',
    price: 1500, // $15.00 in cents
    features: [
      'ID document verification',
      'Visa/EAD check',
      'Selfie verification',
      '24-48hr review',
    ],
  },
  {
    id: 'reference',
    name: 'Reference check',
    description: 'Professional references collection and verification',
    price: 1000, // $10.00 in cents
    features: [
      'Up to 5 references',
      'Automated email outreach',
      'Response tracking',
      'Verification summary',
    ],
  },
  {
    id: 'combo',
    name: 'Complete combo',
    description: 'All three verifications at a discounted price',
    price: 6000, // $60.00 in cents (save $14)
    features: [
      'All skill verification features',
      'All ID verification features',
      'All reference check features',
      'Save $14',
    ],
  },
];

export type VerificationStatus = 'not-started' | 'in-progress' | 'pending' | 'verified';
export type ReferenceStatus = 'draft' | 'pending' | 'email-sent' | 'response-received' | 'verified';
export type DocumentType = 'passport' | 'drivers-license' | 'national-id' | 'visa' | 'ead' | 'green-card';
