import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { UserRole, Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");
    const skip = (page - 1) * limit;

    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    // Technicians can only view their own history
    // Supervisors and Admins can view any user's history
    let targetUserId = userId;
    const targetUserIdParam = searchParams.get("userId");

    if (targetUserIdParam && (session.user.role === UserRole.SUPERVISOR || session.user.role === UserRole.ADMIN)) {
      targetUserId = parseInt(targetUserIdParam);
    }

    const where: Prisma.attendanceWhereInput = {
      userId: targetUserId,
    };

    if (Object.keys(dateFilter).length > 0) {
      where.checkInTime = dateFilter;
    }

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
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
          checkInTime: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.attendance.count({ where }),
    ]);

    // Calculate hours worked for each record
    const attendanceWithHours = attendance.map((record) => {
      let hoursWorked = 0;
      if (record.checkOutTime) {
        hoursWorked = (record.checkOutTime.getTime() - record.checkInTime.getTime()) / (1000 * 60 * 60);
      }
      return {
        ...record,
        hoursWorked: hoursWorked.toFixed(2),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        attendance: attendanceWithHours,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching attendance history:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch attendance history" },
      { status: 500 }
    );
  }
}

