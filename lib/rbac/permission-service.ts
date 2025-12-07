/**
 * Permission Service
 * Service for fetching and managing user permissions
 */

import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import {
  getCachedPermissions,
  setCachedPermissions,
  invalidateUserCache,
  invalidateCompanyCache,
  invalidateRoleCache,
} from "./permission-cache";
import { PermissionAction } from "@/lib/permissions/role-permissions";

/**
 * Gets all permissions for a user from their assigned roles.
 * 
 * Combines permissions from:
 * 1. User's roles in user_roles table (if exists)
 * 2. User's default role (from users.role) if no roles assigned
 * 
 * Results are cached for 5 minutes to improve performance.
 * 
 * @param userId - The user ID to get permissions for
 * @param companyId - The company ID (for company-specific roles)
 * @returns Array of permission names (e.g., ['user.create', 'task.read'])
 * 
 * @example
 * ```typescript
 * const permissions = await getUserPermissions(1, 1);
 * // Returns: ['user.create', 'user.read', 'task.create', ...]
 * ```
 */
export async function getUserPermissions(
  userId: number,
  companyId: number
): Promise<string[]> {
  // Check cache first
  const cached = getCachedPermissions(userId, companyId);
  if (cached) {
    return cached;
  }

  // Get user with roles
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      companyId: true,
      userRoles: {
        where: {
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        include: {
          roles: {
            include: {
              rolePermissions: {
                include: {
                  permissions: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return [];
  }

  const permissions = new Set<string>();

  // Get permissions from RBAC roles only (no legacy system)
  // First, try to get role from user_roles table
  if (user.userRoles.length > 0) {
    // User has roles in user_roles table - use them
    for (const userRole of user.userRoles) {
      for (const rolePermission of userRole.roles.rolePermissions) {
        permissions.add(rolePermission.permissions.name);
      }
    }
  } else {
    // User doesn't have roles in user_roles table - find default role by user.role name
    // Map UserRole enum to role name in database (e.g., TECHNICIAN -> technician)
    const roleNameMap: Record<string, string> = {
      'ADMIN': 'admin',
      'OPERATIONS_MANAGER': 'operation_manager',
      'ACCOUNTANT': 'accountant',
      'HR': 'hr',
      'SUPERVISOR': 'supervisor',
      'TECHNICIAN': 'technician',
    };
    
    const roleName = roleNameMap[user.role] || user.role.toLowerCase();
    
    // System roles are not company-specific, so search without companyId first
    const defaultRole = await prisma.roles.findFirst({
      where: {
        name: roleName,
        isSystem: true,
      },
      include: {
        rolePermissions: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (defaultRole) {
      // Add permissions from default role
      for (const rolePermission of defaultRole.rolePermissions) {
        permissions.add(rolePermission.permissions.name);
      }
    }
  }

  const permissionsArray = Array.from(permissions);

  // Cache the permissions
  const roles = [
    user.role,
    ...user.userRoles.map(ur => ur.roles.name),
  ];
  setCachedPermissions(userId, companyId, permissionsArray, roles);

  return permissionsArray;
}

/**
 * Check if user has a specific permission
 */
export async function userHasPermission(
  userId: number,
  companyId: number,
  permission: string | PermissionAction
): Promise<boolean> {
  const permissions = await getUserPermissions(userId, companyId);
  return permissions.includes(String(permission));
}

/**
 * Check if user has any of the specified permissions
 */
export async function userHasAnyPermission(
  userId: number,
  companyId: number,
  permissions: (string | PermissionAction)[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId, companyId);
  const permissionStrings = permissions.map(p => String(p));
  return permissionStrings.some(p => userPermissions.includes(p));
}

/**
 * Check if user has all of the specified permissions
 */
export async function userHasAllPermissions(
  userId: number,
  companyId: number,
  permissions: (string | PermissionAction)[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId, companyId);
  const permissionStrings = permissions.map(p => String(p));
  return permissionStrings.every(p => userPermissions.includes(p));
}

/**
 * Get user roles (default role + additional roles)
 */
export async function getUserRoles(
  userId: number
): Promise<{ name: string; id: number; isDefault: boolean }[]> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      role: true,
      userRoles: {
        where: {
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        include: {
          roles: true,
        },
      },
    },
  });

  if (!user) {
    return [];
  }

  const roles = [
    { name: user.role, id: 0, isDefault: true },
    ...user.userRoles.map(ur => ({
      name: ur.roles.name,
      id: ur.roles.id,
      isDefault: false,
    })),
  ];

  return roles;
}

/**
 * Assign role to user
 */
export async function assignRoleToUser(
  userId: number,
  roleId: number,
  assignedBy: number,
  expiresAt?: Date
): Promise<void> {
  await prisma.user_roles.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
    update: {
      isActive: true,
      assignedBy,
      expiresAt,
    },
    create: {
      userId,
      roleId,
      assignedBy,
      expiresAt,
      isActive: true,
    },
  });

  // Invalidate cache
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });
  if (user) {
    invalidateUserCache(userId, user.companyId);
  }
}

/**
 * Remove role from user
 */
export async function removeRoleFromUser(
  userId: number,
  roleId: number
): Promise<void> {
  await prisma.user_roles.deleteMany({
    where: {
      userId,
      roleId,
    },
  });

  // Invalidate cache
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });
  if (user) {
    invalidateUserCache(userId, user.companyId);
  }
}

/**
 * Invalidate cache when role permissions change
 */
export function onRolePermissionsChanged(roleId: number): void {
  invalidateRoleCache(roleId);
}

/**
 * Invalidate cache when company roles change
 */
export function onCompanyRolesChanged(companyId: number): void {
  invalidateCompanyCache(companyId);
}


