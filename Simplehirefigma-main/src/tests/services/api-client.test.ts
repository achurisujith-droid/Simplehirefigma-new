import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient } from '../../src/services/api-client';

global.fetch = vi.fn();

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Authentication', () => {
    it('should include auth token in headers', async () => {
      const mockToken = 'test-token';
      localStorage.setItem('authToken', mockToken);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });

      await apiClient.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it('should work without auth token', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });

      await apiClient.get('/test');

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('GET requests', () => {
    it('should make GET request successfully', async () => {
      const mockData = { id: 1, name: 'Test' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockData }),
      });

      const result = await apiClient.get('/test');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
    });

    it('should handle GET error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Not found' }),
      });

      const result = await apiClient.get('/test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('POST requests', () => {
    it('should make POST request with data', async () => {
      const postData = { name: 'New Item' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: 1, ...postData } }),
      });

      const result = await apiClient.post('/test', postData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );

      expect(result.success).toBe(true);
    });
  });

  describe('File Upload', () => {
    it('should upload file successfully', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { url: 'https://example.com/file.txt' } }),
      });

      const result = await apiClient.uploadFile('/upload', file);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('url');

      // Verify FormData was used
      const callArgs = (global.fetch as any).mock.calls[0];
      expect(callArgs[1].body).toBeInstanceOf(FormData);
    });

    it('should upload file with additional data', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const additionalData = { category: 'documents' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} }),
      });

      await apiClient.uploadFile('/upload', file, additionalData);

      const callArgs = (global.fetch as any).mock.calls[0];
      const formData = callArgs[1].body as FormData;
      
      expect(formData.get('file')).toBe(file);
      expect(formData.get('category')).toBe('documents');
    });
  });

  describe('DELETE requests', () => {
    it('should make DELETE request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await apiClient.delete('/test/1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'DELETE',
        })
      );

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await apiClient.get('/test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle timeout', async () => {
      (global.fetch as any).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(resolve, 100000))
      );

      const result = await apiClient.get('/test');

      expect(result.success).toBe(false);
    });
  });

  describe('Token Management', () => {
    it('should set auth token', () => {
      const token = 'new-token';
      apiClient.setAuthToken(token);

      expect(localStorage.getItem('authToken')).toBe(token);
    });

    it('should clear auth token', () => {
      localStorage.setItem('authToken', 'token');
      apiClient.clearAuthToken();

      expect(localStorage.getItem('authToken')).toBe(null);
    });
  });
});
