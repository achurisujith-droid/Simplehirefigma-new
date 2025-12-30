import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import config from './config';
import logger from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';
import { validateEnvironmentOrExit } from './utils/validateEnv';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import paymentRoutes from './routes/payment.routes';
import interviewRoutes from './routes/interview.routes';
import idVerificationRoutes from './routes/idVerification.routes';
import referenceRoutes from './routes/reference.routes';
import certificateRoutes from './routes/certificate.routes';
import sessionRoutes from './modules/session/session.routes';
import assessmentRoutes from './modules/assessment/assessment.routes';
import proctoringRoutes from './modules/proctoring/proctoring.routes';

// Validate environment variables before starting the app
validateEnvironmentOrExit();

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (config.nodeEnv !== 'production') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { success: false, error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
});

app.use('/api/', limiter);

// Health check
app.get('/health', async (req, res) => {
  try {
    const health = {
      success: true,
      message: 'Simplehire API is running',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      version: '1.0.0',
      uptime: process.uptime(),
      services: {
        database: false,
        multiLLM: config.multiLLM.enabled,
        storage: !!(config.aws.accessKeyId && config.aws.s3Bucket),
        payments: !!config.stripe.secretKey,
        email: !!(config.email.sendgridApiKey),
      },
    };

    // Check database connection if Prisma is available
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      health.services.database = true;
      await prisma.$disconnect();
    } catch (dbError) {
      logger.warn('Database health check failed:', dbError);
    }

    res.json(health);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      success: false,
      message: 'Service unavailable',
      timestamp: new Date().toISOString(),
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/interviews', authenticate, assessmentRoutes);
app.use('/api/id-verification', idVerificationRoutes);
app.use('/api/references', referenceRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/proctoring', authenticate, proctoringRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info('='.repeat(60));
  logger.info('🚀 Simplehire Backend Server Started Successfully');
  logger.info('='.repeat(60));
  logger.info(`📍 Server running on port ${PORT}`);
  logger.info(`📝 Environment: ${config.nodeEnv}`);
  logger.info(`🌐 Frontend URL: ${config.frontendUrl}`);
  logger.info(`🔗 Health Check: http://localhost:${PORT}/health`);
  logger.info(`🔒 JWT Authentication: Configured`);
  logger.info(`💾 Database: ${config.databaseUrl ? 'Connected' : 'Not configured'}`);
  logger.info('='.repeat(60));
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

export default app;
