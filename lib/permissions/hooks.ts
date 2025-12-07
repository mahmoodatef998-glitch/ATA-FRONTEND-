/**
 * Frontend Permission Hooks
 * React hooks for checking permissions in components
 */

"use client";

import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { PermissionAction, canAssignRole, canAccessTeamModule, canAccessOtherModules } from "./role-permissions";
import { useCan, useCanAny } from "./frontend-helpers";

/**
 * Hook to check if current user has a specific permission
 * @deprecated Use useCan from frontend-helpers instead (uses RBAC)
 */
export function usePermission(action: PermissionAction): boolean {
  return useCan(action);
}

/**
 * Hook to check if current user has any of the specified permissions
 * @deprecated Use useCanAny from frontend-helpers instead (uses RBAC)
 */
export function useAnyPermission(actions: PermissionAction[]): boolean {
  return useCanAny(actions);
}

/**
 * Hook to check if current user can assign a specific role
 */
export function useCanAssignRole(targetRole: UserRole): boolean {
  const { data: session } = useSession();
  
  if (!session?.user?.role) {
    return false;
  }

  return canAssignRole(session.user.role, targetRole);
}

/**
 * Hook to check if current user can access Our Team module
 */
export function useCanAccessTeamModule(): boolean {
  const { data: session } = useSession();
  
  if (!session?.user?.role) {
    return false;
  }

  return canAccessTeamModule(session.user.role);
}

/**
 * Hook to check if current user can access other modules (outside Our Team)
 */
export function useCanAccessOtherModules(): boolean {
  const { data: session } = useSession();
  
  if (!session?.user?.role) {
    return false;
  }

  return canAccessOtherModules(session.user.role);
}

/**
 * Hook to get current user's role
 */
export function useUserRole(): UserRole | null {
  const { data: session } = useSession();
  return session?.user?.role || null;
}

/**
 * Hook to check if current user is admin
 */
export function useIsAdmin(): boolean {
  const { data: session } = useSession();
  return session?.user?.role === UserRole.ADMIN;
}

/**
 * Hook to check if current user is HR or Operations Manager
 */
export function useIsHROrOperationsManager(): boolean {
  const { data: session } = useSession();
  const role = session?.user?.role;
  return role === UserRole.HR || role === UserRole.OPERATIONS_MANAGER;
}

/**
 * Hook to check if current user is Supervisor
 */
export function useIsSupervisor(): boolean {
  const { data: session } = useSession();
  return session?.user?.role === UserRole.SUPERVISOR;
}

/**
 * Hook to check if current user is Technician
 */
export function useIsTechnician(): boolean {
  const { data: session } = useSession();
  return session?.user?.role === UserRole.TECHNICIAN;
}

