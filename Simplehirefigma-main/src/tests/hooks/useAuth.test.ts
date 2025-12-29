import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../../src/hooks/useAuth';
import * as authService from '../../src/services/auth.service';
import * as userService from '../../src/services/user.service';

// Mock the services
vi.mock('../../src/services/auth.service');
vi.mock('../../src/services/user.service');

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should start with loading state', () => {
      vi.spyOn(userService, 'getUserData').mockResolvedValue({
        success: false,
        error: 'No token',
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });

    it('should check for existing token on mount', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      };

      localStorage.setItem('authToken', 'test-token');
      
      vi.spyOn(userService, 'getUserData').mockResolvedValue({
        success: true,
        data: mockUser,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
          },
          token: 'new-token',
          refreshToken: 'refresh-token',
        },
      };

      vi.spyOn(authService, 'login').mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const loginResult = await result.current.login('test@example.com', 'password');

      expect(loginResult.success).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockResponse.data.user);
    });

    it('should handle login failure', async () => {
      vi.spyOn(authService, 'login').mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const loginResult = await result.current.login('test@example.com', 'wrong-password');

      expect(loginResult.success).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe('Invalid credentials');
    });
  });

  describe('signup', () => {
    it('should signup successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: '1',
            email: 'new@example.com',
            name: 'New User',
          },
          token: 'token',
          refreshToken: 'refresh',
        },
      };

      vi.spyOn(authService, 'signup').mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const signupResult = await result.current.signup('new@example.com', 'Password123!', 'New User');

      expect(signupResult.success).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      localStorage.setItem('authToken', 'token');
      
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      };

      vi.spyOn(userService, 'getUserData').mockResolvedValue({
        success: true,
        data: mockUser,
      });

      vi.spyOn(authService, 'logout').mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await result.current.logout();

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });
  });

  describe('refreshUser', () => {
    it('should refresh user data', async () => {
      const initialUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      };

      const updatedUser = {
        ...initialUser,
        name: 'Updated Name',
      };

      localStorage.setItem('authToken', 'token');

      vi.spyOn(userService, 'getUserData')
        .mockResolvedValueOnce({ success: true, data: initialUser })
        .mockResolvedValueOnce({ success: true, data: updatedUser });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user?.name).toBe('Test User');
      });

      await result.current.refreshUser();

      await waitFor(() => {
        expect(result.current.user?.name).toBe('Updated Name');
      });
    });
  });
});
