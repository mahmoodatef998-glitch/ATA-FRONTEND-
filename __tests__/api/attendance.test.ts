/**
 * Integration Tests for Attendance API
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/attendance/checkin/route';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    attendance: {
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    users: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth-helpers', () => ({
  requireAuth: jest.fn(),
}));

jest.mock('@/lib/location-utils', () => ({
  isWithinRadius: jest.fn(() => true),
  getCompanyLocation: jest.fn(() => ({ lat: 25.2048, lng: 55.2708 })),
  calculateDistance: jest.fn(() => 0.5),
}));

jest.mock('@/lib/timezone-utils', () => ({
  getUaeTime: jest.fn(() => new Date('2025-01-21T10:00:00Z')),
}));

jest.mock('@/lib/attendance-service', () => ({
  normalizeDateToDubai: jest.fn((date) => date),
}));

describe('Attendance API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/attendance/checkin', () => {
    it('should create check-in record', async () => {
      const { prisma } = require('@/lib/prisma');
      const { requireAuth } = require('@/lib/auth-helpers');

      // Mock session
      requireAuth.mockResolvedValue({
        user: {
          id: 1,
          companyId: 1,
          role: 'TECHNICIAN',
        },
      });

      // Mock no existing attendance
      prisma.attendance.findFirst.mockResolvedValue(null);

      // Mock create
      prisma.attendance.create.mockResolvedValue({
        id: 1,
        userId: 1,
        companyId: 1,
        checkInTime: new Date(),
      });

      // Create request
      const request = new NextRequest('http://localhost:3005/api/attendance/checkin', {
        method: 'POST',
        body: JSON.stringify({
          lat: 25.2048,
          lng: 55.2708,
          location: 'Test Location',
          attendanceType: 'OFFICE',
        }),
      });

      // Call handler
      const response = await POST(request);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prisma.attendance.create).toHaveBeenCalled();
    });

    it('should reject if location is too far', async () => {
      const { requireAuth } = require('@/lib/auth-helpers');
      const { isWithinRadius } = require('@/lib/location-utils');

      requireAuth.mockResolvedValue({
        user: { id: 1, companyId: 1, role: 'TECHNICIAN' },
      });

      isWithinRadius.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3005/api/attendance/checkin', {
        method: 'POST',
        body: JSON.stringify({
          lat: 25.2048,
          lng: 55.2708,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(data.success).toBe(false);
    });
  });
});

