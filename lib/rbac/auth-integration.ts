/**
 * Auth Integration
 * Adds roles and permissions to user context after login
 */

import { getUserPermissions, getUserRoles } from "./permission-service";
import { UserRole } from "@prisma/client";

/**
 * Enhance session with permissions
 */
export async function enhanceSessionWithPermissions(session: {
  user: {
    id: number | string;
    companyId: number | string;
    role: UserRole;
    [key: string]: any;
  };
}) {
  const userId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
  const companyId = typeof session.user.companyId === "string" ? parseInt(session.user.companyId) : session.user.companyId;

  // Get permissions and roles
  const [permissions, roles] = await Promise.all([
    getUserPermissions(userId, companyId),
    getUserRoles(userId),
  ]);

  // Add to session
  return {
    ...session,
    user: {
      ...session.user,
      permissions,
      roles: roles.map(r => r.name),
      roleIds: roles.map(r => r.id),
    },
  };
}


