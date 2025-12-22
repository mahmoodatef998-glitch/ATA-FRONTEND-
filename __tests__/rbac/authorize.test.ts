/**
 * Authorization Tests
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { authorize, authorizeAny, authorizeAll, authorizeContextual } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { ForbiddenError } from "@/lib/error-handler";

// Mock dependencies
jest.mock("@/lib/auth-helpers", () => ({
  requireAuth: jest.fn(),
}));

jest.mock("@/lib/rbac/permission-service", () => ({
  getUserPermissions: jest.fn(),
  userHasPermission: jest.fn(),
  userHasAnyPermission: jest.fn(),
  userHasAllPermissions: jest.fn(),
}));

import { requireAuth } from "@/lib/auth-helpers";
import {
  getUserPermissions,
  userHasPermission,
  userHasAnyPermission,
  userHasAllPermissions,
} from "@/lib/rbac/permission-service";

describe("Authorization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("authorize", () => {
    it("should authorize user with permission", async () => {
      (requireAuth as jest.Mock).mockResolvedValue({
        user: { id: 1, companyId: 1 },
      });
      (userHasPermission as jest.Mock).mockResolvedValue(true);
      (getUserPermissions as jest.Mock).mockResolvedValue([
        PermissionAction.USER_CREATE,
        PermissionAction.USER_READ,
      ]);

      const result = await authorize(PermissionAction.USER_CREATE);

      expect(result).toEqual({
        userId: 1,
        companyId: 1,
        permissions: [PermissionAction.USER_CREATE, PermissionAction.USER_READ],
      });
    });

    it("should throw ForbiddenError if user lacks permission", async () => {
      (requireAuth as jest.Mock).mockResolvedValue({
        user: { id: 1, companyId: 1 },
      });
      (userHasPermission as jest.Mock).mockResolvedValue(false);

      await expect(authorize(PermissionAction.USER_CREATE)).rejects.toThrow(
        ForbiddenError
      );
    });
  });

  describe("authorizeAny", () => {
    it("should authorize if user has any permission", async () => {
      (requireAuth as jest.Mock).mockResolvedValue({
        user: { id: 1, companyId: 1 },
      });
      (userHasAnyPermission as jest.Mock).mockResolvedValue(true);
      (getUserPermissions as jest.Mock).mockResolvedValue([
        PermissionAction.USER_READ,
      ]);

      const result = await authorizeAny([
        PermissionAction.USER_CREATE,
        PermissionAction.USER_READ,
      ]);

      expect(result.userId).toBe(1);
      expect(result.companyId).toBe(1);
    });

    it("should throw ForbiddenError if user lacks all permissions", async () => {
      (requireAuth as jest.Mock).mockResolvedValue({
        user: { id: 1, companyId: 1 },
      });
      (userHasAnyPermission as jest.Mock).mockResolvedValue(false);

      await expect(
        authorizeAny([PermissionAction.USER_CREATE, PermissionAction.USER_DELETE])
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("authorizeAll", () => {
    it("should authorize if user has all permissions", async () => {
      (requireAuth as jest.Mock).mockResolvedValue({
        user: { id: 1, companyId: 1 },
      });
      (userHasAllPermissions as jest.Mock).mockResolvedValue(true);
      (getUserPermissions as jest.Mock).mockResolvedValue([
        PermissionAction.USER_CREATE,
        PermissionAction.USER_READ,
      ]);

      const result = await authorizeAll([
        PermissionAction.USER_CREATE,
        PermissionAction.USER_READ,
      ]);

      expect(result.userId).toBe(1);
    });

    it("should throw ForbiddenError if user lacks any permission", async () => {
      (requireAuth as jest.Mock).mockResolvedValue({
        user: { id: 1, companyId: 1 },
      });
      (userHasAllPermissions as jest.Mock).mockResolvedValue(false);

      await expect(
        authorizeAll([PermissionAction.USER_CREATE, PermissionAction.USER_DELETE])
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("authorizeContextual", () => {
    it("should enforce contextual rules", async () => {
      (requireAuth as jest.Mock).mockResolvedValue({
        user: { id: 1, companyId: 1, role: "SUPERVISOR" },
      });
      (userHasPermission as jest.Mock).mockResolvedValue(true);
      (getUserPermissions as jest.Mock).mockResolvedValue([
        PermissionAction.TASK_ASSIGN,
      ]);

      // Supervisor trying to assign to non-technician should fail
      await expect(
        authorizeContextual(PermissionAction.TASK_ASSIGN, {
          targetUserId: 2,
          targetUserRole: "ADMIN",
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });
});


