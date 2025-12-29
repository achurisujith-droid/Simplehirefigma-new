/**
 * API Service Layer
 * Centralized HTTP client for all API communications
 * Handles authentication, error handling, and request/response transformations
 */

import { config } from '../config/environment';
import type { ApiResponse, ApiError } from '../types';

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private authToken: string | null = null;

  constructor() {
    this.baseURL = config.apiBaseUrl;
    this.timeout = config.apiTimeout;
    this.loadAuthToken();
  }

  // Load auth token from localStorage
  private loadAuthToken(): void {
    const token = localStorage.getItem('authToken');
    if (token) {
      this.authToken = token;
    }
  }

  // Set auth token
  public setAuthToken(token: string): void {
    this.authToken = token;
    localStorage.setItem('authToken', token);
  }

  // Clear auth token
  public clearAuthToken(): void {
    this.authToken = null;
    localStorage.removeItem('authToken');
  }

  // Get default headers
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw {
          code: data.code || `HTTP_${response.status}`,
          message: data.message || response.statusText,
          details: data.details,
        } as ApiError;
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw {
          code: 'TIMEOUT',
          message: 'Request timeout',
        } as ApiError;
      }

      if (config.enableLogging) {
        console.error('API Error:', error);
      }

      return {
        success: false,
        error: error.message || 'An unknown error occurred',
      };
    }
  }

  // HTTP Methods
  public async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  public async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // File upload method
  public async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.keys(additionalData).forEach((key) => {
        formData.append(key, additionalData[key]);
      });
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          code: data.code || `HTTP_${response.status}`,
          message: data.message || response.statusText,
          details: data.details,
        } as ApiError;
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error: any) {
      if (config.enableLogging) {
        console.error('File Upload Error:', error);
      }

      return {
        success: false,
        error: error.message || 'File upload failed',
      };
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient();
