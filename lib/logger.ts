/**
 * Enhanced Logger with Logtail Support
 * Uses console.log for local development and Logtail for production
 * Compatible with Vercel Edge Runtime
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Lazy load Logtail only if token is provided (server-side only)
let logtail: any = null;

if (typeof window === 'undefined' && process.env.LOGTAIL_TOKEN) {
  try {
    // Dynamic import to avoid Edge Runtime issues
    const { Logtail } = require('@logtail/node');
    logtail = new Logtail(process.env.LOGTAIL_TOKEN);
  } catch (error) {
    console.warn('⚠️ Logtail not available, using console only:', error);
  }
}

class Logger {
  private logToLogtail(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    if (logtail && process.env.NODE_ENV === 'production') {
      try {
        const logData = {
          message,
          ...(data && typeof data === 'object' ? data : { data }),
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV,
        };

        switch (level) {
          case 'info':
            logtail.info(message, logData);
            break;
          case 'warn':
            logtail.warn(message, logData);
            break;
          case 'error':
            logtail.error(message, logData);
            break;
        }
      } catch (error) {
        // Don't fail if Logtail fails
        console.error('Logtail error:', error);
      }
    }
  }

  info(message: string, data?: any, context?: string) {
    const logMessage = context ? `[${context}] ${message}` : message;
    
    // Always log to console
    if (isDevelopment || isTest) {
      console.log(`ℹ️ [INFO] ${logMessage}`, data || '');
    } else {
      console.log(`[INFO] ${logMessage}`, data || '');
    }

    // Also log to Logtail in production
    this.logToLogtail('info', logMessage, data);
  }

  warn(message: string, data?: any, context?: string) {
    const logMessage = context ? `[${context}] ${message}` : message;
    
    // Always log to console
    if (isDevelopment || isTest) {
      console.warn(`⚠️ [WARN] ${logMessage}`, data || '');
    } else {
      console.warn(`[WARN] ${logMessage}`, data || '');
    }

    // Also log to Logtail in production
    this.logToLogtail('warn', logMessage, data);
  }

  error(message: string, error?: any, context?: string) {
    const logMessage = context ? `[${context}] ${message}` : message;
    
    // Always log to console
    console.error(`❌ [ERROR] ${logMessage}`, error || '');

    // Also log to Logtail in production
    const errorData = error instanceof Error
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : error;
    
    this.logToLogtail('error', logMessage, errorData);
  }

  debug(message: string, data?: any, context?: string) {
    if (isDevelopment) {
      const logMessage = context ? `[${context}] ${message}` : message;
      console.debug(`🔍 [DEBUG] ${logMessage}`, data || '');
    }
    // Debug logs don't go to Logtail (too verbose)
  }

  success(message: string, data?: any) {
    const logMessage = `✅ [SUCCESS] ${message}`;
    
    if (isDevelopment || isTest) {
      console.log(logMessage, data || '');
    } else {
      console.log(`[SUCCESS] ${message}`, data || '');
    }

    // Log success as info to Logtail
    this.logToLogtail('info', message, data);
  }

  query(query: string, params?: any) {
    if (isDevelopment) {
      console.log(`🔍 [QUERY] ${query}`, params || '');
    }
    // Query logs don't go to Logtail (too verbose)
  }

  api(method: string, path: string, data?: any) {
    if (isDevelopment) {
      console.log(`📡 [API] ${method} ${path}`, data || '');
    }
    // API logs don't go to Logtail (too verbose, unless error)
  }
}

export const logger = new Logger();

export const logInfo = (message: string, data?: any) => logger.info(message, data);
export const logError = (message: string, error?: any) => logger.error(message, error);
export const logWarn = (message: string, data?: any) => logger.warn(message, data);
export const logDebug = (message: string, data?: any) => logger.debug(message, data);
export const logSuccess = (message: string, data?: any) => logger.success(message, data);
