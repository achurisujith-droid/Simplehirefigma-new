/**
 * Unified Assessment Types
 * Types for the unified assessment flow
 */

export type AssessmentComponentType = 'voice' | 'mcq' | 'code';
export type ComponentStatus = 'pending' | 'in_progress' | 'completed';

export interface AssessmentStatus {
  sessionId: string;
  status: string;
  progressPercentage: number;
  components: {
    voice: ComponentStatus;
    mcq: ComponentStatus;
    code: ComponentStatus;
  };
  resumeComponent?: AssessmentComponentType;
}

export interface StartAssessmentRequest {
  name: string;
  jobTitle: string;
  resumeFile?: File;
  resumeText?: string;
}

export interface StartAssessmentResponse {
  sessionId: string;
  message: string;
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: number; // Only sent after submission
}

export interface MCQGenerateResponse {
  sessionId: string;
  questions: MCQQuestion[];
}

export interface MCQSubmitRequest {
  answers: { [questionId: string]: number };
}

export interface MCQSubmitResponse {
  sessionId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
}

export interface CodeChallenge {
  id: string;
  title: string;
  description: string;
  starterCode?: string;
  testCases?: Array<{
    input: string;
    expectedOutput: string;
  }>;
}

export interface CodeGenerateResponse {
  sessionId: string;
  challenge: CodeChallenge;
}

export interface CodeSubmitRequest {
  code: string;
  language: string;
}

export interface CodeSubmitResponse {
  sessionId: string;
  score: number;
  passed: boolean;
  feedback?: string;
}

export interface VoiceLinkRequest {
  interviewId: string;
}

export interface VoiceLinkResponse {
  sessionId: string;
  message: string;
}

export interface CompleteResponse {
  sessionId: string;
  status: string;
  message: string;
}

export interface AssessmentResults {
  sessionId: string;
  overallScore: number;
  level: string;
  components: {
    voice?: {
      score: number;
      status: ComponentStatus;
    };
    mcq?: {
      score: number;
      correctAnswers: number;
      totalQuestions: number;
      status: ComponentStatus;
    };
    code?: {
      score: number;
      passed: boolean;
      status: ComponentStatus;
    };
  };
  certificate?: {
    id: string;
    url: string;
    issuedAt: string;
  };
  completedAt?: string;
}
