/**
 * Axios Instance Configuration
 * Centralized HTTP client with cookie-based authentication
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from '../config/environment';

// Create axios instance with default config
export const axiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.apiTimeout,
  withCredentials: true, // Enable cookies for cross-origin requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for global error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If we're already on login page or this is a login/signup request, don't redirect
      const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                             originalRequest.url?.includes('/auth/signup') ||
                             originalRequest.url?.includes('/auth/me');

      if (!isAuthEndpoint && typeof window !== 'undefined') {
        // Clear auth state (handled by store)
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// Request interceptor (if needed for future enhancements)
axiosInstance.interceptors.request.use(
  (config) => {
    // Could add request ID, timing, etc. here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
