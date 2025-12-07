/**
 * Client-Side Logger
 * Simple logger for client-side components (no Winston, no fs)
 * 
 * Usage:
 * - logger.info('message', data)
 * - logger.error('error message', error)
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

class ClientLogger {
  /**
   * Log info messages
   */
  info(message: string, data?: any, context?: string) {
    if (isDevelopment || isTest) {
      console.log(`ℹ️ [INFO] ${message}`, data || '');
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, data?: any, context?: string) {
    if (isDevelopment || isTest) {
      console.warn(`⚠️ [WARN] ${message}`, data || '');
    }
  }

  /**
   * Log error messages (always logged)
   */
  error(message: string, error?: any, context?: string) {
    console.error(`❌ [ERROR] ${message}`, error || '');
    
    // In production, you might want to send to an API endpoint
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking API endpoint
      // fetch('/api/log-error', { method: 'POST', body: JSON.stringify({ message, error, context }) })
    }
  }

  /**
   * Log debug messages (development only)
   */
  debug(message: string, data?: any, context?: string) {
    if (isDevelopment) {
      console.debug(`🔍 [DEBUG] ${message}`, data || '');
    }
  }

  /**
   * Log success messages
   */
  success(message: string, data?: any) {
    if (isDevelopment || isTest) {
      console.log(`✅ [SUCCESS] ${message}`, data || '');
    }
  }

  /**
   * Log database queries (development only)
   */
  query(query: string, params?: any) {
    if (isDevelopment) {
      console.log(`🔍 [QUERY] ${query}`, params || '');
    }
  }

  /**
   * Log API requests (development only)
   */
  api(method: string, path: string, data?: any) {
    if (isDevelopment) {
      console.log(`📡 [API] ${method} ${path}`, data || '');
    }
  }
}

// Export singleton instance
export const logger = new ClientLogger();

// Helper functions for common use cases
export const logInfo = (message: string, data?: any) => logger.info(message, data);
export const logError = (message: string, error?: any) => logger.error(message, error);
export const logWarn = (message: string, data?: any) => logger.warn(message, data);
export const logDebug = (message: string, data?: any) => logger.debug(message, data);
export const logSuccess = (message: string, data?: any) => logger.success(message, data);

