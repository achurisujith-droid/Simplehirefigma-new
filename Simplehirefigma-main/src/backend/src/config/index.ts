import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  appUrl: string;
  frontendUrl: string;
  databaseUrl: string;
  redisUrl?: string;
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  aws: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    s3Bucket: string;
    endpoint?: string;
  };
  stripe: {
    secretKey: string;
    publishableKey: string;
    webhookSecret: string;
  };
  email: {
    from: string;
    fromName: string;
    sendgridApiKey?: string;
  };
  google: {
    clientId: string;
    clientSecret: string;
  };
  openai: {
    apiKey: string;
  };
  anthropic: {
    apiKey: string;
  };
  elevenlabs: {
    apiKey: string;
    agentId: string;
  };
  multiLLM: {
    enabled: boolean;
    providers: string[];
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    loginMaxRequests: number;
  };
  fileUpload: {
    maxFileSize: number;
    maxAudioSize: number;
  };
  redis: {
    url: string;
  };
  bcryptRounds: number;
  logLevel: string;
  cookie: {
    name: string;
    maxAge: number;
  };
}

export const config: Config = {
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:8080',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL,
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET || '',
    endpoint: process.env.AWS_ENDPOINT,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  email: {
    from: process.env.EMAIL_FROM || 'noreply@simplehire.ai',
    fromName: process.env.EMAIL_FROM_NAME || 'Simplehire',
    sendgridApiKey: process.env.SENDGRID_API_KEY,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  },
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY || '',
    agentId: process.env.ELEVENLABS_AGENT_ID || '',
  },
  multiLLM: {
    enabled: process.env.ENABLE_MULTI_LLM_ARBITER === 'true',
    providers: (process.env.LLM_PROVIDERS || 'gpt-4o').split(','),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    loginMaxRequests: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5', 10),
  },
  fileUpload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    maxAudioSize: parseInt(process.env.MAX_AUDIO_SIZE || '52428800', 10),
  },
  redis: {
    url: process.env.REDIS_URL || '',
  },
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  logLevel: process.env.LOG_LEVEL || 'info',
  cookie: {
    name: 'session',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};

/**
 * Get cookie options for session cookies
 */
export const getSessionCookieOptions = (clear = false) => {
  const sameSite: 'none' | 'lax' = config.nodeEnv === 'production' ? 'none' : 'lax';
  return {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite,
    maxAge: clear ? 0 : config.cookie.maxAge,
    path: '/',
  };
};

export default config;
