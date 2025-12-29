/**
 * Authentication Hook
 * Manages user authentication state and token refresh
 */

import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';
import type { User } from '../types';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
  });

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setAuthState({ isAuthenticated: false, user: null, isLoading: false, error: null });
        return;
      }

      try {
        // Verify token and fetch user data
        const response = await userService.getUserData();
        if (response.success && response.data) {
          setAuthState({
            isAuthenticated: true,
            user: response.data,
            isLoading: false,
            error: null,
          });
        } else {
          // Token invalid, clear it
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          setAuthState({ isAuthenticated: false, user: null, isLoading: false, error: null });
        }
      } catch (error) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: 'Session expired',
        });
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    const response = await authService.login(email, password);

    if (response.success && response.data) {
      setAuthState({
        isAuthenticated: true,
        user: response.data.user,
        isLoading: false,
        error: null,
      });
      return { success: true };
    } else {
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: response.error || 'Login failed',
      });
      return { success: false, error: response.error };
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    const response = await authService.signup(email, password, name);

    if (response.success && response.data) {
      setAuthState({
        isAuthenticated: true,
        user: response.data.user,
        isLoading: false,
        error: null,
      });
      return { success: true };
    } else {
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: response.error || 'Signup failed',
      });
      return { success: false, error: response.error };
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    });
  }, []);

  const refreshUser = useCallback(async () => {
    const response = await userService.getUserData();
    if (response.success && response.data) {
      setAuthState(prev => ({
        ...prev,
        user: response.data,
      }));
      return response.data;
    }
    return null;
  }, []);

  return {
    ...authState,
    login,
    signup,
    logout,
    refreshUser,
  };
}
