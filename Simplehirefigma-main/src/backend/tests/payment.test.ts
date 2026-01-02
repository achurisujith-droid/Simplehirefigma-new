/**
 * Payment API Tests
 * Tests for payment routes including placeholder mode
 */

import request from 'supertest';
import app from '../src/server';
import { prisma } from './setup';

describe('Payment API - Placeholder Mode', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    // Clean database
    await prisma.payment.deleteMany({});
    await prisma.userData.deleteMany({});
    await prisma.user.deleteMany({});

    // Create user
    const response = await request(app).post('/api/auth/signup').send({
      email: 'user@example.com',
      password: 'Password123!',
      name: 'Test User',
    });

    authToken = response.body.data.token;
    userId = response.body.data.user.id;

    // Ensure userData exists
    await prisma.userData.upsert({
      where: { userId },
      create: {
        userId,
        purchasedProducts: [],
      },
      update: {},
    });
  });

  describe('POST /api/payments/create-intent - Placeholder Mode', () => {
    it('should save single product in placeholder mode', async () => {
      const response = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: 'skill' })
        .expect(200);

      expect(response.body.message).toContain('Placeholder');
      expect(response.body.success).toBe(true);
      expect(response.body.data.purchasedProduct).toBe('skill');

      // Verify product was saved to database
      const userData = await prisma.userData.findUnique({
        where: { userId },
      });
      expect(userData?.purchasedProducts).toContain('skill');

      // Verify payment record was created
      const payment = await prisma.payment.findFirst({
        where: { userId },
      });
      expect(payment).not.toBeNull();
      expect(payment?.productId).toBe('skill');
      expect(payment?.status).toBe('test_mode');
      expect(payment?.amount).toBe(3000); // $30 in cents
    });

    it('should save all 3 products when combo is purchased', async () => {
      const response = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: 'combo' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.purchasedProduct).toBe('combo');

      // Verify all 3 products were saved
      const userData = await prisma.userData.findUnique({
        where: { userId },
      });
      expect(userData?.purchasedProducts).toContain('skill');
      expect(userData?.purchasedProducts).toContain('id-visa');
      expect(userData?.purchasedProducts).toContain('reference');
      expect(userData?.purchasedProducts.length).toBe(3);

      // Verify payment record
      const payment = await prisma.payment.findFirst({
        where: { userId },
      });
      expect(payment?.productId).toBe('combo');
      expect(payment?.amount).toBe(6000); // $60 in cents
    });

    it('should not duplicate products if already purchased', async () => {
      // First purchase
      await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: 'skill' })
        .expect(200);

      // Try to purchase again
      await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: 'skill' })
        .expect(200);

      // Verify product is not duplicated
      const userData = await prisma.userData.findUnique({
        where: { userId },
      });
      const skillCount = userData?.purchasedProducts.filter(p => p === 'skill').length;
      expect(skillCount).toBe(1);
    });

    it('should return 404 for invalid product', async () => {
      const response = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: 'invalid-product' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/payments/create-intent')
        .send({ productId: 'skill' })
        .expect(401);
    });
  });

  describe('GET /api/payments/history', () => {
    it('should return payment history', async () => {
      // Create some payments
      await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: 'skill' })
        .expect(200);

      await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: 'reference' })
        .expect(200);

      // Get payment history
      const response = await request(app)
        .get('/api/payments/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/payments/history')
        .expect(401);
    });
  });
});
