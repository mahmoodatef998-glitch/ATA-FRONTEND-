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
  const hasPermission = permission ? useCan(permission) : false;
  const hasAnyPermission = permissions && !requireAll ? useCanAny(permissions) : false;
  const hasAllPermissions = permissions && requireAll ? useCanAll(permissions) : false;

  const canAccess = permission
    ? hasPermission
    : permissions
    ? requireAll
      ? hasAllPermissions
      : hasAnyPermission
    : false;

  if (!canAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}


