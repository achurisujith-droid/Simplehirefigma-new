/**
 * Environment Configuration
 * Centralized configuration management for different environments
 */

interface EnvironmentConfig {
  apiBaseUrl: string;
  environment: 'development' | 'staging' | 'production';
  enableLogging: boolean;
  apiTimeout: number;
  maxFileUploadSize: number; // in bytes
  supportedImageFormats: string[];
  supportedDocumentFormats: string[];
}

// Safe access to import.meta.env
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || defaultValue;
  }
  return defaultValue;
};

const developmentConfig: EnvironmentConfig = {
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', 'http://localhost:3000/api'),
  environment: 'development',
  enableLogging: true,
  apiTimeout: 30000,
  maxFileUploadSize: 10 * 1024 * 1024, // 10MB
  supportedImageFormats: ['image/jpeg', 'image/png', 'image/webp'],
  supportedDocumentFormats: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
};

const stagingConfig: EnvironmentConfig = {
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', 'https://staging-api.simplehire.ai/api'),
  environment: 'staging',
  enableLogging: true,
  apiTimeout: 30000,
  maxFileUploadSize: 10 * 1024 * 1024,
  supportedImageFormats: ['image/jpeg', 'image/png', 'image/webp'],
  supportedDocumentFormats: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
};

const productionConfig: EnvironmentConfig = {
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', 'https://api.simplehire.ai/api'),
  environment: 'production',
  enableLogging: false,
  apiTimeout: 30000,
  maxFileUploadSize: 10 * 1024 * 1024,
  supportedImageFormats: ['image/jpeg', 'image/png', 'image/webp'],
  supportedDocumentFormats: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
};

const getConfig = (): EnvironmentConfig => {
  const env = getEnvVar('VITE_ENVIRONMENT', getEnvVar('MODE', 'development'));
  
  switch (env) {
    case 'production':
      return productionConfig;
    case 'staging':
      return stagingConfig;
    case 'development':
    default:
      return developmentConfig;
  }
};

export const config = getConfig();

// Helper functions
export const isProduction = () => config.environment === 'production';
export const isDevelopment = () => config.environment === 'development';
export const isStaging = () => config.environment === 'staging';