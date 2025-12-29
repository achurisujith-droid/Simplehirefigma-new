/**
 * ID Verification Service
 * Handles ID and Visa verification-related API calls
 */

import { apiClient } from './api-client';
import type { ApiResponse, IDVerificationData } from '../types';

export const idVerificationService = {
  /**
   * Upload ID document
   */
  async uploadIdDocument(
    file: File,
    documentType: 'passport' | 'drivers-license' | 'national-id'
  ): Promise<ApiResponse<{ documentUrl: string }>> {
    return apiClient.uploadFile('/id-verification/id', file, { documentType });
  },

  /**
   * Upload Visa/EAD document
   */
  async uploadVisaDocument(
    file: File,
    documentType: 'visa' | 'ead' | 'green-card'
  ): Promise<ApiResponse<{ documentUrl: string }>> {
    return apiClient.uploadFile('/id-verification/visa', file, { documentType });
  },

  /**
   * Upload selfie for verification
   */
  async uploadSelfie(file: File): Promise<ApiResponse<{ selfieUrl: string }>> {
    return apiClient.uploadFile('/id-verification/selfie', file);
  },

  /**
   * Submit ID verification for review
   */
  async submitVerification(data: {
    idDocumentUrl: string;
    visaDocumentUrl?: string;
    selfieUrl: string;
  }): Promise<ApiResponse<{ verificationId: string }>> {
    return apiClient.post('/id-verification/submit', data);
  },

  /**
   * Get verification status
   */
  async getVerificationStatus(): Promise<ApiResponse<IDVerificationData>> {
    return apiClient.get<IDVerificationData>('/id-verification/status');
  },

  /**
   * Get verification details
   */
  async getVerificationDetails(
    verificationId: string
  ): Promise<ApiResponse<IDVerificationData>> {
    return apiClient.get<IDVerificationData>(`/id-verification/${verificationId}`);
  },
};
