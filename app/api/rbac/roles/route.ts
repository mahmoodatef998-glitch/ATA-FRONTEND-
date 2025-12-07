/**
 * RBAC Roles Management API
 * Admin-only endpoint for managing roles
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { createAuditLog, AuditAction, AuditResource, getAuditContext } from "@/lib/rbac/audit-logger";
import { onRolePermissionsChanged } from "@/lib/rbac/permission-service";
import { z } from "zod";

const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  displayName: z.string().min(1).max(100),
  description: z.string().optional(),
  companyId: z.number().optional(),
  permissionIds: z.array(z.number()).optional(),
});

const updateRoleSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.number()).optional(),
});

/**
 * GET - Get all roles
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, companyId } = await authorize(PermissionAction.ROLE_MANAGE);

    const { searchParams } = new URL(request.url);
    const includeSystem = searchParams.get("includeSystem") === "true";
    const companyOnly = searchParams.get("companyOnly") === "true";

    const where: any = {};
    if (!includeSystem) {
      where.isSystem = false;
    }
    if (companyOnly) {
      where.OR = [
        { companyId: companyId },
        { companyId: null }, // Global roles
      ];
    }

    const roles = await prisma.roles.findMany({
      where,
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
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: roles.map(role => ({
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
      })),
    });
  } catch (error: any) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch roles" },
      { status: error.status || 500 }
    );
  }
}

/**
 * POST - Create a new role
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, companyId } = await authorize(PermissionAction.ROLE_MANAGE);
    const body = await request.json();
    const validation = createRoleSchema.safeParse(body);

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

    const { name, displayName, description, companyId: roleCompanyId, permissionIds } = validation.data;

    // Check if role name already exists
    const existing = await prisma.roles.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Role name already exists" },
        { status: 400 }
      );
    }

    // Create role
    const role = await prisma.roles.create({
      data: {
        name,
        displayName,
        description,
        companyId: roleCompanyId || companyId,
        rolePermissions: permissionIds
          ? {
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

    // Audit log
    const auditContext = getAuditContext(request);
    await createAuditLog({
      companyId,
      userId,
      action: AuditAction.ROLE_PERMISSIONS_UPDATED,
      resource: AuditResource.ROLE,
      resourceId: role.id,
      details: {
        action: "role_created",
        roleName: name,
        permissionIds: permissionIds || [],
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
        isSystem: role.isSystem,
        companyId: role.companyId,
        permissions: role.rolePermissions.map(rp => ({
          id: rp.permissions.id,
          name: rp.permissions.name,
        })),
      },
      message: "Role created successfully",
    });
  } catch (error: any) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create role" },
      { status: error.status || 500 }
    );
  }
}
