/**
 * Audit Logger Tests
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { prisma } from "@/lib/prisma";
import {
  createAuditLog,
  getAuditLogs,
  AuditAction,
  AuditResource,
} from "@/lib/rbac/audit-logger";
import { UserRole } from "@prisma/client";

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    audit_logs: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe("Audit Logger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createAuditLog", () => {
    it("should create audit log entry", async () => {
      const mockCreate = jest.mocked(prisma.audit_logs.create);
      mockCreate.mockResolvedValue({ id: 1 } as any);

      await createAuditLog({
        companyId: 1,
        userId: 1,
        userName: "Test User",
        userRole: UserRole.ADMIN,
        action: AuditAction.USER_ROLE_CHANGED,
        resource: AuditResource.USER,
        resourceId: 2,
        details: { oldRole: "TECHNICIAN", newRole: "SUPERVISOR" },
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          companyId: 1,
          userId: 1,
          userName: "Test User",
          userRole: UserRole.ADMIN,
          action: AuditAction.USER_ROLE_CHANGED,
          resource: AuditResource.USER,
          resourceId: 2,
          details: { oldRole: "TECHNICIAN", newRole: "SUPERVISOR" },
          ipAddress: undefined,
          userAgent: undefined,
        },
      });
    });

    it("should handle errors gracefully", async () => {
      const mockCreate = jest.mocked(prisma.audit_logs.create);
      mockCreate.mockRejectedValue(new Error("Database error"));

      // Should not throw
      await expect(
        createAuditLog({
          companyId: 1,
          userId: 1,
          userName: "Test User",
          userRole: UserRole.ADMIN,
          action: AuditAction.USER_CREATED,
          resource: AuditResource.USER,
        })
      ).resolves.not.toThrow();
    });
  });

  describe("getAuditLogs", () => {
    it("should fetch audit logs with filters", async () => {
      const mockFindMany = jest.mocked(prisma.audit_logs.findMany);
      const mockCount = jest.mocked(prisma.audit_logs.count);

      mockFindMany.mockResolvedValue([
        {
          id: 1,
          action: AuditAction.USER_ROLE_CHANGED,
          resource: AuditResource.USER,
          createdAt: new Date(),
        },
      ] as any);
      mockCount.mockResolvedValue(1);

      const result = await getAuditLogs({
        companyId: 1,
        action: AuditAction.USER_ROLE_CHANGED,
        limit: 10,
        offset: 0,
      });

      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockFindMany).toHaveBeenCalled();
      expect(mockCount).toHaveBeenCalled();
    });

    it("should apply date filters", async () => {
      const mockFindMany = jest.mocked(prisma.audit_logs.findMany);
      const mockCount = jest.mocked(prisma.audit_logs.count);

      mockFindMany.mockResolvedValue([] as any);
      mockCount.mockResolvedValue(0);

      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-12-31");

      await getAuditLogs({
        companyId: 1,
        startDate,
        endDate,
      });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      );
    });
  });
});


