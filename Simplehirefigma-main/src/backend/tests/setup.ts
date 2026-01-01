/**
 * Test Setup
 * Runs before all tests
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-minimum-32-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing-only-minimum-32-chars';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/simplehire_test';

// Clean up database before all tests
beforeAll(async () => {
  // Clean all tables (in order to respect foreign keys)
  // Delete child tables first, then parent tables
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
    // IMPORTANT: Delete refresh tokens before users to respect foreign key constraint
    await prisma.refreshToken.deleteMany();
    await prisma.userData.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    // Ignore errors in test setup
    console.warn('Warning: Some tables may not exist yet:', error);
  }
});

// Clean up after each test
afterEach(async () => {
  // Clean up any test data to prevent interference between tests
  try {
    // Delete child tables first to respect foreign key constraints
    await prisma.refreshToken.deleteMany();
    await prisma.userData.deleteMany();
  } catch (error) {
    // Log cleanup errors for debugging, but don't fail the test
    if (error instanceof Error) {
      console.warn('Warning: afterEach cleanup error:', error.message);
    }
  }
});

// Clean up after all tests
afterAll(async () => {
  try {
    // Ensure any pending operations complete before disconnecting
    // Increased delay to 500ms to allow all async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 500));
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error disconnecting Prisma:', error instanceof Error ? error.message : error);
    // Force disconnect if normal disconnect fails
    try {
      await prisma.$disconnect();
    } catch (secondError) {
      // Log secondary error but don't throw
      console.error('Secondary disconnect error:', secondError instanceof Error ? secondError.message : secondError);
    }
  }
});

export { prisma };
