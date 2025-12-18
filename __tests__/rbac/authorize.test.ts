/**
 * Authorization Tests
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { authorize, authorizeAny, authorizeAll, authorizeContextual } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { ForbiddenError } from "@/lib/error-handler";
import { UserRole } from "@prisma/client";
import type { Session } from "next-auth";

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

const sessionUser: Session["user"] = {
  id: 1,
  email: "test@ata-crm.com",
  name: "Test User",
  role: UserRole.ADMIN,
  companyId: 1,
};

const createSession = (userOverrides?: Partial<Session["user"]>): Session => ({
  user: { ...sessionUser, ...userOverrides },
  expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
});

describe("Authorization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("authorize", () => {
    it("should authorize user with permission", async () => {
      jest.mocked(requireAuth).mockResolvedValue(createSession());
      jest.mocked(userHasPermission).mockResolvedValue(true);
      jest.mocked(getUserPermissions).mockResolvedValue([
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
      jest.mocked(requireAuth).mockResolvedValue(createSession());
      jest.mocked(userHasPermission).mockResolvedValue(false);

      await expect(authorize(PermissionAction.USER_CREATE)).rejects.toThrow(
        ForbiddenError
      );
    });
  });

  describe("authorizeAny", () => {
    it("should authorize if user has any permission", async () => {
      jest.mocked(requireAuth).mockResolvedValue(createSession());
      jest.mocked(userHasAnyPermission).mockResolvedValue(true);
      jest.mocked(getUserPermissions).mockResolvedValue([
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
      jest.mocked(requireAuth).mockResolvedValue(createSession());
      jest.mocked(userHasAnyPermission).mockResolvedValue(false);

      await expect(
        authorizeAny([PermissionAction.USER_CREATE, PermissionAction.USER_DELETE])
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("authorizeAll", () => {
    it("should authorize if user has all permissions", async () => {
      jest.mocked(requireAuth).mockResolvedValue(createSession());
      jest.mocked(userHasAllPermissions).mockResolvedValue(true);
      jest.mocked(getUserPermissions).mockResolvedValue([
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
      jest.mocked(requireAuth).mockResolvedValue(createSession());
      jest.mocked(userHasAllPermissions).mockResolvedValue(false);

      await expect(
        authorizeAll([PermissionAction.USER_CREATE, PermissionAction.USER_DELETE])
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("authorizeContextual", () => {
    it("should enforce contextual rules", async () => {
      jest.mocked(requireAuth).mockResolvedValue(
        createSession({ role: UserRole.SUPERVISOR })
      );
      jest.mocked(userHasPermission).mockResolvedValue(true);
      jest.mocked(getUserPermissions).mockResolvedValue([
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


