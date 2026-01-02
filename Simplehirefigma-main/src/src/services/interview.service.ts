/**
 * Interview Service
 * Handles skill interview-related API calls
 */

import { apiClient } from './api-client';
import type { ApiResponse, MCQQuestion, CodingChallenge, SkillAssessment } from '../types';

export const interviewService = {
  /**
   * Start assessment with resume upload
   */
  async startAssessment(
    resume: File,
    idCard?: File
  ): Promise<ApiResponse<{
    sessionId: string;
    plan: any;
    analysis: any;
    voiceQuestions: any[];
    resumeUrl: string;
    idCardUrl?: string;
  }>> {
    const formData = new FormData();
    formData.append('resume', resume);
    if (idCard) {
      formData.append('idCard', idCard);
    }

    // Don't set Content-Type header - let browser set it with boundary
    // Setting it manually will break multipart form data
    return apiClient.post('/interviews/start-assessment', formData);
  },

  /**
   * Upload interview documents (resume, cover letter)
   */
  async uploadDocuments(
    resume: File,
    coverLetter?: File
  ): Promise<ApiResponse<{ resumeUrl: string; coverLetterUrl?: string }>> {
    const formData = new FormData();
    formData.append('resume', resume);
    if (coverLetter) {
      formData.append('coverLetter', coverLetter);
    }

    return apiClient.uploadFile('/interviews/documents', resume, {
      ...(coverLetter && { coverLetter }),
    });
  },

  /**
   * Start voice interview session
   */
  async startVoiceInterview(role: string): Promise<ApiResponse<{ sessionId: string }>> {
    return apiClient.post('/interviews/voice/start', { role });
  },

  /**
   * Submit voice interview recording
   */
  async submitVoiceInterview(
    sessionId: string,
    audioBlob: Blob
  ): Promise<ApiResponse<void>> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'interview.webm');
    formData.append('sessionId', sessionId);

    return apiClient.uploadFile('/interviews/voice/submit', audioBlob as File, { sessionId });
  },

  /**
   * Get MCQ test questions
   */
  async getMCQQuestions(role: string): Promise<ApiResponse<MCQQuestion[]>> {
    return apiClient.get<MCQQuestion[]>(`/interviews/mcq?role=${role}`);
  },

  /**
   * Submit MCQ test answers
   */
  async submitMCQTest(
    answers: Array<{ questionId: string; selectedOptionIndex: number }>
  ): Promise<ApiResponse<{ score: number; totalQuestions: number }>> {
    return apiClient.post('/interviews/mcq/submit', { answers });
  },

  /**
   * Get coding challenge
   */
  async getCodingChallenge(role: string): Promise<ApiResponse<CodingChallenge>> {
    return apiClient.get<CodingChallenge>(`/interviews/coding?role=${role}`);
  },

  /**
   * Submit coding challenge solution
   */
  async submitCodingChallenge(
    challengeId: string,
    code: string,
    language: string
  ): Promise<ApiResponse<{ passed: boolean; testResults: any[] }>> {
    return apiClient.post('/interviews/coding/submit', {
      challengeId,
      code,
      language,
    });
  },

  /**
   * Get interview evaluation results
   */
  async getEvaluationResults(): Promise<ApiResponse<SkillAssessment[]>> {
    return apiClient.get<SkillAssessment[]>('/interviews/evaluation');
  },

  /**
   * Generate interview certificate
   */
  async generateCertificate(): Promise<ApiResponse<{ certificateId: string; certificateUrl: string }>> {
    return apiClient.post('/interviews/certificate');
  },

  /**
   * Get certificate by ID
   */
  async getCertificate(certificateId: string): Promise<ApiResponse<any>> {
    return apiClient.get(`/interviews/certificate/${certificateId}`);
  },
};
