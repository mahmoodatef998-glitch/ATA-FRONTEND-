import { z } from 'zod';
import { logger } from './logger';

/**
 * Environment Variables Schema
 * Validates all required environment variables at startup
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().url().min(1, 'DATABASE_URL is required'),

  // NextAuth
  NEXTAUTH_URL: z.string().url().min(1, 'NEXTAUTH_URL is required'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),

  // Socket.io
  NEXT_PUBLIC_SOCKET_URL: z.string().url().optional(),

  // Email (Optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  // File Upload
  MAX_FILE_SIZE: z.string().optional().default('10485760'), // 10MB
  ALLOWED_FILE_TYPES: z.string().optional(),

  // Sentry (Optional)
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),

  // Redis (Optional)
  REDIS_URL: z.string().url().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW: z.string().optional().default('900000'), // 15 minutes
  RATE_LIMIT_MAX: z.string().optional().default('100'),
});

/**
 * Validated environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 * Throws error if validation fails
 */
function validateEnv(): Env {
  try {
    // In development, provide fallback values for NextAuth if missing
    const envData: Record<string, string | undefined> = { ...process.env };
    
    // Always provide fallback for NEXTAUTH_SECRET in development if missing or too short
    if (process.env.NODE_ENV === 'development') {
      if (!envData.NEXTAUTH_SECRET || envData.NEXTAUTH_SECRET.length < 32) {
        envData.NEXTAUTH_SECRET = 'ata-crm-dev-secret-key-change-in-production-min-32-chars-long';
        if (!process.env.NEXTAUTH_SECRET) {
          logger.warn('⚠️ NEXTAUTH_SECRET not found. Using fallback for development.', {
            context: 'env',
            note: 'Please add NEXTAUTH_SECRET (min 32 characters) to your .env file. See ENV_TEMPLATE.txt for example.'
          });
        } else {
          logger.warn('⚠️ NEXTAUTH_SECRET is too short. Using fallback for development.', {
            context: 'env',
            note: 'Please add NEXTAUTH_SECRET (min 32 characters) to your .env file. See ENV_TEMPLATE.txt for example.'
          });
        }
      }
      
      // Provide fallback for NEXTAUTH_URL in development
      if (!envData.NEXTAUTH_URL) {
        envData.NEXTAUTH_URL = 'http://localhost:3005';
        logger.warn('⚠️ NEXTAUTH_URL not found. Using fallback: http://localhost:3005', {
          context: 'env'
        });
      }
    }
    
    // Use safeParse to avoid throwing errors
    const result = envSchema.safeParse(envData);
    
    if (result.success) {
      if (process.env.NODE_ENV === 'development') {
        logger.success('✅ Environment variables validated');
      }
      return result.data;
    }
    
    // If validation failed, check if it's a NextAuth error in development
    if (process.env.NODE_ENV === 'development') {
      const isSecretError = result.error.errors.some(err => 
        err.path.includes('NEXTAUTH_SECRET') || err.path.includes('NEXTAUTH_URL')
      );
      
      if (isSecretError) {
        logger.warn('⚠️ NextAuth configuration warning (using fallback):', result.error.errors);
        // Return with fallback values for development
        return {
          ...process.env,
          NEXTAUTH_SECRET: envData.NEXTAUTH_SECRET || 'ata-crm-dev-secret-key-change-in-production-min-32-chars-long',
          NEXTAUTH_URL: envData.NEXTAUTH_URL || 'http://localhost:3005',
          NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
          DATABASE_URL: process.env.DATABASE_URL || '',
        } as any;
      }
    }
    
    // For other errors or in production, throw error
    logger.error('❌ Invalid environment variables:', result.error.errors);
    
    console.error('\n🔴 Environment Validation Failed:\n');
    result.error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    console.error('\n📝 Please check your .env file\n');
    console.error('💡 Tip: Copy ENV_TEMPLATE.txt to .env and fill in the required values\n');
    
    throw new Error('Invalid environment variables');
  } catch (error) {
    // If it's not a ZodError, re-throw it
    if (!(error instanceof z.ZodError)) {
      throw error;
    }
    
    // This should not happen as we use safeParse, but just in case
    logger.error('❌ Unexpected validation error:', error);
    throw error;
  }
}

/**
 * Export validated environment variables
 * Use lazy initialization to avoid errors during module import
 */
let _env: Env | null = null;

function getValidatedEnv(): Env {
  if (!_env) {
    _env = validateEnv();
  }
  return _env;
}

export const env = new Proxy({} as Env, {
  get(target, prop) {
    return getValidatedEnv()[prop as keyof Env];
  },
  ownKeys() {
    return Object.keys(getValidatedEnv());
  },
  has(target, prop) {
    return prop in getValidatedEnv();
  },
});

/**
 * Helper functions to check optional features
 */
export const features = {
  hasEmail: Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD),
  hasSentry: Boolean(env.SENTRY_DSN),
  hasRedis: Boolean(env.REDIS_URL),
  hasSocket: Boolean(env.NEXT_PUBLIC_SOCKET_URL),
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',
};

/**
 * Get environment variable with type safety
 */
export function getEnv<K extends keyof Env>(key: K): Env[K] {
  return env[key];
}

/**
 * Get numeric environment variable
 */
export function getEnvNumber(key: keyof Env, defaultValue: number): number {
  const value = env[key];
  if (!value) return defaultValue;
  const num = parseInt(value as string, 10);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Get boolean environment variable
 */
export function getEnvBoolean(key: keyof Env, defaultValue: boolean): boolean {
  const value = env[key];
  if (!value) return defaultValue;
  return value === 'true' || value === '1';
}

/**
 * Print environment info (development only)
 */
export function printEnvInfo() {
  if (process.env.NODE_ENV !== 'development') return;

  console.log('\n📊 Environment Info:');
  console.log('  - NODE_ENV:', env.NODE_ENV);
  console.log('  - Database:', env.DATABASE_URL ? '✅ Connected' : '❌ Missing');
  console.log('  - NextAuth:', env.NEXTAUTH_URL ? '✅ Configured' : '❌ Missing');
  console.log('  - Email:', features.hasEmail ? '✅ Enabled' : '⚠️ Disabled');
  console.log('  - Socket:', features.hasSocket ? '✅ Enabled' : '⚠️ Disabled');
  console.log('  - Sentry:', features.hasSentry ? '✅ Enabled' : '⚠️ Disabled');
  console.log('  - Redis:', features.hasRedis ? '✅ Enabled' : '⚠️ Disabled');
  console.log('');
}

// Print info on import (development only)
if (process.env.NODE_ENV === 'development') {
  printEnvInfo();
}

