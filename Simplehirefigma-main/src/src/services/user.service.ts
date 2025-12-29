/**
 * User Service
 * Handles user-related API calls
 */

import { apiClient } from './api-client';
import type { ApiResponse, UserData } from '../types';

export const userService = {
  /**
   * Get user's complete data including verification progress
   */
  async getUserData(): Promise<ApiResponse<UserData>> {
    return apiClient.get<UserData>('/users/me/data');
  },

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<UserData>): Promise<ApiResponse<UserData>> {
    return apiClient.patch<UserData>('/users/me', data);
  },

  /**
   * Get purchased products
   */
  async getPurchasedProducts(): Promise<ApiResponse<string[]>> {
    return apiClient.get<string[]>('/users/me/products');
  },

  /**
   * Update interview progress
   */
  async updateInterviewProgress(progress: any): Promise<ApiResponse<void>> {
    return apiClient.patch<void>('/users/me/interview-progress', progress);
  },

  /**
   * Update ID verification status
   */
  async updateIdVerificationStatus(status: string): Promise<ApiResponse<void>> {
    return apiClient.patch<void>('/users/me/id-verification-status', { status });
  },

  /**
   * Update reference check status
   */
  async updateReferenceCheckStatus(status: string): Promise<ApiResponse<void>> {
    return apiClient.patch<void>('/users/me/reference-check-status', { status });
  },

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<ApiResponse<void>> {
    return apiClient.delete<void>('/users/me');
  },
};
