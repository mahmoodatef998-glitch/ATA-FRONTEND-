/**
 * Authorization Middleware
 * Protects endpoints with permission checks
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { ForbiddenError } from "@/lib/error-handler";
import {
  getUserPermissions,
  userHasPermission,
  userHasAnyPermission,
  userHasAllPermissions,
} from "./permission-service";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { RBAC_ENABLED } from "./config";
import { UserRole } from "@prisma/client";

/**
 * Authorizes a user action by checking if they have the required permission.
 * 
 * This is the primary authorization function for API routes. It checks if the
 * authenticated user has the specified permission and returns user context.
 * 
 * @param permission - The permission action to check (e.g., 'user.create', PermissionAction.USER_CREATE)
 * @param fallbackRoles - Optional fallback roles (deprecated, kept for backward compatibility)
 * @returns Object containing userId, companyId, and user permissions if authorized
 * @throws {ForbiddenError} If user doesn't have required permission
 * 
 * @example
 * ```typescript
 * // In an API route
 * export async function POST(request: NextRequest) {
 *   const { userId, companyId } = await authorize(PermissionAction.USER_CREATE);
 *   // User is authorized, proceed with creating user
 * }
 * ```
 */
export async function authorize(
  permission: string | PermissionAction,
  fallbackRoles?: UserRole[]
): Promise<{ userId: number; companyId: number; permissions: string[] }> {
  const session = await requireAuth();
  const userId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
  const companyId = typeof session.user.companyId === "string" ? parseInt(session.user.companyId) : session.user.companyId;

  // RBAC is now the primary system - always use it
  const hasPermission = await userHasPermission(userId, companyId, permission);

  if (!hasPermission) {
    throw new ForbiddenError(
      `Insufficient permissions. Required: ${permission}`
    );
  }

  const permissions = await getUserPermissions(userId, companyId);

  return {
    userId,
    companyId,
    permissions,
  };
}

/**
 * Authorizes a user action if they have ANY of the specified permissions.
 * 
 * Useful when multiple permissions grant access to the same resource.
 * 
 * @param permissions - Array of permission actions (user needs at least one)
 * @param fallbackRoles - Optional fallback roles (deprecated)
 * @returns Object containing userId, companyId, and user permissions if authorized
 * @throws {ForbiddenError} If user doesn't have any of the required permissions
 * 
 * @example
 * ```typescript
 * // Allow access with either LEAD_READ or OVERVIEW_VIEW
 * const { userId, companyId } = await authorizeAny([
 *   PermissionAction.LEAD_READ,
 *   PermissionAction.OVERVIEW_VIEW,
 * ]);
 * ```
 */
export async function authorizeAny(
  permissions: (string | PermissionAction)[],
  fallbackRoles?: UserRole[]
): Promise<{ userId: number; companyId: number; permissions: string[] }> {
  const session = await requireAuth();
  const userId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
  const companyId = typeof session.user.companyId === "string" ? parseInt(session.user.companyId) : session.user.companyId;

  // RBAC is now the primary system - always use it
  const hasAny = await userHasAnyPermission(userId, companyId, permissions);

  if (!hasAny) {
    throw new ForbiddenError(
      `Insufficient permissions. Required one of: ${permissions.join(", ")}`
    );
  }

  const userPermissions = await getUserPermissions(userId, companyId);

  return {
    userId,
    companyId,
    permissions: userPermissions,
  };
}

/**
 * Authorize endpoint with all of the specified permissions
 * Falls back to legacy role checks if RBAC_ENABLED=false
 */
export async function authorizeAll(
  permissions: (string | PermissionAction)[],
  fallbackRoles?: UserRole[]
): Promise<{ userId: number; companyId: number; permissions: string[] }> {
  const session = await requireAuth();
  const userId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
  const companyId = typeof session.user.companyId === "string" ? parseInt(session.user.companyId) : session.user.companyId;

  // RBAC is now the primary system - always use it
  const hasAll = await userHasAllPermissions(userId, companyId, permissions);

  if (!hasAll) {
    throw new ForbiddenError(
      `Insufficient permissions. Required all: ${permissions.join(", ")}`
    );
  }

  const userPermissions = await getUserPermissions(userId, companyId);

  return {
    userId,
    companyId,
    permissions: userPermissions,
  };
}

/**
 * Contextual authorization check
 * Example: supervisor can assign tasks only to technicians
 */
export async function authorizeContextual(
  permission: string | PermissionAction,
  context: {
    resourceId?: number;
    targetUserId?: number;
    targetUserRole?: string;
    [key: string]: any;
  }
): Promise<{ userId: number; companyId: number; permissions: string[] }> {
  const session = await requireAuth();
  const userId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
  const companyId = typeof session.user.companyId === "string" ? parseInt(session.user.companyId) : session.user.companyId;

  // First check basic permission
  const hasPermission = await userHasPermission(userId, companyId, permission);
  if (!hasPermission) {
    throw new ForbiddenError(
      `Insufficient permissions. Required: ${permission}`
    );
  }

  // Apply contextual rules
  if (permission === PermissionAction.TASK_ASSIGN && context.targetUserId) {
    // Supervisor can assign only to technicians
    if (session.user.role === "SUPERVISOR" && context.targetUserRole !== "TECHNICIAN") {
      throw new ForbiddenError(
        "Supervisors can only assign tasks to technicians"
      );
    }
  }

  const userPermissions = await getUserPermissions(userId, companyId);

  return {
    userId,
    companyId,
    permissions: userPermissions,
  };
}

