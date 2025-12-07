/**
 * Sentry Error Tracking Setup
 * 
 * To use Sentry:
 * 1. Install: npm install @sentry/nextjs
 * 2. Run setup wizard: npx @sentry/wizard@latest -i nextjs
 * 3. Add SENTRY_DSN to .env
 * 4. Uncomment the code below
 * 
 * For now, this file provides a fallback implementation
 */

import { logger } from './logger';
import { features } from './env';

/**
 * Initialize Sentry (if enabled)
 */
export function initSentry() {
  if (!features.hasSentry) {
    logger.info('Sentry not configured - using fallback error tracking');
    return;
  }

  try {
    // TODO: Uncomment after installing @sentry/nextjs
    /*
    import * as Sentry from '@sentry/nextjs';
    
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
      
      // Performance Monitoring
      integrations: [
        new Sentry.BrowserTracing({
          tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
        }),
      ],
      
      // Replay Sessions
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      
      // Filter sensitive data
      beforeSend(event) {
        // Don't send auth tokens
        if (event.request?.headers) {
          delete event.request.headers['Authorization'];
          delete event.request.headers['Cookie'];
        }
        return event;
      },
    });
    
    logger.success('Sentry initialized');
    */
  } catch (error) {
    logger.error('Failed to initialize Sentry', error);
  }
}

/**
 * Capture error with Sentry
 */
export function captureError(
  error: Error | string,
  context?: Record<string, any>
) {
  // Log locally
  logger.error(typeof error === 'string' ? error : error.message, error);
  
  if (!features.hasSentry) {
    return;
  }

  try {
    // TODO: Uncomment after installing @sentry/nextjs
    /*
    import * as Sentry from '@sentry/nextjs';
    
    if (typeof error === 'string') {
      Sentry.captureMessage(error, {
        level: 'error',
        extra: context,
      });
    } else {
      Sentry.captureException(error, {
        extra: context,
      });
    }
    */
  } catch (err) {
    logger.error('Failed to send error to Sentry', err);
  }
}

/**
 * Capture message with Sentry
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
) {
  logger.info(message, context);
  
  if (!features.hasSentry) {
    return;
  }

  try {
    // TODO: Uncomment after installing @sentry/nextjs
    /*
    import * as Sentry from '@sentry/nextjs';
    
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
    */
  } catch (err) {
    logger.error('Failed to send message to Sentry', err);
  }
}

/**
 * Set user context for Sentry
 */
export function setUserContext(user: {
  id: number | string;
  email?: string;
  name?: string;
}) {
  if (!features.hasSentry) {
    return;
  }

  try {
    // TODO: Uncomment after installing @sentry/nextjs
    /*
    import * as Sentry from '@sentry/nextjs';
    
    Sentry.setUser({
      id: user.id.toString(),
      email: user.email,
      username: user.name,
    });
    */
  } catch (err) {
    logger.error('Failed to set user context in Sentry', err);
  }
}

/**
 * Clear user context
 */
export function clearUserContext() {
  if (!features.hasSentry) {
    return;
  }

  try {
    // TODO: Uncomment after installing @sentry/nextjs
    /*
    import * as Sentry from '@sentry/nextjs';
    Sentry.setUser(null);
    */
  } catch (err) {
    logger.error('Failed to clear user context in Sentry', err);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  data?: Record<string, any>
) {
  if (!features.hasSentry) {
    return;
  }

  try {
    // TODO: Uncomment after installing @sentry/nextjs
    /*
    import * as Sentry from '@sentry/nextjs';
    
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
    */
  } catch (err) {
    logger.error('Failed to add breadcrumb in Sentry', err);
  }
}

// Initialize on import
if (typeof window === 'undefined') {
  // Server-side
  initSentry();
}

