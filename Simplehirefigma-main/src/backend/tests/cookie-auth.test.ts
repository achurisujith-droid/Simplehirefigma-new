/**
 * Cookie Authentication Tests
 * Tests the HTTP-only cookie authentication flow
 */

import request from 'supertest';
import app from '../src/server';
import { prisma } from './setup';

/**
 * Helper function to extract session cookie from response headers
 */
function extractSessionCookie(cookies: string | string[] | undefined): string {
  if (!cookies) return '';
  
  const sessionCookie = Array.isArray(cookies) 
    ? cookies.find((c: string) => c.startsWith('session='))
    : cookies.startsWith('session=') ? cookies : '';
  
  return sessionCookie || '';
}

describe('Cookie Authentication', () => {
  const testUser = {
    email: 'cookietest@example.com',
    password: 'Password123!',
    name: 'Cookie Test User',
  };

  beforeEach(async () => {
    // Clean database
    await prisma.refreshToken.deleteMany({});
    await prisma.userData.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('Login with cookie support', () => {
    it('should set session cookie on successful login', async () => {
      // First signup
      await request(app).post('/api/auth/signup').send(testUser);

      // Then login and check for cookie
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      // Verify response includes token
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();

      // Verify Set-Cookie header is present
      const sessionCookie = extractSessionCookie(response.headers['set-cookie']);
      
      expect(sessionCookie).toBeTruthy();
      expect(sessionCookie).toContain('HttpOnly');
      expect(sessionCookie).toContain('Path=/');
    });

    it('should set session cookie on successful signup', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send(testUser)
        .expect(201);

      // Verify response includes token
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();

      // Verify Set-Cookie header is present
      const sessionCookie = extractSessionCookie(response.headers['set-cookie']);
      
      expect(sessionCookie).toBeTruthy();
      expect(sessionCookie).toContain('HttpOnly');
    });
  });

  describe('Protected routes with cookie authentication', () => {
    let sessionCookie: string;

    beforeEach(async () => {
      // Create user and get session cookie
      const loginResponse = await request(app)
        .post('/api/auth/signup')
        .send(testUser);

      sessionCookie = extractSessionCookie(loginResponse.headers['set-cookie']);
    });

    it('should access protected route using cookie', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUser.email);
    });

    it('should still work with Authorization header', async () => {
      // Get token from login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      const token = loginResponse.body.data.token;

      // Use Authorization header
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUser.email);
    });

    it('should prefer Authorization header over cookie', async () => {
      // Create another user
      const anotherUser = {
        email: 'another@example.com',
        password: 'Password123!',
        name: 'Another User',
      };
      
      const anotherResponse = await request(app)
        .post('/api/auth/signup')
        .send(anotherUser);

      const anotherToken = anotherResponse.body.data.token;

      // Use Authorization header (another user) with cookie (test user)
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${anotherToken}`)
        .set('Cookie', sessionCookie)
        .expect(200);

      // Should authenticate as the user from Authorization header
      expect(response.body.data.email).toBe(anotherUser.email);
    });
  });

  describe('Logout with cookie clearing', () => {
    let sessionCookie: string;
    let authToken: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send(testUser);

      authToken = response.body.data.token;
      sessionCookie = extractSessionCookie(response.headers['set-cookie']);
    });

    it('should clear session cookie on logout', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Check that the cookie is being cleared
      const clearedCookie = extractSessionCookie(response.headers['set-cookie']);

      expect(clearedCookie).toBeTruthy();
      // Cookie should be expired (Max-Age=0 or empty value)
      expect(clearedCookie).toMatch(/Max-Age=0|session=;/);
    });
  });
});
