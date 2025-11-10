// Simple in-memory rate limiter
// For production, use Redis-based solution like @upstash/ratelimit

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

// Rate limit configurations
export const RATE_LIMITS = {
  PUBLIC_ORDER: {
    limit: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
};

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

