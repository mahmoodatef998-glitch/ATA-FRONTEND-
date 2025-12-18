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
import { PermissionAction } from "@/lib/permissions/role-permissions";

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
      jest.mocked(prisma.tasks.findUnique).mockResolvedValue({
        createdById: 1,
        assignedTo: null,
      } as any);

      const result = await checkResourceOwnership(1, "task", 1);
      expect(result).toBe(true);
    });

    it("should return true if user is assigned to the task", async () => {
      jest.mocked(prisma.tasks.findUnique).mockResolvedValue({
        createdById: 2,
        assignedTo: 1,
      } as any);

      const result = await checkResourceOwnership(1, "task", 1);
      expect(result).toBe(true);
    });

    it("should return false if user doesn't own the task", async () => {
      jest.mocked(prisma.tasks.findUnique).mockResolvedValue({
        createdById: 2,
        assignedTo: 3,
      } as any);

      const result = await checkResourceOwnership(1, "task", 1);
      expect(result).toBe(false);
    });

    it("should return true if user owns their own attendance", async () => {
      jest.mocked(prisma.attendance.findUnique).mockResolvedValue({
        userId: 1,
      } as any);

      const result = await checkResourceOwnership(1, "attendance", 1);
      expect(result).toBe(true);
    });
  });

  describe("checkCompanyAccess", () => {
    it("should return true if user and resource belong to same company", async () => {
      jest.mocked(prisma.users.findUnique).mockResolvedValue({
        companyId: 1,
      } as any);
      jest.mocked(prisma.tasks.findUnique).mockResolvedValue({
        companyId: 1,
      } as any);

      const result = await checkCompanyAccess(1, 1, "task", 1);
      expect(result).toBe(true);
    });

    it("should return false if user and resource belong to different companies", async () => {
      jest.mocked(prisma.users.findUnique).mockResolvedValue({
        companyId: 1,
      } as any);
      jest.mocked(prisma.tasks.findUnique).mockResolvedValue({
        companyId: 2,
      } as any);

      const result = await checkCompanyAccess(1, 1, "task", 1);
      expect(result).toBe(false);
    });
  });

  describe("canAccessResource", () => {
    it("should return true if user has permission and company access", async () => {
      jest.mocked(getUserPermissions).mockResolvedValue([
        PermissionAction.TASK_READ,
      ]);
      jest.mocked(prisma.users.findUnique).mockResolvedValue({
        companyId: 1,
      } as any);
      jest.mocked(prisma.tasks.findUnique).mockResolvedValue({
        companyId: 1,
      } as any);

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
      jest.mocked(getUserPermissions).mockResolvedValue([]);

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
      jest.mocked(getUserPermissions).mockResolvedValue([
        PermissionAction.TASK_READ,
      ]);
      jest.mocked(prisma.users.findUnique).mockResolvedValue({
        companyId: 1,
      } as any);
      jest.mocked(prisma.tasks.findUnique).mockResolvedValue({
        companyId: 1,
      } as any);

      await expect(
        enforceResourceAccess(1, 1, PermissionAction.TASK_READ, "task", 1)
      ).resolves.not.toThrow();
    });

    it("should throw if user lacks company access", async () => {
      jest.mocked(getUserPermissions).mockResolvedValue([
        PermissionAction.TASK_READ,
      ]);
      jest.mocked(prisma.users.findUnique).mockResolvedValue({
        companyId: 1,
      } as any);
      jest.mocked(prisma.tasks.findUnique).mockResolvedValue({
        companyId: 2,
      } as any);

      await expect(
        enforceResourceAccess(1, 1, PermissionAction.TASK_READ, "task", 1)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("checkTeamMembership", () => {
    it("should return true if users are in same company", async () => {
      const userFind = jest.mocked(prisma.users.findUnique);
      userFind
        .mockResolvedValueOnce({ companyId: 1, role: "SUPERVISOR" } as any)
        .mockResolvedValueOnce({ companyId: 1, role: "TECHNICIAN" } as any);

      const result = await checkTeamMembership(1, 2);
      expect(result).toBe(true);
    });

    it("should return false if users are in different companies", async () => {
      const userFindBatch = jest.mocked(prisma.users.findUnique);
      userFindBatch
        .mockResolvedValueOnce({ companyId: 1, role: "SUPERVISOR" } as any)
        .mockResolvedValueOnce({ companyId: 2, role: "TECHNICIAN" } as any);

      const result = await checkTeamMembership(1, 2);
      expect(result).toBe(false);
    });
  });
});


