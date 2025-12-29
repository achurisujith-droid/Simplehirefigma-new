/**
 * Core Type Definitions for Simplehire Application
 * Centralized types for better maintainability and type safety
 */

export type VerificationStatus = "not-started" | "in-progress" | "pending" | "verified";

export type ReferenceStatus = "draft" | "pending" | "email-sent" | "response-received" | "verified";

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InterviewProgress {
  documentsUploaded: boolean;
  voiceInterview: boolean;
  mcqTest: boolean;
  codingChallenge: boolean;
}

export interface ReferenceItem {
  id: string;
  name: string;
  email: string;
  company: string;
  position: string;
  relationship: string;
  phone?: string;
  status: ReferenceStatus;
  submittedAt?: string;
  responseReceivedAt?: string;
  verifiedAt?: string;
}

export interface UserData extends User {
  purchasedProducts: string[];
  interviewProgress: InterviewProgress;
  idVerificationStatus: VerificationStatus;
  referenceCheckStatus: VerificationStatus;
  references: ReferenceItem[];
  draftReferences?: ReferenceItem[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
}

export interface Plan {
  id: string;
  name: string;
  price: string;
}

export interface Certificate {
  id: string;
  userId: string;
  productId: string;
  issueDate: string;
  certificateNumber: string;
  status: "active" | "revoked";
  skills?: SkillAssessment[];
}

export interface SkillAssessment {
  category: string;
  score: number;
  feedback?: string;
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface CodingChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  testCases: TestCase[];
  starterCode: string;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface IDVerificationData {
  userId: string;
  idDocumentUrl?: string;
  visaDocumentUrl?: string;
  selfieUrl?: string;
  status: VerificationStatus;
  submittedAt?: string;
  reviewedAt?: string;
  notes?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface SignupResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// API Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
