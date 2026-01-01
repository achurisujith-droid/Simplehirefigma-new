/**
 * Authentication Hook
 * Manages user authentication state via authStore
 * No localStorage - session restored from backend cookie
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { userService } from '../services/user.service';
import type { User } from '../types';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error, 
    login: storeLogin, 
    signup: storeSignup, 
    logout: storeLogout,
    clearError,
    bootstrap
  } = useAuthStore();

  // Bootstrap auth on mount
  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (email: string, password: string) => {
    return await storeLogin(email, password);
  }, [storeLogin]);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    return await storeSignup(email, password, name);
  }, [storeSignup]);

  const logout = useCallback(async () => {
    await storeLogout();
  }, [storeLogout]);

  const refreshUser = useCallback(async () => {
    const response = await userService.getUserData();
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  }, []);

  return {
    isAuthenticated,
    user,
    isLoading,
    error,
    login,
    signup,
    logout,
    refreshUser,
    clearError,
  };
}
