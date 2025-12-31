/**
 * Authentication Tests
 */

import request from 'supertest';
import app from '../src/server';
import { prisma } from './setup';

describe('Authentication API', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'Password123!',
    name: 'Test User',
  };

  beforeEach(async () => {
    // Clean users before each test
    await prisma.refreshToken.deleteMany({});
    await prisma.userData.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user successfully', async () => {
      const response = await request(app).post('/api/auth/signup').send(testUser).expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        email: testUser.email,
        name: testUser.name,
      });
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should reject signup with existing email', async () => {
      // Create user first
      await request(app).post('/api/auth/signup').send(testUser);

      // Try to create again
      const response = await request(app).post('/api/auth/signup').send(testUser).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('email');
    });

    it('should reject signup with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          ...testUser,
          password: 'weak',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject signup with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          ...testUser,
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create user for login tests
      const signupResponse = await request(app).post('/api/auth/signup').send(testUser);
      // Verify signup succeeded
      if (signupResponse.status !== 201) {
        console.error('Signup failed:', signupResponse.body);
        throw new Error(`Signup failed with status ${signupResponse.status}`);
      }
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;

    beforeEach(async () => {
      // Create and login user
      const loginResponse = await request(app).post('/api/auth/signup').send(testUser);

      authToken = loginResponse.body.data.token;
    });

    it('should return user data with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUser.email);
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/auth/me').expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app).post('/api/auth/signup').send(testUser);

      authToken = loginResponse.body.data.token;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app).post('/api/auth/signup').send(testUser);

      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
