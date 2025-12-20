import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { UserRole, Prisma, UserAccountStatus } from "@prisma/client";
import { handleApiError } from "@/lib/error-handler";

// GET - List users
export async function GET(request: NextRequest) {
  // Build-time probe safe response
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const session = await requireAuth();
    
    // Allow Supervisors and Admins to view users (especially technicians)
    if (session.user.role !== UserRole.SUPERVISOR && session.user.role !== UserRole.ADMIN) {
      // Technicians can only view their own info
      return NextResponse.json({
        success: true,
        data: [{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
          createdAt: new Date(),
        }],
      });
    }

    const { searchParams } = new URL(request.url);
    const roleParams = searchParams.getAll("role"); // Support multiple role parameters
    const status = searchParams.get("status"); // Filter by accountStatus
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;
    const companyId = session.user.companyId;

    const where: Prisma.usersWhereInput = {
      companyId,
    };

    // Handle single or multiple role filters
    if (roleParams.length > 0) {
      if (roleParams.length === 1) {
        where.role = roleParams[0] as UserRole;
      } else {
        where.role = {
          in: roleParams as UserRole[],
        };
      }
    }

    if (status) {
      where.accountStatus = status as UserAccountStatus;
    }

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          accountStatus: true,
          approvedAt: true,
          rejectionReason: true,
          department: true,
          specialization: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.users.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
