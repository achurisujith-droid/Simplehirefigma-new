/**
 * Health Check Tests
 */

import request from 'supertest';
import app from '../src/server';
import { prisma } from './setup';

describe('Health Check API', () => {
  describe('GET /health', () => {
    it('should return 200 and health status when all services are healthy', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.environment).toBeDefined();
      expect(response.body.version).toBeDefined();
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
      expect(response.body.services).toBeDefined();
      expect(response.body.services.database).toBe(true);
    });

    it('should return service status information', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body.services).toHaveProperty('database');
      expect(response.body.services).toHaveProperty('multiLLM');
      expect(response.body.services).toHaveProperty('storage');
      expect(response.body.services).toHaveProperty('payments');
      expect(response.body.services).toHaveProperty('email');
    });

    it('should return 503 when database is not healthy', async () => {
      // Temporarily disconnect from database to simulate failure
      await prisma.$disconnect();

      const response = await request(app).get('/health').expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('database');

      // Reconnect for other tests
      await prisma.$connect();
    });

    it('should include timestamp in ISO format', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body.timestamp).toBeDefined();
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });

    it('should report environment correctly', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body.environment).toBe(process.env.NODE_ENV || 'test');
    });
  });
});
