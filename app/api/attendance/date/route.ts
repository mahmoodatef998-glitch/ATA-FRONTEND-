import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { UserRole, Prisma } from "@prisma/client";
import { normalizeDateToDubai } from "@/lib/attendance-service";
import { getUaeTime } from "@/lib/timezone-utils";
import { handleApiError, ValidationError } from "@/lib/error-handler";

/**
 * GET /api/attendance/date?date=YYYY-MM-DD
 * 
 * Returns all attendance records for a specific date
 * For supervisors/admins: returns all team members' attendance
 * For technicians: returns only their own attendance
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const dateParam = searchParams.get("date");
    const userIdParam = searchParams.get("userId");
    
    if (!dateParam) {
      throw new ValidationError(
        "Date parameter is required (format: YYYY-MM-DD)",
        [{ field: "date", message: "Date parameter is required" }]
      );
    }

    // Parse date (YYYY-MM-DD format)
    const [year, month, day] = dateParam.split("-").map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      throw new ValidationError(
        "Invalid date format. Use YYYY-MM-DD",
        [{ field: "date", message: "Invalid date format. Expected YYYY-MM-DD" }]
      );
    }

    // Create date object and normalize to Dubai timezone
    const targetDate = new Date(year, month - 1, day);
    const normalizedDate = normalizeDateToDubai(targetDate);

    // Build where clause
    const where: Prisma.attendanceWhereInput = {
      date: normalizedDate,
      status: "APPROVED",
      // Note: companyId will be used after migration is applied
      // For now, filter through users relation
    };

    // If userId is provided, filter by that user
    if (userIdParam) {
      const userId = parseInt(userIdParam);
      if (isNaN(userId)) {
        throw new ValidationError("Invalid userId", [{ field: "userId", message: "userId must be a number" }]);
      }
      where.userId = userId;
    } else {
      // Technicians can only see their own attendance
      if (session.user.role === UserRole.TECHNICIAN) {
        const userId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
        where.userId = userId;
      } else {
        // Supervisors and admins can see all team members' attendance
        where.users = {
          companyId: session.user.companyId,
          role: {
            in: ["TECHNICIAN", "SUPERVISOR", "OPERATIONS_MANAGER", "HR", "ACCOUNTANT"],
          },
        };
      }
    }

    // Fetch all attendance records for this date
    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            specialization: true,
          },
        },
        attendanceTasks: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                deadline: true,
                location: true,
                estimatedHours: true,
                actualHours: true,
              },
            },
          },
        },
      },
      orderBy: {
        checkInTime: "asc",
      },
    });

    // Debug: Log the query parameters and results
    if (process.env.NODE_ENV === "development") {
      console.log(`[Date API] Query for date: ${dateParam}`);
      console.log(`[Date API] Normalized date: ${normalizedDate.toISOString()}`);
      console.log(`[Date API] Found ${attendances.length} attendance records`);
      console.log(`[Date API] Users: ${attendances.map(a => a.users?.name || "Unknown").join(", ")}`);
    }

    // Calculate statistics
    const stats = {
      total: attendances.length,
      checkedIn: attendances.filter((a) => a.checkOutTime === null).length,
      checkedOut: attendances.filter((a) => a.checkOutTime !== null).length,
      totalHours: attendances.reduce((sum, a) => {
        if (a.checkOutTime && a.checkInTime) {
          const hours = (new Date(a.checkOutTime).getTime() - new Date(a.checkInTime).getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }
        return sum;
      }, 0),
      totalTasks: attendances.reduce((sum, a) => sum + (a.attendanceTasks?.length || 0), 0),
      completedTasks: attendances.reduce((sum, a) => {
        return sum + (a.attendanceTasks?.filter((at) => at.task?.status === "COMPLETED").length || 0);
      }, 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        date: dateParam,
        normalizedDate: normalizedDate.toISOString(),
        attendances,
        stats,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

