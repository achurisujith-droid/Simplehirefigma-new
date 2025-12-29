/**
 * Products API Tests
 */

import request from 'supertest';
import app from '../src/server';
import { prisma } from './setup';

describe('Products API', () => {
  let authToken: string;

  beforeEach(async () => {
    // Clean database
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});

    // Create user
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'user@example.com',
        password: 'Password123!',
        name: 'Test User',
      });

    authToken = response.body.data.token;

    // Seed products
    await prisma.product.createMany({
      data: [
        {
          id: 'skill',
          name: 'Skill Interview',
          price: 4999,
          description: 'Complete skill verification',
          features: ['Voice interview', 'MCQ test', 'Coding challenge'],
          active: true,
        },
        {
          id: 'id-visa',
          name: 'ID + Visa Verification',
          price: 2999,
          description: 'Identity verification',
          features: ['ID check', 'Visa verification'],
          active: true,
        },
        {
          id: 'reference',
          name: 'Reference Check',
          price: 1999,
          description: 'Professional reference verification',
          features: ['Up to 5 references', 'Email verification'],
          active: true,
        },
        {
          id: 'combo',
          name: 'Complete Verification Bundle',
          price: 7999,
          description: 'All verifications bundled',
          features: ['All features'],
          active: true,
        },
      ],
    });
  });

  describe('GET /api/products', () => {
    it('should return all active products', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(4);
    });

    it('should not return inactive products', async () => {
      // Deactivate a product
      await prisma.product.update({
        where: { id: 'skill' },
        data: { active: false },
      });

      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(3);
      expect(response.body.data.find((p: any) => p.id === 'skill')).toBeUndefined();
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/products')
        .expect(401);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return specific product', async () => {
      const response = await request(app)
        .get('/api/products/skill')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('skill');
      expect(response.body.data.name).toBe('Skill Interview');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for inactive product', async () => {
      await prisma.product.update({
        where: { id: 'skill' },
        data: { active: false },
      });

      const response = await request(app)
        .get('/api/products/skill')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
