import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { authorizeAny } from "@/lib/rbac/authorize";
import { UserRole, Prisma } from "@prisma/client";
import { ForbiddenError, handleApiError } from "@/lib/error-handler";

// GET - List overtime records
export async function GET(request: NextRequest) {
  try {
    // Check permission using RBAC
    const { userId, companyId } = await authorizeAny([
      PermissionAction.ATTENDANCE_READ,
      PermissionAction.ATTENDANCE_READ_OWN,
      PermissionAction.ATTENDANCE_READ_ALL,
    ]);
    
    // Get session for user info
    const session = await requireAuth();

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");
    const approved = searchParams.get("approved");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");
    const skip = (page - 1) * limit;

    const where: Prisma.overtimeWhereInput = {};

    // Check if user can only read own attendance
    const userPermissions = await import("@/lib/rbac/permission-service").then(m => 
      m.getUserPermissions(userId, companyId)
    );
    const canReadAll = userPermissions.includes(PermissionAction.ATTENDANCE_READ) || 
                       userPermissions.includes(PermissionAction.ATTENDANCE_READ_ALL);
    const canReadOwn = userPermissions.includes(PermissionAction.ATTENDANCE_READ_OWN);
    
    // If user can only read own, filter to their records
    if (canReadOwn && !canReadAll) {
      where.userId = userId;
    } else if (requestedUserId) {
      // User can read all, allow filtering by requestedUserId
      where.userId = parseInt(requestedUserId);
    }

    if (approved !== null && approved !== undefined) {
      where.approved = approved === "true";
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const [overtime, total] = await Promise.all([
      prisma.overtime.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          date: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.overtime.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        overtime,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error("Get overtime error:", error);
    return handleApiError(error);
  }
}

