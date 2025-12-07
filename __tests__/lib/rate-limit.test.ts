/**
 * Tests for Rate Limiter
 */

import { rateLimiter, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Clear rate limiter state before each test
    (rateLimiter as any).requests.clear();
  });

  describe('check', () => {
    it('should allow requests within limit', async () => {
      const result = await rateLimiter.check('test-key', 5, 60000);
      
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });

    it('should block requests exceeding limit', async () => {
      const limit = 3;
      const windowMs = 60000;
      const key = 'test-key-2';

      // Make requests up to limit
      for (let i = 0; i < limit; i++) {
        await rateLimiter.check(key, limit, windowMs);
      }

      // Next request should be blocked
      const result = await rateLimiter.check(key, limit, windowMs);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset after window expires', async () => {
      const result1 = await rateLimiter.check('test-key-3', 2, 100); // 100ms window
      expect(result1.success).toBe(true);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should allow new request
      const result2 = await rateLimiter.check('test-key-3', 2, 100);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(1);
    });

    it('should track different keys separately', async () => {
      const result1 = await rateLimiter.check('user-1', 2, 60000);
      const result2 = await rateLimiter.check('user-2', 2, 60000);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.remaining).toBe(1);
      expect(result2.remaining).toBe(1);
    });

    it('should decrement remaining count correctly', async () => {
      const key = 'test-key-4';
      const limit = 5;

      for (let i = 0; i < limit; i++) {
        const result = await rateLimiter.check(key, limit, 60000);
        expect(result.success).toBe(true);
        expect(result.remaining).toBe(limit - i - 1);
      }
    });
  });

  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '1.2.3.4, 5.6.7.8',
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe('1.2.3.4');
    });

    it('should extract IP from x-real-ip header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-real-ip': '9.8.7.6',
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe('9.8.7.6');
    });

    it('should prioritize x-forwarded-for over x-real-ip', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '1.2.3.4',
          'x-real-ip': '5.6.7.8',
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe('1.2.3.4');
    });

    it('should return "unknown" if no IP headers present', () => {
      const request = new Request('http://localhost');
      const ip = getClientIp(request);
      expect(ip).toBe('unknown');
    });
  });

  describe('RATE_LIMITS configuration', () => {
    it('should have valid configuration for public endpoints', () => {
      expect(RATE_LIMITS.PUBLIC_ORDER_CREATE.limit).toBeGreaterThan(0);
      expect(RATE_LIMITS.PUBLIC_ORDER_CREATE.windowMs).toBeGreaterThan(0);
    });

    it('should have stricter limits for auth endpoints', () => {
      const authLimit = RATE_LIMITS.AUTH_LOGIN.limit;
      const apiLimit = RATE_LIMITS.API_GENERAL.limit;
      
      expect(authLimit).toBeLessThan(apiLimit);
    });

    it('should have very strict limits for email', () => {
      expect(RATE_LIMITS.EMAIL_SEND.limit).toBeLessThanOrEqual(10);
    });
  });

  describe('Rate limit scenarios', () => {
    it('should handle rapid successive requests', async () => {
      const key = 'rapid-test';
      const limit = 10;
      
      const promises = Array.from({ length: limit }, () =>
        rateLimiter.check(key, limit, 60000)
      );

      const results = await Promise.all(promises);
      const successful = results.filter(r => r.success).length;
      
      expect(successful).toBe(limit);
    });

    it('should provide accurate resetAt timestamp', async () => {
      const now = Date.now();
      const windowMs = 60000;
      
      const result = await rateLimiter.check('test-reset', 5, windowMs);
      
      expect(result.resetAt).toBeGreaterThan(now);
      expect(result.resetAt).toBeLessThanOrEqual(now + windowMs + 100);
    });
  });
});

