/**
 * Unified Assessment API Client
 * Typed client for all unified assessment endpoints
 */

import type {
  StartAssessmentRequest,
  StartAssessmentResponse,
  AssessmentStatus,
  MCQGenerateResponse,
  MCQSubmitRequest,
  MCQSubmitResponse,
  CodeGenerateResponse,
  CodeSubmitRequest,
  CodeSubmitResponse,
  VoiceLinkRequest,
  VoiceLinkResponse,
  CompleteResponse,
  AssessmentResults,
} from '@/types/assessment';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Generic request helper
 */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('authToken'); // Match your auth token key
  const headers = new Headers(init.headers);
  
  if (!(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || `Request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Unified Assessment API
 */
export const UnifiedAssessmentAPI = {
  /**
   * Start a new assessment session
   */
  async start(data: StartAssessmentRequest): Promise<StartAssessmentResponse> {
    if (data.resumeFile) {
      // Upload with file
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('jobTitle', data.jobTitle);
      formData.append('resume', data.resumeFile);

      return request<StartAssessmentResponse>('/unified-assessment/start', {
        method: 'POST',
        body: formData,
      });
    } else {
      // Upload with text
      return request<StartAssessmentResponse>('/unified-assessment/start', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          jobTitle: data.jobTitle,
          resumeText: data.resumeText,
        }),
      });
    }
  },

  /**
   * Get current assessment status
   */
  async getStatus(sessionId: string): Promise<AssessmentStatus> {
    return request<AssessmentStatus>(`/unified-assessment/${sessionId}/status`, {
      method: 'GET',
    });
  },

  /**
   * Generate MCQ questions
   */
  async generateMcq(sessionId: string): Promise<MCQGenerateResponse> {
    return request<MCQGenerateResponse>(`/unified-assessment/${sessionId}/mcq/generate`, {
      method: 'POST',
    });
  },

  /**
   * Submit MCQ answers
   */
  async submitMcq(sessionId: string, answers: MCQSubmitRequest): Promise<MCQSubmitResponse> {
    return request<MCQSubmitResponse>(`/unified-assessment/${sessionId}/mcq/submit`, {
      method: 'POST',
      body: JSON.stringify(answers),
    });
  },

  /**
   * Generate coding challenge
   */
  async generateCode(sessionId: string): Promise<CodeGenerateResponse> {
    return request<CodeGenerateResponse>(`/unified-assessment/${sessionId}/code/generate`, {
      method: 'POST',
    });
  },

  /**
   * Submit coding solution
   */
  async submitCode(sessionId: string, data: CodeSubmitRequest): Promise<CodeSubmitResponse> {
    return request<CodeSubmitResponse>(`/unified-assessment/${sessionId}/code/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Link voice interview
   */
  async linkVoice(sessionId: string, data: VoiceLinkRequest): Promise<VoiceLinkResponse> {
    return request<VoiceLinkResponse>(`/unified-assessment/${sessionId}/voice/link`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Complete the assessment
   */
  async complete(sessionId: string): Promise<CompleteResponse> {
    return request<CompleteResponse>(`/unified-assessment/${sessionId}/complete`, {
      method: 'POST',
    });
  },

  /**
   * Get final results
   */
  async getResults(sessionId: string): Promise<AssessmentResults> {
    return request<AssessmentResults>(`/unified-assessment/${sessionId}/results`, {
      method: 'GET',
    });
  },
};
