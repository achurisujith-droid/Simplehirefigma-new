import { PrismaClient } from '@prisma/client';
import logger from './logger';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

/**
 * Test database connection with retry logic
 * @param maxRetries Maximum number of connection attempts
 * @param retryDelay Delay between retries in milliseconds
 * @returns True if connection successful, false otherwise
 */
export async function testDatabaseConnection(
  maxRetries: number = 5,
  retryDelay: number = 2000
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Testing database connection (attempt ${attempt}/${maxRetries})...`);
      // Prisma connects automatically on first query, no need for explicit $connect()
      await prisma.$queryRaw`SELECT 1`;
      logger.info('✓ Database connection successful');
      return true;
    } catch (error) {
      logger.warn(`Database connection attempt ${attempt} failed:`, error instanceof Error ? error.message : error);
      
      if (attempt < maxRetries) {
        logger.info(`Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        logger.error('✗ Database connection failed after all retries');
        logger.error('Please verify:');
        logger.error('  1. DATABASE_URL environment variable is set correctly');
        logger.error('  2. PostgreSQL database is running and accessible');
        logger.error('  3. Database credentials are valid');
        logger.error('  4. Network connectivity to database host');
        return false;
      }
    }
  }
  return false;
}

/**
 * Check database health status
 * @returns True if database is healthy, false otherwise
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.warn('Database health check failed:', error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Gracefully disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
  }
}

export default prisma;
