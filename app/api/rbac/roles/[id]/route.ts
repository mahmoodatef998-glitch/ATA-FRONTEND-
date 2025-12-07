/**
 * RBAC Role Management API (Single Role)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { createAuditLog, AuditAction, AuditResource, getAuditContext } from "@/lib/rbac/audit-logger";
import { onRolePermissionsChanged } from "@/lib/rbac/permission-service";
import { z } from "zod";

const updateRoleSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.number()).optional(),
});

/**
 * GET - Get single role
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, companyId } = await authorize(PermissionAction.ROLE_MANAGE);
    const { id } = await params;
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      return NextResponse.json(
        { success: false, error: "Invalid role ID" },
        { status: 400 }
      );
    }

    const role = await prisma.roles.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permissions: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        isSystem: role.isSystem,
        companyId: role.companyId,
        permissions: role.rolePermissions.map(rp => ({
          id: rp.permissions.id,
          name: rp.permissions.name,
          displayName: rp.permissions.displayName,
        })),
        userCount: role._count.userRoles,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Error fetching role:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch role" },
      { status: error.status || 500 }
    );
  }
}

/**
 * PATCH - Update role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, companyId } = await authorize(PermissionAction.ROLE_MANAGE);
    const { id } = await params;
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      return NextResponse.json(
        { success: false, error: "Invalid role ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updateRoleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid role data",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { displayName, description, permissionIds } = validation.data;

    // Check if role exists
    const existingRole = await prisma.roles.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: true,
      },
    });

    if (!existingRole) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    // Cannot modify system roles
    if (existingRole.isSystem) {
      return NextResponse.json(
        { success: false, error: "Cannot modify system roles" },
        { status: 403 }
      );
    }

    // Update role
    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (description !== undefined) updateData.description = description;

    const role = await prisma.roles.update({
      where: { id: roleId },
      data: {
        ...updateData,
        rolePermissions: permissionIds
          ? {
              deleteMany: {},
              create: permissionIds.map(permId => ({
                permissionId: permId,
              })),
            }
          : undefined,
      },
      include: {
        rolePermissions: {
          include: {
            permissions: true,
          },
        },
      },
    });

    // Invalidate cache
    onRolePermissionsChanged(roleId);

    // Audit log
    const auditContext = getAuditContext(request);
    await createAuditLog({
      companyId,
      userId,
      action: AuditAction.ROLE_PERMISSIONS_UPDATED,
      resource: AuditResource.ROLE,
      resourceId: roleId,
      details: {
        action: "role_updated",
        roleName: role.name,
        oldPermissions: existingRole.rolePermissions.map(rp => rp.permissionId),
        newPermissions: permissionIds || [],
      },
      ...auditContext,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        permissions: role.rolePermissions.map(rp => ({
          id: rp.permissions.id,
          name: rp.permissions.name,
        })),
      },
      message: "Role updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update role" },
      { status: error.status || 500 }
    );
  }
}

/**
 * DELETE - Delete role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, companyId } = await authorize(PermissionAction.ROLE_MANAGE);
    const { id } = await params;
    const roleId = parseInt(id);

    if (isNaN(roleId)) {
      return NextResponse.json(
        { success: false, error: "Invalid role ID" },
        { status: 400 }
      );
    }

    const role = await prisma.roles.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    // Cannot delete system roles
    if (role.isSystem) {
      return NextResponse.json(
        { success: false, error: "Cannot delete system roles" },
        { status: 403 }
      );
    }

    // Cannot delete role if it's assigned to users
    if (role._count.userRoles > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete role. It is assigned to ${role._count.userRoles} user(s)`,
        },
        { status: 400 }
      );
    }

    await prisma.roles.delete({
      where: { id: roleId },
    });

    // Audit log
    const auditContext = getAuditContext(request);
    await createAuditLog({
      companyId,
      userId,
      action: AuditAction.ROLE_PERMISSIONS_UPDATED,
      resource: AuditResource.ROLE,
      resourceId: roleId,
      details: {
        action: "role_deleted",
        roleName: role.name,
      },
      ...auditContext,
    });

    return NextResponse.json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete role" },
      { status: error.status || 500 }
    );
  }
}


