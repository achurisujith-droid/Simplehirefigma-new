/**
 * Reference Management Tests
 */

import request from 'supertest';
import app from '../src/server';
import { prisma } from './setup';

describe('Reference API', () => {
  let authToken: string;
  let userId: string;

  const testUser = {
    email: 'ref@example.com',
    password: 'Password123!',
    name: 'Test User',
  };

  beforeEach(async () => {
    // Clean database
    await prisma.reference.deleteMany({});
    await prisma.user.deleteMany({});

    // Create and login user
    const response = await request(app)
      .post('/api/auth/signup')
      .send(testUser);

    authToken = response.body.data.token;
    userId = response.body.data.user.id;
  });

  describe('POST /api/references', () => {
    it('should create a new reference', async () => {
      const reference = {
        name: 'John Doe',
        email: 'john@company.com',
        phone: '+1234567890',
        company: 'Tech Corp',
        position: 'Senior Manager',
        relationship: 'Former Manager',
      };

      const response = await request(app)
        .post('/api/references')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reference)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(reference);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.status).toBe('draft');
    });

    it('should require all mandatory fields', async () => {
      const response = await request(app)
        .post('/api/references')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'John Doe' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/references')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'John Doe',
          email: 'invalid-email',
          phone: '+1234567890',
          company: 'Tech Corp',
          position: 'Manager',
          relationship: 'Former Manager',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should enforce maximum of 5 references', async () => {
      // Create 5 references
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/references')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: `Reference ${i}`,
            email: `ref${i}@company.com`,
            phone: '+1234567890',
            company: 'Company',
            position: 'Position',
            relationship: 'Manager',
          });
      }

      // Try to create 6th reference
      const response = await request(app)
        .post('/api/references')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Reference 6',
          email: 'ref6@company.com',
          phone: '+1234567890',
          company: 'Company',
          position: 'Position',
          relationship: 'Manager',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('5');
    });
  });

  describe('GET /api/references', () => {
    beforeEach(async () => {
      // Create some references
      await request(app)
        .post('/api/references')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Reference 1',
          email: 'ref1@company.com',
          phone: '+1234567890',
          company: 'Company',
          position: 'Position',
          relationship: 'Manager',
        });
    });

    it('should return all user references', async () => {
      const response = await request(app)
        .get('/api/references')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/references')
        .expect(401);
    });
  });

  describe('PATCH /api/references/:id', () => {
    let referenceId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/references')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Original Name',
          email: 'original@company.com',
          phone: '+1234567890',
          company: 'Company',
          position: 'Position',
          relationship: 'Manager',
        });

      referenceId = response.body.data.id;
    });

    it('should update reference', async () => {
      const updates = {
        name: 'Updated Name',
        company: 'New Company',
      };

      const response = await request(app)
        .patch(`/api/references/${referenceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updates.name);
      expect(response.body.data.company).toBe(updates.company);
    });

    it('should not allow updating other users references', async () => {
      // Create another user
      const otherUser = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'other@example.com',
          password: 'Password123!',
          name: 'Other User',
        });

      const response = await request(app)
        .patch(`/api/references/${referenceId}`)
        .set('Authorization', `Bearer ${otherUser.body.data.token}`)
        .send({ name: 'Hacked' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/references/:id', () => {
    let referenceId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/references')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'To Delete',
          email: 'delete@company.com',
          phone: '+1234567890',
          company: 'Company',
          position: 'Position',
          relationship: 'Manager',
        });

      referenceId = response.body.data.id;
    });

    it('should delete reference', async () => {
      const response = await request(app)
        .delete(`/api/references/${referenceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deleted
      const getResponse = await request(app)
        .get('/api/references')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.body.data.length).toBe(0);
    });

    it('should not delete submitted references', async () => {
      // Submit the reference
      await prisma.reference.update({
        where: { id: referenceId },
        data: { status: 'sent' },
      });

      const response = await request(app)
        .delete(`/api/references/${referenceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/references/submit', () => {
    let referenceIds: string[];

    beforeEach(async () => {
      // Create 2 references
      const ref1 = await request(app)
        .post('/api/references')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Reference 1',
          email: 'ref1@company.com',
          phone: '+1234567890',
          company: 'Company',
          position: 'Position',
          relationship: 'Manager',
        });

      const ref2 = await request(app)
        .post('/api/references')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Reference 2',
          email: 'ref2@company.com',
          phone: '+1234567890',
          company: 'Company',
          position: 'Position',
          relationship: 'Colleague',
        });

      referenceIds = [ref1.body.data.id, ref2.body.data.id];
    });

    it('should submit references', async () => {
      const response = await request(app)
        .post('/api/references/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ referenceIds })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.submitted).toBe(2);
    });

    it('should require at least 1 reference', async () => {
      const response = await request(app)
        .post('/api/references/submit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ referenceIds: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/references/summary', () => {
    beforeEach(async () => {
      // Create references with different statuses
      const ref1 = await request(app)
        .post('/api/references')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Reference 1',
          email: 'ref1@company.com',
          phone: '+1234567890',
          company: 'Company',
          position: 'Position',
          relationship: 'Manager',
        });

      await prisma.reference.update({
        where: { id: ref1.body.data.id },
        data: { status: 'sent' },
      });
    });

    it('should return reference summary', async () => {
      const response = await request(app)
        .get('/api/references/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        total: 1,
        draft: 0,
        sent: 1,
        completed: 0,
        verified: 0,
      });
    });
  });
});
