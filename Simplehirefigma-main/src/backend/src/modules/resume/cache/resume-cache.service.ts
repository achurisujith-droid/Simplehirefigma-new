/**
 * Resume Cache Service
 * Implements SHA-256 hash-based caching for resume analysis results
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import logger from '../../../config/logger';

export interface CacheEntry<T> {
  hash: string;
  data: T;
  timestamp: number;
}

export class ResumeCacheService {
  private cacheDir: string;

  constructor() {
    // Use uploads/resume-cache directory
    this.cacheDir = path.join(process.cwd(), 'uploads', 'resume-cache');
    this.ensureCacheDir();
  }

  /**
   * Ensure cache directory exists
   */
  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create cache directory:', error);
    }
  }

  /**
   * Generate SHA-256 hash of content
   */
  private generateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Get cache file path for a hash
   */
  private getCacheFilePath(hash: string): string {
    return path.join(this.cacheDir, `${hash}.json`);
  }

  /**
   * Get cached data by content
   * @param content The resume text content
   * @returns Cached data if exists and valid, null otherwise
   */
  async getCached<T>(content: string): Promise<T | null> {
    try {
      const hash = this.generateHash(content);
      const filePath = this.getCacheFilePath(hash);

      // Check if cache file exists
      try {
        await fs.access(filePath);
      } catch {
        return null; // Cache miss
      }

      // Read cache file
      const cacheContent = await fs.readFile(filePath, 'utf-8');
      const cacheEntry: CacheEntry<T> = JSON.parse(cacheContent);

      // Validate cache entry
      if (cacheEntry.hash !== hash) {
        logger.warn('Cache hash mismatch, ignoring cached data');
        return null;
      }

      logger.info(`Cache hit for hash: ${hash.substring(0, 8)}...`);
      return cacheEntry.data;
    } catch (error) {
      logger.error('Error reading from cache:', error);
      return null;
    }
  }

  /**
   * Set cached data
   * @param content The resume text content
   * @param data The data to cache
   */
  async setCached<T>(content: string, data: T): Promise<void> {
    try {
      await this.ensureCacheDir();

      const hash = this.generateHash(content);
      const filePath = this.getCacheFilePath(hash);

      const cacheEntry: CacheEntry<T> = {
        hash,
        data,
        timestamp: Date.now(),
      };

      await fs.writeFile(filePath, JSON.stringify(cacheEntry, null, 2), 'utf-8');
      logger.info(`Cached data for hash: ${hash.substring(0, 8)}...`);
    } catch (error) {
      logger.error('Error writing to cache:', error);
      // Don't throw - caching is optional
    }
  }

  /**
   * Clear old cache entries (older than 30 days)
   */
  async clearOldCache(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      const now = Date.now();
      let clearedCount = 0;

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(this.cacheDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const cacheEntry: CacheEntry<any> = JSON.parse(content);

        if (now - cacheEntry.timestamp > maxAgeMs) {
          await fs.unlink(filePath);
          clearedCount++;
        }
      }

      logger.info(`Cleared ${clearedCount} old cache entries`);
    } catch (error) {
      logger.error('Error clearing old cache:', error);
    }
  }
}

// Export singleton instance
export const resumeCacheService = new ResumeCacheService();
