/**
 * User Roles Assignment API
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { assignRoleToUser, removeRoleFromUser } from "@/lib/rbac/permission-service";
import { createAuditLog, AuditAction, AuditResource, getAuditContext } from "@/lib/rbac/audit-logger";
import { z } from "zod";

const assignRoleSchema = z.object({
  roleId: z.number(),
  expiresAt: z.string().datetime().optional(),
});

/**
 * GET - Get user roles
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  // Build-time probe safe response
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  try {
    const { userId: currentUserId, companyId } = await authorize(PermissionAction.USER_READ);
    const { userId } = await params;
    const targetUserId = parseInt(userId);

    if (isNaN(targetUserId)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Check if user belongs to same company
    const user = await prisma.users.findUnique({
      where: { id: targetUserId },
      select: { companyId: true },
    });

    if (!user || user.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: "User not found or access denied" },
        { status: 403 }
      );
    }

    const userRoles = await prisma.user_roles.findMany({
      where: {
        userId: targetUserId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        roles: true,
        assigner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: userRoles.map(ur => ({
        id: ur.id,
        roleId: ur.roleId,
        roleName: ur.roles.name,
        roleDisplayName: ur.roles.displayName,
        assignedBy: ur.assignedBy,
        assignerName: ur.assigner?.name,
        assignedAt: ur.assignedAt,
        expiresAt: ur.expiresAt,
        isActive: ur.isActive,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching user roles:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch user roles" },
      { status: error.status || 500 }
    );
  }
}

/**
 * POST - Assign role to user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: currentUserId, companyId } = await authorize(PermissionAction.ROLE_MANAGE);
    const { userId } = await params;
    const targetUserId = parseInt(userId);

    if (isNaN(targetUserId)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = assignRoleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { roleId, expiresAt } = validation.data;

    // Check if user belongs to same company
    const user = await prisma.users.findUnique({
      where: { id: targetUserId },
      select: { companyId: true, name: true, email: true },
    });

    if (!user || user.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: "User not found or access denied" },
        { status: 403 }
      );
    }

    // Check if role exists
    const role = await prisma.roles.findUnique({
      where: { id: roleId },
      select: { name: true, displayName: true },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    // Assign role
    await assignRoleToUser(
      targetUserId,
      roleId,
      currentUserId,
      expiresAt ? new Date(expiresAt) : undefined
    );

    // Audit log
    const auditContext = getAuditContext(request);
    await createAuditLog({
      companyId,
      userId: currentUserId,
      action: AuditAction.USER_ROLE_CHANGED,
      resource: AuditResource.USER,
      resourceId: targetUserId,
      details: {
        action: "role_assigned",
        targetUserId,
        targetUserName: user.name,
        roleId,
        roleName: role.name,
        expiresAt: expiresAt || null,
      },
      ...auditContext,
    });

    return NextResponse.json({
      success: true,
      message: `Role "${role.displayName}" assigned to user successfully`,
    });
  } catch (error: any) {
    console.error("Error assigning role:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to assign role" },
      { status: error.status || 500 }
    );
  }
}

/**
 * DELETE - Remove role from user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: currentUserId, companyId } = await authorize(PermissionAction.ROLE_MANAGE);
    const { userId } = await params;
    const targetUserId = parseInt(userId);

    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get("roleId");

    if (isNaN(targetUserId)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    if (!roleId) {
      return NextResponse.json(
        { success: false, error: "roleId query parameter is required" },
        { status: 400 }
      );
    }

    const roleIdNum = parseInt(roleId);
    if (isNaN(roleIdNum)) {
      return NextResponse.json(
        { success: false, error: "Invalid role ID" },
        { status: 400 }
      );
    }

    // Check if user belongs to same company
    const user = await prisma.users.findUnique({
      where: { id: targetUserId },
      select: { companyId: true, name: true, email: true },
    });

    if (!user || user.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: "User not found or access denied" },
        { status: 403 }
      );
    }

    // Check if role exists
    const role = await prisma.roles.findUnique({
      where: { id: roleIdNum },
      select: { name: true, displayName: true },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    // Remove role
    await removeRoleFromUser(targetUserId, roleIdNum);

    // Audit log
    const auditContext = getAuditContext(request);
    await createAuditLog({
      companyId,
      userId: currentUserId,
      action: AuditAction.USER_ROLE_CHANGED,
      resource: AuditResource.USER,
      resourceId: targetUserId,
      details: {
        action: "role_removed",
        targetUserId,
        targetUserName: user.name,
        roleId: roleIdNum,
        roleName: role.name,
      },
      ...auditContext,
    });

    return NextResponse.json({
      success: true,
      message: `Role "${role.displayName}" removed from user successfully`,
    });
  } catch (error: any) {
    console.error("Error removing role:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove role" },
      { status: error.status || 500 }
    );
  }
}


