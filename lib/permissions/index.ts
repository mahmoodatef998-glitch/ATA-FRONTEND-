/**
 * Permissions System - Main Export
 * Centralized exports for all permission-related functionality
 */

// Core permission system
export {
  PermissionAction,
  PermissionResource,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  canAssignRole,
  canAccessTeamModule,
  canAccessOtherModules,
} from "./role-permissions";

// Backend middleware
export {
  requirePermission,
  requireAllPermissions,
  requireRole,
  requireTeamModuleAccess,
  requireCanAssignRole,
  requireResourceAccess,
  withPermission,
  withRole,
} from "./middleware";

// Frontend hooks
export {
  usePermission,
  useAnyPermission,
  useCanAssignRole,
  useCanAccessTeamModule,
  useCanAccessOtherModules,
  useUserRole,
  useIsAdmin,
  useIsHROrOperationsManager,
  useIsSupervisor,
  useIsTechnician,
} from "./hooks";

// UI Components
export {
  PermissionGuard,
  TeamModuleGuard,
  OtherModulesGuard,
  RoleAssignmentGuard,
  PermissionButton,
} from "./components";

