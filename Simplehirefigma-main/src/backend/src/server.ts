import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import config from './config';
import logger from './config/logger';
import { testDatabaseConnection, checkDatabaseHealth, disconnectDatabase } from './config/database';
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

// Health check configuration
const HEALTH_CHECK_DB_TIMEOUT_MS = 2000; // Timeout for database health check

// Lightweight health check endpoint - always returns 200 during startup
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
        email: !!config.email.sendgridApiKey,
      },
    };

    // Check database connection (non-blocking)
    try {
      const dbHealthy = await Promise.race([
        checkDatabaseHealth(),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), HEALTH_CHECK_DB_TIMEOUT_MS))
      ]);
      health.services.database = dbHealthy;
    } catch (error) {
      logger.warn('Health check: Database check failed', error);
      health.services.database = false;
    }

    // Always return 200 - let services be degraded without failing healthcheck
    res.json(health);
  } catch (error) {
    logger.error('Health check error:', error);
    // Still return 200 with error info but mark success as false
    res.status(200).json({
      success: false,
      message: 'Service starting',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
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

// Serve static frontend files (production only)
if (config.nodeEnv === 'production') {
  const frontendPath = path.join(__dirname, '..', 'public');
  
  // Serve static files
  app.use(express.static(frontendPath));
  
  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Initialize application and start server
async function startServer() {
  try {
    logger.info('🚀 Initializing server startup sequence...');
    logServerStartup();
    
    logger.info('🔍 Verifying database connection...');
    await verifyDatabaseConnection();
    logger.info('✅ Database connection verified');
    
    logger.info('🌐 Starting HTTP server...');
    const server = startHttpServer();
    logger.info('✅ HTTP server started');
    
    logger.info('🛡️  Setting up graceful shutdown handlers...');
    setupGracefulShutdown(server);
    logger.info('✅ Graceful shutdown handlers configured');
    
    logger.info('✨ Server startup complete!');
  } catch (error) {
    logger.error('❌ CRITICAL: Failed to start server');
    logger.error('Error details:', error);
    if (error instanceof Error) {
      logger.error('Error name:', error.name);
      logger.error('Error message:', error.message);
      logger.error('Error stack:', error.stack);
    }
    logger.error('Server will exit with code 1');
    process.exit(1);
  }
}

/**
 * Log server startup banner
 */
function logServerStartup(): void {
  logger.info('='.repeat(60));
  logger.info('🚀 Starting Simplehire Backend Server...');
  logger.info('='.repeat(60));
}

/**
 * Verify database connection with retries before starting server
 */
async function verifyDatabaseConnection(): Promise<void> {
  logger.info('Checking database connectivity...');
  const dbConnected = await testDatabaseConnection(10, 3000); // 10 retries, 3s delay

  if (!dbConnected) {
    logger.error('Failed to establish database connection. Server will not start.');
    logger.error('Please ensure DATABASE_URL is correct and PostgreSQL is accessible.');
    throw new Error('Database connection failed');
  }
}

/**
 * Start HTTP server and log success
 */
function startHttpServer(): any {
  const PORT = config.port;
  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info('='.repeat(60));
    logger.info('✓ Simplehire Backend Server Started Successfully');
    logger.info('='.repeat(60));
    logger.info(`📍 Server running on port ${PORT}`);
    logger.info(`📝 Environment: ${config.nodeEnv}`);
    logger.info(`🌐 Frontend URL: ${config.frontendUrl}`);
    logger.info(`🔗 Health Check: http://localhost:${PORT}/health`);
    logger.info(`🔒 JWT Authentication: Configured`);
    logger.info(`💾 Database: Connected and ready`);
    logger.info('='.repeat(60));
    logger.info('Server is ready to accept requests');
    logger.info('='.repeat(60));
  });

  return server;
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown(server: any): void {
  const gracefulShutdown = async (signal: string) => {
    logger.info(`\n${signal} received. Starting graceful shutdown...`);

    server.close(async () => {
      logger.info('HTTP server closed');

      // Disconnect from database
      await disconnectDatabase();

      logger.info('Graceful shutdown complete');
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
}

// Start the server
startServer();

export default app;
