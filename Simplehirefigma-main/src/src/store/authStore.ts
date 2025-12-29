/**
 * Authentication Store (Zustand)
 * Single source of truth for authentication state
 * Cookie-based session management (no client-side tokens)
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User } from '../types';
import axiosInstance from '../lib/axios';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  // Bootstrap: restore session on app load
  bootstrap: () => Promise<void>;
  
  // Auth actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  
  // Utility
  clearError: () => void;
  setUser: (user: User | null) => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      /**
       * Bootstrap authentication on app load
       * Calls /api/auth/me to restore session from cookie
       */
      bootstrap: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await axiosInstance.get('/auth/me');
          
          if (response.data.success && response.data.data) {
            set({
              user: response.data.data,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        } catch (error: any) {
          // 401 is expected when not logged in
          if (error.response?.status === 401) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: error.response?.data?.message || 'Failed to restore session',
            });
          }
        }
      },

      /**
       * Login user with email and password
       * Backend sets HTTP-only cookie
       */
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await axiosInstance.post('/auth/login', {
            email,
            password,
          });

          if (response.data.success && response.data.data) {
            set({
              user: response.data.data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return { success: true };
          } else {
            set({
              isLoading: false,
              error: response.data.message || 'Login failed',
            });
            return { 
              success: false, 
              error: response.data.message || 'Login failed' 
            };
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 
                             error.message || 
                             'Login failed';
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          return { success: false, error: errorMessage };
        }
      },

      /**
       * Signup new user
       * Backend sets HTTP-only cookie
       */
      signup: async (email: string, password: string, name: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await axiosInstance.post('/auth/signup', {
            email,
            password,
            name,
          });

          if (response.data.success && response.data.data) {
            set({
              user: response.data.data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return { success: true };
          } else {
            set({
              isLoading: false,
              error: response.data.message || 'Signup failed',
            });
            return { 
              success: false, 
              error: response.data.message || 'Signup failed' 
            };
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 
                             error.message || 
                             'Signup failed';
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          return { success: false, error: errorMessage };
        }
      },

      /**
       * Logout user
       * Backend clears HTTP-only cookie
       */
      logout: async () => {
        try {
          await axiosInstance.post('/auth/logout');
        } catch (error) {
          // Logout locally even if API call fails
          console.error('Logout API call failed:', error);
        } finally {
          // Clear state regardless of API call result
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Set user (for manual updates)
       */
      setUser: (user: User | null) => {
        set({ 
          user, 
          isAuthenticated: !!user 
        });
      },
    }),
    { name: 'AuthStore' }
  )
);

// Listen for unauthorized events from axios interceptor
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.getState().setUser(null);
  });
}
