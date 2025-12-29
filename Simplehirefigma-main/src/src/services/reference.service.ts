/**
 * Reference Check Service
 * Handles reference check-related API calls
 */

import { apiClient } from './api-client';
import type { ApiResponse, ReferenceItem } from '../types';

export const referenceService = {
  /**
   * Get all references for current user
   */
  async getReferences(): Promise<ApiResponse<ReferenceItem[]>> {
    return apiClient.get<ReferenceItem[]>('/references');
  },

  /**
   * Add a new reference
   */
  async addReference(reference: Omit<ReferenceItem, 'id' | 'status'>): Promise<ApiResponse<ReferenceItem>> {
    return apiClient.post<ReferenceItem>('/references', reference);
  },

  /**
   * Update a reference
   */
  async updateReference(
    referenceId: string,
    data: Partial<ReferenceItem>
  ): Promise<ApiResponse<ReferenceItem>> {
    return apiClient.patch<ReferenceItem>(`/references/${referenceId}`, data);
  },

  /**
   * Delete a reference
   */
  async deleteReference(referenceId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/references/${referenceId}`);
  },

  /**
   * Submit references for verification (sends emails)
   */
  async submitReferences(referenceIds: string[]): Promise<ApiResponse<{ emailsSent: number }>> {
    return apiClient.post('/references/submit', { referenceIds });
  },

  /**
   * Resend reference request email
   */
  async resendReferenceEmail(referenceId: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/references/${referenceId}/resend`);
  },

  /**
   * Get reference response details
   */
  async getReferenceResponse(referenceId: string): Promise<ApiResponse<any>> {
    return apiClient.get(`/references/${referenceId}/response`);
  },

  /**
   * Get reference check summary
   */
  async getReferenceSummary(): Promise<ApiResponse<{
    totalReferences: number;
    responsesReceived: number;
    verified: number;
    pending: number;
  }>> {
    return apiClient.get('/references/summary');
  },
};
