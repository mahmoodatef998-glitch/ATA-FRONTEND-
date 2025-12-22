/**
 * Policy Enforcement Tests
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  checkResourceOwnership,
  checkCompanyAccess,
  canAccessResource,
  enforceResourceAccess,
  checkTeamMembership,
} from "@/lib/rbac/policy-enforcement";
import { prisma } from "@/lib/prisma";
import { ForbiddenError } from "@/lib/error-handler";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    tasks: {
      findUnique: jest.fn(),
    },
    attendance: {
      findUnique: jest.fn(),
    },
    users: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/lib/rbac/permission-service", () => ({
  getUserPermissions: jest.fn(),
}));

import { getUserPermissions } from "@/lib/rbac/permission-service";

describe("Policy Enforcement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkResourceOwnership", () => {
    it("should return true if user owns the task", async () => {
      (prisma.tasks.findUnique as jest.Mock).mockResolvedValue({
        createdById: 1,
        assignedTo: null,
      });

      const result = await checkResourceOwnership(1, "task", 1);
      expect(result).toBe(true);
    });

    it("should return true if user is assigned to the task", async () => {
      (prisma.tasks.findUnique as jest.Mock).mockResolvedValue({
        createdById: 2,
        assignedTo: 1,
      });

      const result = await checkResourceOwnership(1, "task", 1);
      expect(result).toBe(true);
    });

    it("should return false if user doesn't own the task", async () => {
      (prisma.tasks.findUnique as jest.Mock).mockResolvedValue({
        createdById: 2,
        assignedTo: 3,
      });

      const result = await checkResourceOwnership(1, "task", 1);
      expect(result).toBe(false);
    });

    it("should return true if user owns their own attendance", async () => {
      (prisma.attendance.findUnique as jest.Mock).mockResolvedValue({
        userId: 1,
      });

      const result = await checkResourceOwnership(1, "attendance", 1);
      expect(result).toBe(true);
    });
  });

  describe("checkCompanyAccess", () => {
    it("should return true if user and resource belong to same company", async () => {
      (prisma.users.findUnique as jest.Mock).mockResolvedValue({
        companyId: 1,
      });
      (prisma.tasks.findUnique as jest.Mock).mockResolvedValue({
        companyId: 1,
      });

      const result = await checkCompanyAccess(1, 1, "task", 1);
      expect(result).toBe(true);
    });

    it("should return false if user and resource belong to different companies", async () => {
      (prisma.users.findUnique as jest.Mock).mockResolvedValue({
        companyId: 1,
      });
      (prisma.tasks.findUnique as jest.Mock).mockResolvedValue({
        companyId: 2,
      });

      const result = await checkCompanyAccess(1, 1, "task", 1);
      expect(result).toBe(false);
    });
  });

  describe("canAccessResource", () => {
    it("should return true if user has permission and company access", async () => {
      (getUserPermissions as jest.Mock).mockResolvedValue([
        PermissionAction.TASK_READ,
      ]);
      (prisma.users.findUnique as jest.Mock).mockResolvedValue({
        companyId: 1,
      });
      (prisma.tasks.findUnique as jest.Mock).mockResolvedValue({
        companyId: 1,
      });

      const result = await canAccessResource(
        1,
        1,
        PermissionAction.TASK_READ,
        "task",
        1
      );

      expect(result).toBe(true);
    });

    it("should return false if user lacks permission", async () => {
      (getUserPermissions as jest.Mock).mockResolvedValue([]);

      const result = await canAccessResource(
        1,
        1,
        PermissionAction.TASK_READ,
        "task",
        1
      );

      expect(result).toBe(false);
    });
  });

  describe("enforceResourceAccess", () => {
    it("should not throw if user has full permission", async () => {
      (getUserPermissions as jest.Mock).mockResolvedValue([
        PermissionAction.TASK_READ,
      ]);
      (prisma.users.findUnique as jest.Mock).mockResolvedValue({
        companyId: 1,
      });
      (prisma.tasks.findUnique as jest.Mock).mockResolvedValue({
        companyId: 1,
      });

      await expect(
        enforceResourceAccess(1, 1, PermissionAction.TASK_READ, "task", 1)
      ).resolves.not.toThrow();
    });

    it("should throw if user lacks company access", async () => {
      (getUserPermissions as jest.Mock).mockResolvedValue([
        PermissionAction.TASK_READ,
      ]);
      (prisma.users.findUnique as jest.Mock).mockResolvedValue({
        companyId: 1,
      });
      (prisma.tasks.findUnique as jest.Mock).mockResolvedValue({
        companyId: 2,
      });

      await expect(
        enforceResourceAccess(1, 1, PermissionAction.TASK_READ, "task", 1)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("checkTeamMembership", () => {
    it("should return true if users are in same company", async () => {
      (prisma.users.findUnique as jest.Mock)
        .mockResolvedValueOnce({ companyId: 1, role: "SUPERVISOR" })
        .mockResolvedValueOnce({ companyId: 1, role: "TECHNICIAN" });

      const result = await checkTeamMembership(1, 2);
      expect(result).toBe(true);
    });

    it("should return false if users are in different companies", async () => {
      (prisma.users.findUnique as jest.Mock)
        .mockResolvedValueOnce({ companyId: 1, role: "SUPERVISOR" })
        .mockResolvedValueOnce({ companyId: 2, role: "TECHNICIAN" });

      const result = await checkTeamMembership(1, 2);
      expect(result).toBe(false);
    });
  });
});


