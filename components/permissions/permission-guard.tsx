/**
 * Permission Guard Component
 * Conditionally renders children based on permissions
 */

"use client";

import { ReactNode } from "react";
import { useCan, useCanAny, useCanAll } from "@/lib/permissions/frontend-helpers";
import { PermissionAction } from "@/lib/permissions/role-permissions";

interface PermissionGuardProps {
  permission?: string | PermissionAction;
  permissions?: (string | PermissionAction)[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGuard({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGuardProps) {
  // Always call hooks unconditionally to follow React Hooks rules
  // Pass empty string/array if not provided - hooks will handle it gracefully
  const hasPermission = useCan(permission || "");
  const hasAnyPermission = useCanAny(permissions || []);
  const hasAllPermissions = useCanAll(permissions || []);

  // Determine access based on provided props
  // Only use the hook results if the corresponding prop was provided
  const canAccess = permission
    ? hasPermission
    : permissions && permissions.length > 0
    ? requireAll
      ? hasAllPermissions
      : hasAnyPermission
    : false;

  if (!canAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}


