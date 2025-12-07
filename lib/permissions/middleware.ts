/**
 * Backend Authorization Middleware
 * Validates permissions for API routes
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { PermissionAction } from "./role-permissions";
import { ForbiddenError } from "@/lib/error-handler";
import { authorize, authorizeAny, authorizeAll } from "@/lib/rbac/authorize";
import { canAccessTeamModule } from "./role-permissions";

/**
 * Require specific permission(s) for the current user
 * @deprecated Use authorize() or authorizeAny() from @/lib/rbac/authorize instead
 * @param actions - Single permission or array of permissions (user needs at least one)
 * @returns Session if authorized, throws error otherwise
 */
export async function requirePermission(
  actions: PermissionAction | PermissionAction[]
) {
  const actionsArray = Array.isArray(actions) ? actions : [actions];
  await authorizeAny(actionsArray);
  return await requireAuth();
}

/**
 * Require all specified permissions
 * @deprecated Use authorizeAll() from @/lib/rbac/authorize instead
 * @param actions - Array of permissions (user needs all)
 */
export async function requireAllPermissions(actions: PermissionAction[]) {
  await authorizeAll(actions);
  return await requireAuth();
}

/**
 * Require specific role(s)
 * @param allowedRoles - Single role or array of roles
 */
export async function requireRole(
  allowedRoles: UserRole | UserRole[]
) {
  const session = await requireAuth();
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!rolesArray.includes(session.user.role)) {
    throw new ForbiddenError(
      `Access denied. Required role: ${rolesArray.join(" or ")}`
    );
  }

  return session;
}

/**
 * Require access to Our Team module
 */
export async function requireTeamModuleAccess() {
  const session = await requireAuth();

  if (!canAccessTeamModule(session.user.role)) {
    throw new ForbiddenError("Access denied. You don't have access to the Our Team module.");
  }

  return session;
}

/**
 * Check if user can assign a specific role
 * @param targetRole - Role to be assigned
 */
export async function requireCanAssignRole(targetRole: UserRole) {
  const session = await requireAuth();
  
  // Check permission using RBAC
  const { userHasPermission } = await import("@/lib/rbac/permission-service");
  const userId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
  const companyId = typeof session.user.companyId === "string" ? parseInt(session.user.companyId) : session.user.companyId;
  
  // Admin can assign any role
  if (session.user.role === UserRole.ADMIN) {
    return session;
  }
  
  // HR and Operations Manager cannot assign Admin role
  if (
    (session.user.role === UserRole.HR || session.user.role === UserRole.OPERATIONS_MANAGER) &&
    targetRole === UserRole.ADMIN
  ) {
    throw new ForbiddenError("You cannot assign the ADMIN role.");
  }
  
  // Check if user has role.manage permission
  const hasRoleManage = await userHasPermission(userId, companyId, PermissionAction.ROLE_MANAGE);
  if (!hasRoleManage) {
    throw new ForbiddenError(
      `You cannot assign the ${targetRole} role.`
    );
  }

  return session;
}

/**
 * Check if user can access resource owned by another user
 * @param resourceOwnerId - ID of the resource owner
 * @param action - Permission action required
 * @param allowOwnAccess - If true, allow access to own resources even without permission
 */
export async function requireResourceAccess(
  resourceOwnerId: number,
  action: PermissionAction,
  allowOwnAccess: boolean = true
) {
  const session = await requireAuth();
  const userId = typeof session.user.id === "string" 
    ? parseInt(session.user.id) 
    : session.user.id;

  // Allow access to own resources if enabled
  if (allowOwnAccess && userId === resourceOwnerId) {
    return session;
  }

  // Check permission using RBAC
  const { userHasPermission } = await import("@/lib/rbac/permission-service");
  const companyId = typeof session.user.companyId === "string" ? parseInt(session.user.companyId) : session.user.companyId;
  
  const hasPerm = await userHasPermission(userId, companyId, action);
  if (!hasPerm) {
    throw new ForbiddenError(
      `Insufficient permissions to access this resource.`
    );
  }

  return session;
}

/**
 * Wrapper for API route handlers with permission check
 * @param handler - API route handler function
 * @param requiredPermission - Required permission(s)
 */
export function withPermission<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<T>>,
  requiredPermission: PermissionAction | PermissionAction[]
) {
  return async (request: NextRequest, context?: any) => {
    try {
      await requirePermission(requiredPermission);
      return handler(request, context);
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
      throw error;
    }
  };
}

/**
 * Wrapper for API route handlers with role check
 */
export function withRole<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<T>>,
  allowedRoles: UserRole | UserRole[]
) {
  return async (request: NextRequest, context?: any) => {
    try {
      await requireRole(allowedRoles);
      return handler(request, context);
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
      throw error;
    }
  };
}

