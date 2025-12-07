/**
 * Integration Tests for Orders API
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/orders/route';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    orders: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth-helpers', () => ({
  requirePermission: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  applyRateLimit: jest.fn(() => Promise.resolve({ response: null, rateLimitInfo: null })),
  getRateLimitHeaders: jest.fn(() => ({})),
  RATE_LIMITS: {
    API_GENERAL: {},
  },
}));

describe('Orders API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/orders', () => {
    it('should return orders with pagination', async () => {
      const { prisma } = require('@/lib/prisma');
      const { requirePermission } = require('@/lib/auth-helpers');

      // Mock session
      requirePermission.mockResolvedValue({
        user: {
          id: 1,
          companyId: 1,
          role: 'ADMIN',
        },
      });

      // Mock database response
      prisma.orders.findMany.mockResolvedValue([
        {
          id: 1,
          status: 'PENDING',
          clients: { name: 'Test Client', phone: '1234567890' },
        },
      ]);
      prisma.orders.count.mockResolvedValue(1);

      // Create request
      const request = new NextRequest('http://localhost:3005/api/orders?page=1&limit=20');

      // Call handler
      const response = await GET(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.orders).toHaveLength(1);
      expect(data.data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('should filter by status', async () => {
      const { prisma } = require('@/lib/prisma');
      const { requirePermission } = require('@/lib/auth-helpers');

      requirePermission.mockResolvedValue({
        user: { id: 1, companyId: 1, role: 'ADMIN' },
      });

      prisma.orders.findMany.mockResolvedValue([]);
      prisma.orders.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3005/api/orders?status=PENDING');

      await GET(request);

      expect(prisma.orders.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING',
          }),
        })
      );
    });

    it('should return 401 if unauthorized', async () => {
      const { requirePermission } = require('@/lib/auth-helpers');

      requirePermission.mockRejectedValue(new Error('Unauthorized'));

      const request = new NextRequest('http://localhost:3005/api/orders');

      const response = await GET(request);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});

