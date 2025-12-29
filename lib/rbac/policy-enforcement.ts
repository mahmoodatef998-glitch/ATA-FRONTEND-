/**
 * Policy Enforcement
 * Resource-level checks (ownership, team membership, etc.)
 */

import { prisma } from "@/lib/prisma";
import { ForbiddenError } from "@/lib/error-handler";
import { getUserPermissions } from "./permission-service";

/**
 * Check if user owns a resource
 */
export async function checkResourceOwnership(
  userId: number,
  resourceType: string,
  resourceId: number
): Promise<boolean> {
  switch (resourceType) {
    case "task":
      const task = await prisma.tasks.findUnique({
        where: { id: resourceId },
        select: { assignedById: true, assignedToId: true },
      });
      return task?.assignedById === userId || task?.assignedToId === userId;

    case "attendance":
      const attendance = await prisma.attendance.findUnique({
        where: { id: resourceId },
        select: { userId: true },
      });
      return attendance?.userId === userId;

    case "user":
      return resourceId === userId;

    default:
      return false;
  }
}

/**
 * Check if user belongs to the same company as resource
 */
export async function checkCompanyAccess(
  userId: number,
  companyId: number,
  resourceType: string,
  resourceId: number
): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  if (!user || user.companyId !== companyId) {
    return false;
  }

  switch (resourceType) {
    case "task":
      const task = await prisma.tasks.findUnique({
        where: { id: resourceId },
        select: { companyId: true },
      });
      return task?.companyId === companyId;

    case "attendance":
      const attendance = await prisma.attendance.findUnique({
        where: { id: resourceId },
        include: { users: { select: { companyId: true } } },
      });
      return attendance?.users.companyId === companyId;

    case "user":
      const targetUser = await prisma.users.findUnique({
        where: { id: resourceId },
        select: { companyId: true },
      });
      return targetUser?.companyId === companyId;

    default:
      return true; // Default to allowing if resource type not specified
  }
}

/**
 * Check if user can access resource based on permissions and ownership
 */
export async function canAccessResource(
  userId: number,
  companyId: number,
  permission: string,
  resourceType: string,
  resourceId: number,
  options: {
    requireOwnership?: boolean;
    requireCompanyAccess?: boolean;
  } = {}
): Promise<boolean> {
  const { requireOwnership = false, requireCompanyAccess = true } = options;

  // Check permission
  const permissions = await getUserPermissions(userId, companyId);
  if (!permissions.includes(permission)) {
    return false;
  }

  // Check company access
  if (requireCompanyAccess) {
    const hasCompanyAccess = await checkCompanyAccess(
      userId,
      companyId,
      resourceType,
      resourceId
    );
    if (!hasCompanyAccess) {
      return false;
    }
  }

  // Check ownership (for limited permissions)
  if (requireOwnership) {
    const isOwner = await checkResourceOwnership(userId, resourceType, resourceId);
    if (!isOwner) {
      return false;
    }
  }

  return true;
}

/**
 * Enforce resource access with fallback rules
 */
export async function enforceResourceAccess(
  userId: number,
  companyId: number,
  permission: string,
  resourceType: string,
  resourceId: number
): Promise<void> {
  const permissions = await getUserPermissions(userId, companyId);

  // Check if user has full permission (e.g., task.read.all)
  const hasFullPermission = permissions.includes(permission);

  if (hasFullPermission) {
    // Check company access only
    const hasCompanyAccess = await checkCompanyAccess(
      userId,
      companyId,
      resourceType,
      resourceId
    );
    if (!hasCompanyAccess) {
      throw new ForbiddenError("Access denied: Resource belongs to different company");
    }
    return;
  }

  // Fallback: Check limited permission (e.g., task.read.own)
  // For now, we'll check ownership
  const isOwner = await checkResourceOwnership(userId, resourceType, resourceId);
  if (!isOwner) {
    throw new ForbiddenError("Access denied: You can only access your own resources");
  }

  // Also check company access
  const hasCompanyAccess = await checkCompanyAccess(
    userId,
    companyId,
    resourceType,
    resourceId
  );
  if (!hasCompanyAccess) {
    throw new ForbiddenError("Access denied: Resource belongs to different company");
  }
}

/**
 * Check if user is in the same team
 */
export async function checkTeamMembership(
  userId: number,
  targetUserId: number
): Promise<boolean> {
  const [user, targetUser] = await Promise.all([
    prisma.users.findUnique({
      where: { id: userId },
      select: { companyId: true, role: true },
    }),
    prisma.users.findUnique({
      where: { id: targetUserId },
      select: { companyId: true, role: true },
    }),
  ]);

  if (!user || !targetUser) {
    return false;
  }

  // Same company
  if (user.companyId !== targetUser.companyId) {
    return false;
  }

  // Supervisor can access technicians
  if (user.role === "SUPERVISOR" && targetUser.role === "TECHNICIAN") {
    return true;
  }

  // Same role or admin
  return user.role === targetUser.role || user.role === "ADMIN";
}


