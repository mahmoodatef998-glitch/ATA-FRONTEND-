/**
 * RBAC Permissions Management API
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { z } from "zod";

const createPermissionSchema = z.object({
  name: z.string().min(1).max(100),
  displayName: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.string().min(1).max(50),
  resource: z.string().min(1).max(50),
  action: z.string().min(1).max(50),
});

/**
 * GET - Get all permissions
 */
export async function GET(request: NextRequest) {
  // Build-time probe safe response
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const { userId, companyId } = await authorize(PermissionAction.ROLE_MANAGE);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const resource = searchParams.get("resource");

    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (resource) {
      where.resource = resource;
    }

    const permissions = await prisma.permissions.findMany({
      where,
      orderBy: [
        { category: "asc" },
        { resource: "asc" },
        { action: "asc" },
      ],
    });

    return NextResponse.json({
      success: true,
      data: permissions,
    });
  } catch (error: any) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch permissions" },
      { status: error.status || 500 }
    );
  }
}

/**
 * POST - Create a new permission
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, companyId } = await authorize(PermissionAction.ROLE_MANAGE);
    const body = await request.json();
    const validation = createPermissionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid permission data",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { name, displayName, description, category, resource, action } = validation.data;

    // Check if permission name already exists
    const existing = await prisma.permissions.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Permission name already exists" },
        { status: 400 }
      );
    }

    const permission = await prisma.permissions.create({
      data: {
        name,
        displayName,
        description,
        category,
        resource,
        action,
      },
    });

    return NextResponse.json({
      success: true,
      data: permission,
      message: "Permission created successfully",
    });
  } catch (error: any) {
    console.error("Error creating permission:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create permission" },
      { status: error.status || 500 }
    );
  }
}


