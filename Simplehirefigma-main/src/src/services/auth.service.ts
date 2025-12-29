/**
 * Authentication Service
 * Handles all authentication-related API calls
 * Uses cookie-based session management
 */

import axiosInstance from '../lib/axios';
import type { ApiResponse, LoginResponse, SignupResponse, User } from '../types';

export const authService = {
  /**
   * Login user with email and password
   * Backend sets HTTP-only session cookie
   */
  async login(email: string, password: string): Promise<ApiResponse<{ user: User }>> {
    try {
      const response = await axiosInstance.post('/auth/login', {
        email,
        password,
      });

      return {
        success: true,
        data: { user: response.data.data.user },
        message: response.data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    }
  },

  /**
   * Register new user
   * Backend sets HTTP-only session cookie
   */
  async signup(
    email: string,
    password: string,
    name: string
  ): Promise<ApiResponse<{ user: User }>> {
    try {
      const response = await axiosInstance.post('/auth/signup', {
        email,
        password,
        name,
      });

      return {
        success: true,
        data: { user: response.data.data.user },
        message: response.data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Signup failed',
      };
    }
  },

  /**
   * Logout user
   * Backend clears HTTP-only session cookie
   */
  async logout(): Promise<ApiResponse<void>> {
    try {
      const response = await axiosInstance.post('/auth/logout');
      
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Logout failed',
      };
    }
  },

  /**
   * Get current user profile (session restore)
   * Validates session cookie
   */
  async me(): Promise<ApiResponse<User>> {
    try {
      const response = await axiosInstance.get('/auth/me');
      
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Session invalid',
      };
    }
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
    try {
      const response = await axiosInstance.post('/auth/reset-password', { email });
      
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Password reset request failed',
      };
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<void>> {
    try {
      const response = await axiosInstance.post('/auth/reset-password/confirm', {
        token,
        newPassword,
      });
      
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Password reset failed',
      };
    }
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    try {
      const response = await axiosInstance.post('/auth/verify-email', { token });
      
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Email verification failed',
      };
    }
  },
};