import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { authorize } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { userId: authUserId, companyId } = await authorize(PermissionAction.REPORT_VIEW);

    // Debug logging
    console.log("[KPI API] Session user:", {
      id: session.user.id,
      role: session.user.role,
      companyId: session.user.companyId,
      idType: typeof session.user.id,
    });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

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

    // Technicians can only view their own KPI
    let targetUserId: number | null = null;
    if (session.user.role === UserRole.TECHNICIAN) {
      // For technicians, use their own ID
      const sessionUserId = session.user.id;
      console.log("[KPI API] Technician session userId:", sessionUserId, "type:", typeof sessionUserId);
      
      if (sessionUserId === undefined || sessionUserId === null) {
        console.error("[KPI API] User ID is undefined or null in session");
        return NextResponse.json(
          { success: false, error: "User ID not found in session" },
          { status: 400 }
        );
      }
      
      if (typeof sessionUserId === "string") {
        const parsed = parseInt(sessionUserId, 10);
        if (isNaN(parsed)) {
          console.error("[KPI API] Failed to parse user ID:", sessionUserId);
          return NextResponse.json(
            { success: false, error: "Invalid user ID format" },
            { status: 400 }
          );
        }
        targetUserId = parsed;
      } else if (typeof sessionUserId === "number") {
        targetUserId = sessionUserId;
      } else {
        console.error("[KPI API] Unexpected user ID type:", typeof sessionUserId, sessionUserId);
        return NextResponse.json(
          { success: false, error: "User ID not found in session" },
          { status: 400 }
        );
      }
      
      console.log("[KPI API] Resolved targetUserId:", targetUserId);
    } else if (userId) {
      // For supervisors/admins, they can specify userId
      const parsedUserId = parseInt(userId);
      if (isNaN(parsedUserId)) {
        return NextResponse.json(
          { success: false, error: "Invalid user ID" },
          { status: 400 }
        );
      }
      targetUserId = parsedUserId;
    } else {
      // If no userId provided and not a technician, use session user ID as fallback
      // This allows admins/supervisors to view their own KPI if no userId is specified
      const sessionUserId = session.user.id;
      if (sessionUserId === undefined || sessionUserId === null) {
        return NextResponse.json(
          { success: false, error: "User ID is required" },
          { status: 400 }
        );
      }
      
      if (typeof sessionUserId === "string") {
        const parsed = parseInt(sessionUserId, 10);
        if (isNaN(parsed)) {
          return NextResponse.json(
            { success: false, error: "Invalid user ID format" },
            { status: 400 }
          );
        }
        targetUserId = parsed;
      } else if (typeof sessionUserId === "number") {
        targetUserId = sessionUserId;
      } else {
        return NextResponse.json(
          { success: false, error: "User ID is required" },
          { status: 400 }
        );
      }
    }

    // Get user info
    const user = await prisma.users.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        companyId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Verify company access
    if (user.companyId !== session.user.companyId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: User belongs to different company" },
        { status: 403 }
      );
    }

    // Calculate attendance KPI
    const attendanceWhere: any = {
      userId: targetUserId,
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

    // Calculate total hours worked
    let totalHours = 0;
    attendanceRecords.forEach((record) => {
      if (record.checkOutTime) {
        const hours = (record.checkOutTime.getTime() - record.checkInTime.getTime()) / (1000 * 60 * 60);
        totalHours += hours;
      }
    });

    // Calculate overtime
    const overtimeWhere: any = {
      userId: targetUserId,
      approved: true,
    };
    if (Object.keys(dateFilter).length > 0) {
      overtimeWhere.date = dateFilter;
    }

    const overtimeRecords = await prisma.overtime.findMany({
      where: overtimeWhere,
    });

    const totalOvertimeHours = overtimeRecords.reduce((sum, record) => sum + record.hours, 0);

    // Calculate task completion
    const tasksWhere: any = {
      assignedToId: targetUserId,
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

    // Calculate average rating
    let reviews: any[] = [];
    try {
      reviews = await prisma.supervisor_reviews.findMany({
        where: {
          technicianId: targetUserId,
          ...(Object.keys(dateFilter).length > 0 && {
            createdAt: dateFilter,
          }),
        },
      });
    } catch (error: any) {
      console.error("[KPI API] Error fetching reviews:", error);
      // If reviews table doesn't exist or has issues, continue with empty array
      reviews = [];
    }

    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    // Calculate overall score (weighted)
    const overallScore =
      attendanceRate * 0.3 +
      taskCompletionRate * 0.3 +
      (averageRating / 5) * 100 * 0.2 +
      (totalHours > 0 ? Math.min((totalHours / (allTasks.length * 8)) * 100, 100) : 0) * 0.2;

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        kpi: {
          attendance: {
            totalDays,
            daysPresent,
            attendanceRate: attendanceRate.toFixed(2),
          },
          hours: {
            totalHours: totalHours.toFixed(2),
            overtimeHours: totalOvertimeHours.toFixed(2),
            averageHoursPerDay: totalDays > 0 ? (totalHours / totalDays).toFixed(2) : 0,
          },
          tasks: {
            total: allTasks.length,
            completed: completedTasks,
            inProgress: allTasks.filter((t) => t.status === "IN_PROGRESS").length,
            pending: allTasks.filter((t) => t.status === "PENDING").length,
            completionRate: taskCompletionRate.toFixed(2),
          },
          performance: {
            averageRating: averageRating.toFixed(2),
            totalReviews: reviews.length,
          },
          overallScore: overallScore.toFixed(2),
        },
        period: {
          startDate: startDate || null,
          endDate: endDate || null,
        },
      },
    });
  } catch (error: any) {
    console.error("[KPI API] Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === "development"
      ? `${error.message} (${error.name})`
      : error.message || "Failed to get KPI";
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        ...(process.env.NODE_ENV === "development" && {
          details: error.stack,
        }),
      },
      { status: 500 }
    );
  }
}

