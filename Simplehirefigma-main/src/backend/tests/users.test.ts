/**
 * User Management Tests
 */

import request from 'supertest';
import app from '../src/server';
import { prisma } from './setup';

describe('User API', () => {
  let authToken: string;
  let userId: string;

  const testUser = {
    email: 'user@example.com',
    password: 'Password123!',
    name: 'Test User',
  };

  beforeEach(async () => {
    // Clean database
    await prisma.user.deleteMany({});

    // Create and login user
    const response = await request(app)
      .post('/api/auth/signup')
      .send(testUser);

    authToken = response.body.data.token;
    userId = response.body.data.user.id;
  });

  describe('GET /api/users/me/data', () => {
    it('should return user data', async () => {
      const response = await request(app)
        .get('/api/users/me/data')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        userId,
        purchasedProducts: [],
        interviewProgress: {
          documentsUploaded: false,
          voiceInterview: false,
          mcqTest: false,
          codingChallenge: false,
        },
      });
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/users/me/data')
        .expect(401);
    });
  });

  describe('PATCH /api/users/me', () => {
    it('should update user profile', async () => {
      const updates = {
        name: 'Updated Name',
      };

      const response = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updates.name);
    });

    it('should not allow email updates', async () => {
      const response = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'newemail@example.com' })
        .expect(200);

      // Email should not change
      expect(response.body.data.email).toBe(testUser.email);
    });
  });

  describe('GET /api/users/me/products', () => {
    it('should return purchased products', async () => {
      const response = await request(app)
        .get('/api/users/me/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('PATCH /api/users/me/interview-progress', () => {
    it('should update interview progress', async () => {
      const progress = {
        documentsUploaded: true,
        voiceInterview: false,
        mcqTest: false,
        codingChallenge: false,
      };

      const response = await request(app)
        .patch('/api/users/me/interview-progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send(progress)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.interviewProgress).toMatchObject(progress);
    });

    it('should reject invalid progress data', async () => {
      const response = await request(app)
        .patch('/api/users/me/interview-progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ invalidField: true })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/users/me/id-verification-status', () => {
    it('should update ID verification status', async () => {
      const response = await request(app)
        .patch('/api/users/me/id-verification-status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'in-progress' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.idVerificationStatus).toBe('in-progress');
    });

    it('should reject invalid status', async () => {
      const response = await request(app)
        .patch('/api/users/me/id-verification-status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'invalid-status' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/users/me/reference-check-status', () => {
    it('should update reference check status', async () => {
      const response = await request(app)
        .patch('/api/users/me/reference-check-status')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'in-progress' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.referenceCheckStatus).toBe('in-progress');
    });
  });
});
