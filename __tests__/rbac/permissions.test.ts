/**
 * RBAC Permissions Tests
 */

import { describe, it, expect } from "@jest/globals";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  canAssignRole,
  canAccessTeamModule,
  PermissionAction,
} from "@/lib/permissions/role-permissions";
import { UserRole } from "@prisma/client";

describe("RBAC Permissions", () => {
  describe("hasPermission", () => {
    it("should return true if role has permission", () => {
      expect(
        hasPermission(UserRole.ADMIN, PermissionAction.TEAM_MEMBERS_CREATE)
      ).toBe(true);
    });

    it("should return false if role doesn't have permission", () => {
      expect(
        hasPermission(UserRole.TECHNICIAN, PermissionAction.TEAM_MEMBERS_CREATE)
      ).toBe(false);
    });
  });

  describe("hasAnyPermission", () => {
    it("should return true if role has any of the permissions", () => {
      expect(
        hasAnyPermission(UserRole.ADMIN, [
          PermissionAction.TEAM_MEMBERS_CREATE,
          PermissionAction.ORDERS_DELETE,
        ])
      ).toBe(true);
    });

    it("should return false if role has none of the permissions", () => {
      expect(
        hasAnyPermission(UserRole.TECHNICIAN, [
          PermissionAction.TEAM_MEMBERS_CREATE,
          PermissionAction.ORDERS_DELETE,
        ])
      ).toBe(false);
    });
  });

  describe("hasAllPermissions", () => {
    it("should return true if role has all permissions", () => {
      expect(
        hasAllPermissions(UserRole.ADMIN, [
          PermissionAction.TEAM_MEMBERS_CREATE,
          PermissionAction.TEAM_MEMBERS_READ,
        ])
      ).toBe(true);
    });

    it("should return false if role is missing any permission", () => {
      expect(
        hasAllPermissions(UserRole.TECHNICIAN, [
          PermissionAction.ATTENDANCE_CREATE,
          PermissionAction.TEAM_MEMBERS_CREATE,
        ])
      ).toBe(false);
    });
  });

  describe("getRolePermissions", () => {
    it("should return all permissions for a role", () => {
      const permissions = getRolePermissions(UserRole.ADMIN);
      expect(permissions).toContain(PermissionAction.TEAM_MEMBERS_CREATE);
      expect(permissions.length).toBeGreaterThan(0);
    });

    it("should return empty array for unknown role", () => {
      const permissions = getRolePermissions("UNKNOWN_ROLE" as UserRole);
      expect(permissions).toEqual([]);
    });
  });

  describe("canAssignRole", () => {
    it("should allow Admin to assign any role", () => {
      expect(canAssignRole(UserRole.ADMIN, UserRole.TECHNICIAN)).toBe(true);
      expect(canAssignRole(UserRole.ADMIN, UserRole.ADMIN)).toBe(true);
    });

    it("should prevent HR from assigning Admin role", () => {
      expect(canAssignRole(UserRole.HR, UserRole.ADMIN)).toBe(false);
    });

    it("should allow HR to assign non-Admin roles", () => {
      expect(canAssignRole(UserRole.HR, UserRole.TECHNICIAN)).toBe(true);
    });

    it("should prevent Operations Manager from assigning Admin role", () => {
      expect(canAssignRole(UserRole.OPERATIONS_MANAGER, UserRole.ADMIN)).toBe(
        false
      );
    });
  });

  describe("canAccessTeamModule", () => {
    it("should allow team roles to access team module", () => {
      expect(canAccessTeamModule(UserRole.ADMIN)).toBe(true);
      expect(canAccessTeamModule(UserRole.TECHNICIAN)).toBe(true);
      expect(canAccessTeamModule(UserRole.SUPERVISOR)).toBe(true);
      expect(canAccessTeamModule(UserRole.HR)).toBe(true);
      expect(canAccessTeamModule(UserRole.OPERATIONS_MANAGER)).toBe(true);
      expect(canAccessTeamModule(UserRole.ACCOUNTANT)).toBe(true);
    });

    it("should deny non-team roles", () => {
      expect(canAccessTeamModule(UserRole.CLIENT)).toBe(false);
    });
  });
});


