import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { UnauthorizedError, ForbiddenError } from "@/lib/error-handler";
import { RBAC_ENABLED } from "@/lib/rbac/config";
import { userHasPermission, userHasAnyPermission, userHasAllPermissions } from "@/lib/rbac/permission-service";
import { hasPermission, hasAnyPermission, hasAllPermissions } from "@/lib/permissions/role-permissions";
// Support for old Permission enum (backward compatibility)
import { Permission, migratePermission } from "@/lib/permissions/migration-map";

export async function getServerSession() {
  return await auth();
}

export async function requireAuth() {
  const session = await getServerSession();
  
  if (!session || !session.user) {
    // In API routes, throw UnauthorizedError instead of redirect
    if (typeof window === 'undefined') {
      throw new UnauthorizedError("Authentication required");
    }
    redirect("/login");
  }
  
  return session;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();
  
  if (!allowedRoles.includes(session.user.role)) {
    throw new ForbiddenError("Insufficient permissions for this role");
  }
  
  return session;
}

/**
 * التحقق من صلاحية معينة للمستخدم الحالي
 * @param permission الصلاحية المطلوبة (PermissionAction أو Permission القديم)
 * @returns Session إذا كانت الصلاحية متوفرة
 * @throws Error إذا لم تكن الصلاحية متوفرة
 * 
 * @deprecated Use authorize() from @/lib/rbac/authorize instead
 * This function is kept for backward compatibility
 * Supports both old Permission enum and new PermissionAction enum
 */
export async function requirePermission(permission: PermissionAction | Permission) {
  const session = await requireAuth();
  const userId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
  const companyId = typeof session.user.companyId === "string" ? parseInt(session.user.companyId) : session.user.companyId;
  
  // Migrate old Permission to new PermissionAction if needed
  let permissionAction: PermissionAction;
  if (permission in Permission) {
    // Old Permission enum - migrate it
    permissionAction = migratePermission(permission as Permission);
  } else {
    // Already PermissionAction
    permissionAction = permission as PermissionAction;
  }
  
  // Use RBAC system only (legacy system disabled)
  const hasPerm = await userHasPermission(userId, companyId, permissionAction);
  if (!hasPerm) {
    throw new ForbiddenError(`Missing permission: ${permissionAction}`);
  }
  
  return session;
}

/**
 * التحقق من وجود أي صلاحية من قائمة الصلاحيات
 * @param permissions قائمة الصلاحيات
 * @returns Session إذا كانت أي صلاحية متوفرة
 * @throws Error إذا لم تكن أي صلاحية متوفرة
 * 
 * @deprecated Use authorizeAny() from @/lib/rbac/authorize instead
 */
export async function requireAnyPermission(permissions: PermissionAction[]) {
  const session = await requireAuth();
  const userId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
  const companyId = typeof session.user.companyId === "string" ? parseInt(session.user.companyId) : session.user.companyId;
  
  // Use RBAC system only (legacy system disabled)
  const hasAny = await userHasAnyPermission(userId, companyId, permissions);
  if (!hasAny) {
    throw new ForbiddenError("Missing required permissions");
  }
  
  return session;
}

/**
 * التحقق من وجود جميع الصلاحيات المطلوبة
 * @param permissions قائمة الصلاحيات
 * @returns Session إذا كانت جميع الصلاحيات متوفرة
 * @throws Error إذا لم تكن جميع الصلاحيات متوفرة
 * 
 * @deprecated Use authorizeAll() from @/lib/rbac/authorize instead
 */
export async function requireAllPermissions(permissions: PermissionAction[]) {
  const session = await requireAuth();
  const userId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
  const companyId = typeof session.user.companyId === "string" ? parseInt(session.user.companyId) : session.user.companyId;
  
  // Use RBAC system only (legacy system disabled)
  const hasAll = await userHasAllPermissions(userId, companyId, permissions);
  if (!hasAll) {
    throw new ForbiddenError("Missing required permissions");
  }
  
  return session;
}

export async function getCurrentUser() {
  const session = await getServerSession();
  return session?.user || null;
}

