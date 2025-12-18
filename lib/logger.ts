/**
 * Server-Side Logger
 * Uses Winston for file logging and Sentry for error tracking
 * 
 * This file should ONLY be used in server-side code (API routes, server components)
 * For client-side components, use '@/lib/logger-client' instead
 * For Edge Runtime (middleware), use '@/lib/logger-edge' instead
 * 
 * Usage:
 * - logger.info('message', data)
 * - logger.error('error message', error)
 * - logger.warn('warning')
 * - logger.debug('debug info')
 */

// Check if we're in Edge Runtime
// Edge Runtime doesn't have Node.js modules like fs, path
const isEdgeRuntime = 
  typeof globalThis !== 'undefined' && typeof (globalThis as any).EdgeRuntime !== 'undefined' || 
  (typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge') ||
  (typeof process === 'undefined');

// Lazy load Winston logger only in Node.js runtime
let winstonLogger: any = null;
let captureError: any = null;
let features: any = { hasSentry: false };

// Only load Winston in Node.js runtime (not Edge Runtime)
if (!isEdgeRuntime && typeof require !== 'undefined') {
  try {
    // Use dynamic require to avoid loading in Edge Runtime
    const winstonModule = require('./logger-winston');
    winstonLogger = winstonModule.logger;
    
    try {
      const sentryModule = require('./sentry');
      captureError = sentryModule.captureError;
      
      const envModule = require('./env');
      features = envModule.features;
    } catch (e) {
      // Sentry/env not available, continue without it
    }
  } catch (error) {
    // Winston not available (Edge Runtime), use console only
    winstonLogger = null;
  }
}

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

class Logger {
  /**
   * Log info messages
   */
  info(message: string, data?: any, context?: string) {
    if (isDevelopment || isTest) {
      console.log(`ℹ️ [INFO] ${message}`, data || '');
    }
    if (winstonLogger && !isEdgeRuntime) {
      winstonLogger.info(message, { data, context });
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, data?: any, context?: string) {
    if (isDevelopment || isTest) {
      console.warn(`⚠️ [WARN] ${message}`, data || '');
    }
    if (winstonLogger && !isEdgeRuntime) {
      winstonLogger.warn(message, { data, context });
    }
  }

  /**
   * Log error messages (always logged)
   */
  error(message: string, error?: any, context?: string) {
    console.error(`❌ [ERROR] ${message}`, error || '');
    
    if (isEdgeRuntime) {
      // In Edge Runtime, just log to console
      return;
    }
    
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    if (winstonLogger) {
      winstonLogger.error(message, {
        error: errorObj.message,
        stack: errorObj.stack,
        context,
      });
    }
    
    // Send to Sentry if enabled
    if (features && features.hasSentry && captureError) {
      captureError(errorObj, { message, context });
    }
  }

  /**
   * Log debug messages (development only)
   */
  debug(message: string, data?: any, context?: string) {
    if (isDevelopment) {
      console.debug(`🔍 [DEBUG] ${message}`, data || '');
    }
    if (winstonLogger && !isEdgeRuntime) {
      winstonLogger.debug(message, { data, context });
    }
  }

  /**
   * Log success messages
   */
  success(message: string, data?: any) {
    if (isDevelopment || isTest) {
      console.log(`✅ [SUCCESS] ${message}`, data || '');
    }
    if (winstonLogger && !isEdgeRuntime) {
      winstonLogger.info(`[SUCCESS] ${message}`, { data });
    }
  }

  /**
   * Log database queries (development only)
   */
  query(query: string, params?: any) {
    if (isDevelopment) {
      console.log(`🔍 [QUERY] ${query}`, params || '');
    }
    if (winstonLogger && !isEdgeRuntime) {
      winstonLogger.debug(`[QUERY] ${query}`, { params });
    }
  }

  /**
   * Log API requests (development only)
   */
  api(method: string, path: string, data?: any) {
    if (isDevelopment) {
      console.log(`📡 [API] ${method} ${path}`, data || '');
    }
    if (winstonLogger && !isEdgeRuntime) {
      winstonLogger.info(`[API] ${method} ${path}`, { data });
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Helper functions for common use cases
export const logInfo = (message: string, data?: any) => logger.info(message, data);
export const logError = (message: string, error?: any) => logger.error(message, error);
export const logWarn = (message: string, data?: any) => logger.warn(message, data);
export const logDebug = (message: string, data?: any) => logger.debug(message, data);
export const logSuccess = (message: string, data?: any) => logger.success(message, data);

