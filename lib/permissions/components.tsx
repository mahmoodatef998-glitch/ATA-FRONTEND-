/**
 * Permission-based UI Components
 * Components that conditionally render based on permissions
 */

"use client";

import { ReactNode } from "react";
import {
  usePermission,
  useAnyPermission,
  useCanAccessTeamModule,
  useCanAccessOtherModules,
  useCanAssignRole,
} from "./hooks";
import { PermissionAction } from "./role-permissions";
import { UserRole } from "@prisma/client";

/**
 * Component that only renders children if user has permission
 */
export function PermissionGuard({
  action,
  actions,
  fallback = null,
  children,
}: {
  action?: PermissionAction;
  actions?: PermissionAction[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  // Always call hooks unconditionally (React Hooks rules)
  // Use SYSTEM_READ as default if not provided
  const defaultAction = PermissionAction.SYSTEM_READ;
  const defaultActions = [PermissionAction.SYSTEM_READ];
  
  const singlePermissionResult = usePermission(action || defaultAction);
  const anyPermissionResult = useAnyPermission(actions || defaultActions);
  
  // Determine which result to use based on props
  const hasAccess = action 
    ? singlePermissionResult && action !== defaultAction
    : actions 
    ? anyPermissionResult && actions.length > 0
    : false;

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Component that only renders children if user can access Our Team module
 */
export function TeamModuleGuard({
  fallback = null,
  children,
}: {
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const canAccess = useCanAccessTeamModule();

  if (!canAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Component that only renders children if user can access other modules
 */
export function OtherModulesGuard({
  fallback = null,
  children,
}: {
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const canAccess = useCanAccessOtherModules();

  if (!canAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Component that only renders children if user can assign a specific role
 */
export function RoleAssignmentGuard({
  targetRole,
  fallback = null,
  children,
}: {
  targetRole: UserRole;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const canAssign = useCanAssignRole(targetRole);

  if (!canAssign) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Button that is disabled if user doesn't have permission
 */
export function PermissionButton({
  action,
  actions,
  disabled,
  className,
  children,
  ...props
}: {
  action?: PermissionAction;
  actions?: PermissionAction[];
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  [key: string]: any;
}) {
  // Always call hooks unconditionally (React Hooks rules)
  // Pass empty array or dummy value if not provided, but hooks must be called
  const singlePermissionResult = usePermission(action || PermissionAction.SYSTEM_READ);
  const anyPermissionResult = useAnyPermission(actions || [PermissionAction.SYSTEM_READ]);
  
  // Determine which result to use based on props
  const hasAccess = action 
    ? (action === PermissionAction.SYSTEM_READ ? false : singlePermissionResult)
    : actions 
    ? (actions.length === 0 ? false : anyPermissionResult)
    : false;

  return (
    <button
      {...props}
      disabled={disabled || !hasAccess}
      className={className}
      style={{
        ...(props.style || {}),
        opacity: hasAccess ? undefined : 0.5,
        cursor: hasAccess ? undefined : "not-allowed",
      }}
    >
      {children}
    </button>
  );
}

