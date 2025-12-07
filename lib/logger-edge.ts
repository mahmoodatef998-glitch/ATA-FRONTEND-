/**
 * Edge Runtime Logger
 * Simple logger for Edge Runtime (middleware, edge functions)
 * Does not use Node.js modules like fs or path
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

class EdgeLogger {
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

export const logger = new EdgeLogger();

