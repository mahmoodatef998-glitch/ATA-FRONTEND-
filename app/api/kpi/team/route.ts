import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { authorize } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { UserRole } from "@prisma/client";
import { getCached } from "@/lib/cache";

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
    const { userId, companyId } = await authorize(PermissionAction.REPORT_VIEW);

    // Only supervisors and admins can view team KPI
    if (session.user.role !== UserRole.SUPERVISOR && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // ✅ Performance: Create cache key with companyId and date filters
    const cacheKey = `kpi:team:${companyId}:${startDate || 'all'}:${endDate || 'all'}`;

    // ✅ Performance: Cache team KPI for 2 minutes
    const result = await getCached(
      cacheKey,
      async () => {
        // Build date filter
        const dateFilter: any = {};
        if (startDate) {
          dateFilter.gte = new Date(startDate);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          dateFilter.lte = end;
        }

        // Get all technicians in the company
    const technicians = await prisma.users.findMany({
      where: {
        companyId: session.user.companyId,
        role: UserRole.TECHNICIAN,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Calculate KPI for each technician
    const teamKPI = await Promise.all(
      technicians.map(async (technician) => {
        // Attendance
        const attendanceWhere: any = {
          userId: technician.id,
        };
        if (Object.keys(dateFilter).length > 0) {
          attendanceWhere.checkInTime = dateFilter;
        }

        const attendanceRecords = await prisma.attendance.findMany({
          where: attendanceWhere,
        });

        const totalDays = attendanceRecords.length;
        const daysPresent = attendanceRecords.filter((a) => a.checkOutTime !== null).length;
        const attendanceRate = totalDays > 0 ? (daysPresent / totalDays) * 100 : 0;

        // Total hours
        let totalHours = 0;
        attendanceRecords.forEach((record) => {
          if (record.checkOutTime) {
            const hours = (record.checkOutTime.getTime() - record.checkInTime.getTime()) / (1000 * 60 * 60);
            totalHours += hours;
          }
        });

        // Overtime
        const overtimeWhere: any = {
          userId: technician.id,
          approved: true,
        };
        if (Object.keys(dateFilter).length > 0) {
          overtimeWhere.date = dateFilter;
        }

        const overtimeRecords = await prisma.overtime.findMany({
          where: overtimeWhere,
        });

        const totalOvertimeHours = overtimeRecords.reduce((sum, record) => sum + record.hours, 0);

        // Tasks
        const tasksWhere: any = {
          assignedToId: technician.id,
          companyId: session.user.companyId,
        };
        if (Object.keys(dateFilter).length > 0) {
          tasksWhere.createdAt = dateFilter;
        }

        const allTasks = await prisma.tasks.findMany({
          where: tasksWhere,
        });

        const completedTasks = allTasks.filter((t) => t.status === "COMPLETED").length;
        const taskCompletionRate = allTasks.length > 0 ? (completedTasks / allTasks.length) * 100 : 0;

        // Average rating
        const reviews = await prisma.supervisor_reviews.findMany({
          where: {
            technicianId: technician.id,
            ...(Object.keys(dateFilter).length > 0 && {
              createdAt: dateFilter,
            }),
          },
        });

        const averageRating = reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : 0;

        return {
          user: technician,
          kpi: {
            attendanceRate: attendanceRate.toFixed(2),
            totalHours: totalHours.toFixed(2),
            overtimeHours: totalOvertimeHours.toFixed(2),
            tasksCompleted: completedTasks,
            tasksTotal: allTasks.length,
            taskCompletionRate: taskCompletionRate.toFixed(2),
            averageRating: averageRating.toFixed(2),
          },
        };
      })
    );

    // Calculate team averages
    const teamAverages = {
      attendanceRate: teamKPI.length > 0
        ? (teamKPI.reduce((sum, kpi) => sum + parseFloat(kpi.kpi.attendanceRate), 0) / teamKPI.length).toFixed(2)
        : "0.00",
      totalHours: teamKPI.length > 0
        ? (teamKPI.reduce((sum, kpi) => sum + parseFloat(kpi.kpi.totalHours), 0) / teamKPI.length).toFixed(2)
        : "0.00",
      overtimeHours: teamKPI.length > 0
        ? (teamKPI.reduce((sum, kpi) => sum + parseFloat(kpi.kpi.overtimeHours), 0) / teamKPI.length).toFixed(2)
        : "0.00",
      tasksCompleted: teamKPI.reduce((sum, kpi) => sum + kpi.kpi.tasksCompleted, 0),
      tasksTotal: teamKPI.reduce((sum, kpi) => sum + kpi.kpi.tasksTotal, 0),
      averageRating: teamKPI.length > 0
        ? (teamKPI.reduce((sum, kpi) => sum + parseFloat(kpi.kpi.averageRating), 0) / teamKPI.length).toFixed(2)
        : "0.00",
    };

        return {
          success: true,
          data: {
            team: teamKPI,
            averages: teamAverages,
            period: {
              startDate: startDate || null,
              endDate: endDate || null,
            },
          },
        };
      },
      120 // ✅ Performance: 2 minutes cache TTL
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Get team KPI error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get team KPI" },
      { status: 500 }
    );
  }
}

