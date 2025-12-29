/**
 * Test Setup
 * Runs before all tests
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-for-testing-only';

// Clean up database before all tests
beforeAll(async () => {
  // Clean all tables (in order to respect foreign keys)
  try {
    await prisma.certificate.deleteMany();
    await prisma.proctoringEvent.deleteMany();
    await prisma.interview.deleteMany();
    await prisma.assessmentPlan.deleteMany();
    await prisma.interviewSession.deleteMany();
    await prisma.reference.deleteMany();
    await prisma.iDVerification.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.session.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.userData.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    // Ignore errors in test setup
    console.warn('Warning: Some tables may not exist yet:', error);
  }
});

// Clean up after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

// Clean up after each test
afterEach(async () => {
  // Optional: clean specific tables after each test if needed
});

export { prisma };
