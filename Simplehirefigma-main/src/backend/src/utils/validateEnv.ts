/**
 * Environment Variable Validation Utility
 * Validates required environment variables at startup to prevent runtime failures
 */

import logger from '../config/logger';

export interface EnvValidationError {
  variable: string;
  message: string;
  severity: 'critical' | 'warning';
}

/**
 * Required environment variables for the application to function
 */
const REQUIRED_VARIABLES = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
] as const;

/**
 * Optional but recommended environment variables
 */
const RECOMMENDED_VARIABLES = [
  'OPENAI_API_KEY',
  'FRONTEND_URL',
  'APP_URL',
  'NODE_ENV',
] as const;

/**
 * Variables required for specific features
 */
const FEATURE_VARIABLES: Record<string, string[]> = {
  'Multi-LLM Evaluation': ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY'],
  'File Uploads (S3)': ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_S3_BUCKET'],
  'Payment Processing': ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'],
  'Email Service': ['SENDGRID_API_KEY'],
  'OAuth': ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
};

/**
 * Validate that a required environment variable exists and is not empty
 */
function validateRequired(variable: string): EnvValidationError | null {
  const value = process.env[variable];
  
  if (!value || value.trim() === '') {
    return {
      variable,
      message: `Missing required environment variable: ${variable}`,
      severity: 'critical',
    };
  }
  
  return null;
}

/**
 * Validate that a recommended environment variable exists
 */
function validateRecommended(variable: string): EnvValidationError | null {
  const value = process.env[variable];
  
  if (!value || value.trim() === '') {
    return {
      variable,
      message: `Missing recommended environment variable: ${variable}`,
      severity: 'warning',
    };
  }
  
  return null;
}

/**
 * Check if JWT secrets meet minimum security requirements
 */
function validateJWTSecrets(): EnvValidationError[] {
  const errors: EnvValidationError[] = [];
  
  const jwtSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  
  if (jwtSecret && jwtSecret.length < 32) {
    errors.push({
      variable: 'JWT_SECRET',
      message: 'JWT_SECRET should be at least 32 characters for security',
      severity: 'warning',
    });
  }
  
  if (refreshSecret && refreshSecret.length < 32) {
    errors.push({
      variable: 'JWT_REFRESH_SECRET',
      message: 'JWT_REFRESH_SECRET should be at least 32 characters for security',
      severity: 'warning',
    });
  }
  
  if (jwtSecret && refreshSecret && jwtSecret === refreshSecret) {
    errors.push({
      variable: 'JWT_SECRET',
      message: 'JWT_SECRET and JWT_REFRESH_SECRET should be different',
      severity: 'warning',
    });
  }
  
  return errors;
}

/**
 * Check database URL format
 */
function validateDatabaseURL(): EnvValidationError | null {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    return null; // Already caught by required validation
  }
  
  // Basic PostgreSQL URL validation
  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    return {
      variable: 'DATABASE_URL',
      message: 'DATABASE_URL must be a valid PostgreSQL connection string (postgresql:// or postgres://)',
      severity: 'critical',
    };
  }
  
  return null;
}

/**
 * Log feature availability based on configured environment variables
 */
function logFeatureAvailability(): void {
  logger.info('=== Feature Availability ===');
  
  for (const [feature, variables] of Object.entries(FEATURE_VARIABLES)) {
    const allConfigured = variables.every(v => process.env[v] && process.env[v]!.trim() !== '');
    const someConfigured = variables.some(v => process.env[v] && process.env[v]!.trim() !== '');
    
    if (allConfigured) {
      logger.info(`✓ ${feature}: Enabled`);
    } else if (someConfigured) {
      const missing = variables.filter(v => !process.env[v] || process.env[v]!.trim() === '');
      logger.warn(`⚠ ${feature}: Partially configured (missing: ${missing.join(', ')})`);
    } else {
      logger.info(`✗ ${feature}: Disabled (not configured)`);
    }
  }
  
  logger.info('============================');
}

/**
 * Validate all environment variables
 * @returns Array of validation errors
 */
export function validateEnvironment(): EnvValidationError[] {
  const errors: EnvValidationError[] = [];
  
  // Check required variables
  for (const variable of REQUIRED_VARIABLES) {
    const error = validateRequired(variable);
    if (error) {
      errors.push(error);
    }
  }
  
  // Check recommended variables
  for (const variable of RECOMMENDED_VARIABLES) {
    const error = validateRecommended(variable);
    if (error) {
      errors.push(error);
    }
  }
  
  // Validate JWT secrets
  errors.push(...validateJWTSecrets());
  
  // Validate database URL
  const dbError = validateDatabaseURL();
  if (dbError) {
    errors.push(dbError);
  }
  
  return errors;
}

/**
 * Validate environment and log results
 * Exits process if critical errors found
 */
export function validateEnvironmentOrExit(): void {
  logger.info('Validating environment variables...');
  
  const errors = validateEnvironment();
  
  // Separate critical and warning errors
  const criticalErrors = errors.filter(e => e.severity === 'critical');
  const warnings = errors.filter(e => e.severity === 'warning');
  
  // Log warnings
  if (warnings.length > 0) {
    logger.warn(`Found ${warnings.length} environment warning(s):`);
    warnings.forEach(error => {
      logger.warn(`  - ${error.message}`);
    });
  }
  
  // Log critical errors and exit if any found
  if (criticalErrors.length > 0) {
    logger.error(`Found ${criticalErrors.length} critical environment error(s):`);
    criticalErrors.forEach(error => {
      logger.error(`  - ${error.message}`);
    });
    logger.error('Application cannot start with missing critical environment variables.');
    logger.error('Please configure the required variables in your deployment environment.');
    logger.error('See .env.example or RAILWAY_SETUP.md for configuration instructions.');
    process.exit(1);
  }
  
  // Log feature availability
  logFeatureAvailability();
  
  logger.info('✓ Environment validation passed');
}

export default {
  validateEnvironment,
  validateEnvironmentOrExit,
};
