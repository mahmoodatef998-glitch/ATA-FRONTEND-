/**
 * Simplified Logger for Vercel Deployment
 * Uses console.log only (no winston dependencies)
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

class Logger {
  info(message: string, data?: any, context?: string) {
    if (isDevelopment || isTest) {
      console.log(`ℹ️ [INFO] ${message}`, data || '');
    }
  }

  warn(message: string, data?: any, context?: string) {
    if (isDevelopment || isTest) {
      console.warn(`⚠️ [WARN] ${message}`, data || '');
    }
  }

  error(message: string, error?: any, context?: string) {
    console.error(`❌ [ERROR] ${message}`, error || '');
  }

  debug(message: string, data?: any, context?: string) {
    if (isDevelopment) {
      console.debug(`🔍 [DEBUG] ${message}`, data || '');
    }
  }

  success(message: string, data?: any) {
    if (isDevelopment || isTest) {
      console.log(`✅ [SUCCESS] ${message}`, data || '');
    }
  }

  query(query: string, params?: any) {
    if (isDevelopment) {
      console.log(`🔍 [QUERY] ${query}`, params || '');
    }
  }

  api(method: string, path: string, data?: any) {
    if (isDevelopment) {
      console.log(`📡 [API] ${method} ${path}`, data || '');
    }
  }
}

export const logger = new Logger();

export const logInfo = (message: string, data?: any) => logger.info(message, data);
export const logError = (message: string, error?: any) => logger.error(message, error);
export const logWarn = (message: string, data?: any) => logger.warn(message, data);
export const logDebug = (message: string, data?: any) => logger.debug(message, data);
export const logSuccess = (message: string, data?: any) => logger.success(message, data);
