/**
 * Frontend Permission Helpers
 * Helper functions for checking permissions in components
 */

"use client";

import { usePermissions } from "@/contexts/permissions-context";
import { PermissionAction } from "./role-permissions";

/**
 * Feature flag: RBAC_ENABLED
 * Falls back to role-based checks if disabled
 * Note: Must be prefixed with NEXT_PUBLIC_ for client-side access
 */
const RBAC_ENABLED = process.env.NEXT_PUBLIC_RBAC_ENABLED === "true";

/**
 * Check if user has a specific permission
 */
export function useCan(permission: string | PermissionAction): boolean {
  const { permissions } = usePermissions();
  // Return false if permission is empty string
  if (!permission || permission === "") {
    return false;
  }
  return permissions.includes(String(permission));
}

/**
 * Check if user has any of the specified permissions
 */
export function useCanAny(permissions: (string | PermissionAction)[]): boolean {
  const { permissions: userPermissions } = usePermissions();
  // Return false if permissions array is empty
  if (!permissions || permissions.length === 0) {
    return false;
  }
  const permissionStrings = permissions.map(p => String(p));
  return permissionStrings.some(p => userPermissions.includes(p));
}

/**
 * Check if user has all of the specified permissions
 */
export function useCanAll(permissions: (string | PermissionAction)[]): boolean {
  const { permissions: userPermissions } = usePermissions();
  // Return false if permissions array is empty
  if (!permissions || permissions.length === 0) {
    return false;
  }
  const permissionStrings = permissions.map(p => String(p));
  return permissionStrings.every(p => userPermissions.includes(p));
}

/**
 * Get all user permissions
 */
export function useUserPermissions(): string[] {
  const { permissions } = usePermissions();
  return permissions;
}

/**
 * Get all user roles
 */
export function useUserRoles(): { name: string; id: number; isDefault: boolean }[] {
  const { roles } = usePermissions();
  return roles;
}

/**
 * Check if user has a specific role
 */
export function useHasRole(roleName: string): boolean {
  const { roles } = usePermissions();
  return roles.some(r => r.name === roleName);
}

/**
 * Standalone permission check (for use outside React components)
 * Note: This requires permissions to be passed as parameter
 */
export function can(permissions: string[], permission: string | PermissionAction): boolean {
  return permissions.includes(String(permission));
}

export function canAny(permissions: string[], requiredPermissions: (string | PermissionAction)[]): boolean {
  const permissionStrings = requiredPermissions.map(p => String(p));
  return permissionStrings.some(p => permissions.includes(p));
}

export function canAll(permissions: string[], requiredPermissions: (string | PermissionAction)[]): boolean {
  const permissionStrings = requiredPermissions.map(p => String(p));
  return permissionStrings.every(p => permissions.includes(p));
}

