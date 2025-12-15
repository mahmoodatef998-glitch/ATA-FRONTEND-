/**
 * Enhanced Rate Limiter
 * Simple in-memory rate limiter with multiple tiers
 * For production with multiple servers, use Redis-based solution like @upstash/ratelimit
 * 
 * Features:
 * - Multiple rate limit tiers (strict, moderate, lenient)
 * - Automatic cleanup of expired entries
 * - IP-based and identifier-based limiting
 * - Headers for remaining requests
 */

// Import logger only when needed (server-side)
let logger: any = null;
try {
  if (typeof window === 'undefined') {
    logger = require('./logger').logger;
  }
} catch (error) {
  // Logger not available, use console fallback
  logger = {
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    info: console.log.bind(console),
  };
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.requests.entries()) {
        if (now > record.resetAt) {
          this.requests.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  async check(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<{ success: boolean; remaining: number; resetAt: number }> {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record || now > record.resetAt) {
      // New window
      const resetAt = now + windowMs;
      this.requests.set(identifier, { count: 1, resetAt });
      return { success: true, remaining: limit - 1, resetAt };
    }

    if (record.count >= limit) {
      // Rate limit exceeded
      return {
        success: false,
        remaining: 0,
        resetAt: record.resetAt,
      };
    }

    // Increment count
    record.count += 1;
    this.requests.set(identifier, record);

    return {
      success: true,
      remaining: limit - record.count,
      resetAt: record.resetAt,
    };
  }

  cleanup() {
    clearInterval(this.cleanupInterval);
  }
}

export const rateLimiter = new RateLimiter();

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  // Public endpoints (no auth required) - Strict
  PUBLIC_ORDER_CREATE: {
    limit: 5,
    windowMs: 60 * 60 * 1000, // 5 requests per hour
  },
  PUBLIC_ORDER_TRACK: {
    limit: 20,
    windowMs: 60 * 60 * 1000, // 20 requests per hour
  },
  
  // Authentication endpoints - Moderate
  AUTH_LOGIN: {
    limit: 10,
    windowMs: 15 * 60 * 1000, // 10 attempts per 15 minutes
  },
  AUTH_REGISTER: {
    limit: 5,
    windowMs: 60 * 60 * 1000, // 5 registrations per hour
  },
  
  // API endpoints (authenticated) - Lenient
  API_GENERAL: {
    limit: 100,
    windowMs: 15 * 60 * 1000, // 100 requests per 15 minutes
  },
  API_FILE_UPLOAD: {
    limit: 20,
    windowMs: 60 * 60 * 1000, // 20 uploads per hour
  },
  
  // Email sending - Very strict
  EMAIL_SEND: {
    limit: 10,
    windowMs: 60 * 60 * 1000, // 10 emails per hour
  },
  
  // Notifications - Moderate
  NOTIFICATION_CREATE: {
    limit: 50,
    windowMs: 60 * 60 * 1000, // 50 notifications per hour
  },
};

/**
 * Get client IP address from request
 */
export function getClientIp(request: Request): string {
  // Try to get real IP from headers (works with proxies/load balancers)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return "unknown";
}

/**
 * Apply rate limiting to an API route
 * Returns Response if rate limit exceeded, null otherwise
 * Also returns rate limit info for headers
 */
export async function applyRateLimit(
  request: Request,
  config: { limit: number; windowMs: number },
  identifier?: string
): Promise<{ response: Response | null; rateLimitInfo: { remaining: number; resetAt: number; limit: number } | null }> {
  const ip = getClientIp(request);
  const key = identifier || ip;
  
  const result = await rateLimiter.check(key, config.limit, config.windowMs);
  
  if (!result.success) {
    if (logger) {
      logger.warn(`Rate limit exceeded for ${key}`);
    } else {
      console.warn(`Rate limit exceeded for ${key}`);
    }
    
    const resetDate = new Date(result.resetAt);
    return {
      response: new Response(
        JSON.stringify({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again after ${resetDate.toLocaleTimeString()}`,
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': config.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetAt.toString(),
            'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
          },
        }
      ),
      rateLimitInfo: null,
    };
  }
  
  // Return rate limit info for headers
  return {
    response: null,
    rateLimitInfo: {
      remaining: result.remaining,
      resetAt: result.resetAt,
      limit: config.limit,
    },
  };
}

/**
 * Get rate limit headers for successful responses
 */
export function getRateLimitHeaders(
  remaining: number,
  resetAt: number,
  limit: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': resetAt.toString(),
  };
}

