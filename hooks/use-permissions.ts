"use client";

import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { PermissionAction, hasPermission, hasAnyPermission, hasAllPermissions, getRolePermissions } from "@/lib/permissions/role-permissions";
import { Permission, migratePermission } from "@/lib/permissions/migration-map";

/**
 * Permissions hook for Client Components (CRM Module)
 * Uses next-auth session to check current user permissions
 * 
 * Note: This is for the CRM module. For Team module, use hooks from @/lib/permissions/hooks
 */
export function usePermissions() {
  const { data: session, status } = useSession();
  const userRole = session?.user?.role as UserRole | undefined;

  // Default to ADMIN role during loading to prevent hydration mismatch
  const effectiveRole = userRole || (status === "loading" ? UserRole.ADMIN : undefined);

  /**
   * Check for a specific permission (supports both old Permission and new PermissionAction)
   */
  const checkPermission = (permission: Permission | PermissionAction): boolean => {
    if (!effectiveRole) return false;
    // If it's old Permission, migrate it
    if (permission in Permission) {
      const migrated = migratePermission(permission as Permission);
      return hasPermission(effectiveRole, migrated);
    }
    // Already PermissionAction
    return hasPermission(effectiveRole, permission as PermissionAction);
  };

  /**
   * Check if user has any of the given permissions
   */
  const checkAnyPermission = (permissions: (Permission | PermissionAction)[]): boolean => {
    if (!effectiveRole) return false;
    // Migrate old permissions to new ones
    const migratedPermissions = permissions.map(p => 
      p in Permission ? migratePermission(p as Permission) : p as PermissionAction
    );
    return hasAnyPermission(effectiveRole, migratedPermissions);
  };

  /**
   * Check if user has all required permissions
   */
  const checkAllPermissions = (permissions: (Permission | PermissionAction)[]): boolean => {
    if (!effectiveRole) return false;
    // Migrate old permissions to new ones
    const migratedPermissions = permissions.map(p => 
      p in Permission ? migratePermission(p as Permission) : p as PermissionAction
    );
    return hasAllPermissions(effectiveRole, migratedPermissions);
  };

  /**
   * Get all permissions for current user (returns PermissionAction[])
   */
  const getUserPermissions = (): PermissionAction[] => {
    if (!effectiveRole) return [];
    return getRolePermissions(effectiveRole);
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: UserRole): boolean => {
    return effectiveRole === role;
  };

  /**
   * Check if user has any of the given roles
   */
  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!effectiveRole) return false;
    return roles.includes(effectiveRole);
  };

  return {
    // State
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    userRole: effectiveRole,
    
    // Permission checks
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    getUserPermissions,
    
    // Role checks
    hasRole,
    hasAnyRole,
  };
}


