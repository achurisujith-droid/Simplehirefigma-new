/**
 * Certificate Service
 * Handles certificate-related API calls
 */

import { apiClient } from './api-client';
import type { ApiResponse, Certificate } from '../types';

export const certificateService = {
  /**
   * Get all certificates for current user
   */
  async getCertificates(): Promise<ApiResponse<Certificate[]>> {
    return apiClient.get<Certificate[]>('/certificates');
  },

  /**
   * Get certificate by ID
   */
  async getCertificate(certificateId: string): Promise<ApiResponse<Certificate>> {
    return apiClient.get<Certificate>(`/certificates/${certificateId}`);
  },

  /**
   * Get public certificate (no auth required)
   */
  async getPublicCertificate(certificateNumber: string): Promise<ApiResponse<Certificate>> {
    return apiClient.get<Certificate>(`/certificates/public/${certificateNumber}`);
  },

  /**
   * Download certificate PDF
   */
  async downloadCertificate(certificateId: string): Promise<ApiResponse<Blob>> {
    return apiClient.get(`/certificates/${certificateId}/download`);
  },

  /**
   * Get certificate verification status
   */
  async verifyCertificate(
    certificateNumber: string
  ): Promise<ApiResponse<{ valid: boolean; certificate?: Certificate }>> {
    return apiClient.get(`/certificates/verify/${certificateNumber}`);
  },

  /**
   * Generate shareable certificate link
   */
  async generateShareableLink(
    certificateId: string
  ): Promise<ApiResponse<{ shareableUrl: string }>> {
    return apiClient.post(`/certificates/${certificateId}/share`);
  },
};
