import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/attendance/latest-month?userId=&month=&year=
 * 
 * Returns attendances for the latest month (or specified month) for a user.
 * Only returns days where the user attended.
 * Attendances are ordered DESC by date (newest first).
 */
export async function GET(request: NextRequest) {
  try {
    // Build-time probe safe response (avoid auth/prisma during Next build probes)
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return NextResponse.json({ success: true, ok: true }, { status: 200 });
    }

    const [{ requireAuth }, prismaClient, attendanceService] = await Promise.all([
      import("@/lib/auth-helpers"),
      import("@prisma/client"),
      import("@/lib/attendance-service"),
    ]);
    const { UserRole } = prismaClient;
    const { getLatestMonthAttendances, calculateDailyPerformanceScore } =
      attendanceService;

    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const userIdParam = searchParams.get("userId");
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    // Determine target user
    let targetUserId: number;
    if (userIdParam && (session.user.role === UserRole.SUPERVISOR || session.user.role === UserRole.ADMIN)) {
      targetUserId = parseInt(userIdParam);
    } else {
      targetUserId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
    }

    // Parse month/year if provided
    const month = monthParam ? parseInt(monthParam) : undefined;
    const year = yearParam ? parseInt(yearParam) : undefined;

    const result = await getLatestMonthAttendances(targetUserId, month, year);

    if (!result) {
      return NextResponse.json({
        success: true,
        data: {
          monthStart: null,
          monthEnd: null,
          attendances: [],
        },
      });
    }

    // Calculate performance scores for each attendance
    const attendancesWithScores = result.attendances.map((attendance) => {
      const performanceScore = calculateDailyPerformanceScore(attendance);
      return {
        ...attendance,
        performanceScore,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        monthStart: result.monthStart.toISOString(),
        monthEnd: result.monthEnd.toISOString(),
        attendances: attendancesWithScores.map((att) => ({
          id: att.id,
          userId: att.userId,
          date: att.date.toISOString(),
          checkInTime: att.checkInTime.toISOString(),
          checkOutTime: att.checkOutTime?.toISOString() || null,
          checkInLocation: att.checkInLocation,
          checkOutLocation: att.checkOutLocation,
          status: att.status,
          performanceScore: att.performanceScore,
          attendanceTasks: att.attendanceTasks.map((at: any) => ({
            id: at.id,
            taskId: at.taskId,
            performedAt: at.performedAt?.toISOString() || null,
            completedAt: at.completedAt?.toISOString() || null,
            status: at.status,
            performance: at.performance,
            note: at.note,
            task: {
              id: at.task.id,
              title: at.task.title,
              description: at.task.description,
              priority: at.task.priority,
              deadline: at.task.deadline?.toISOString() || null,
            },
            assignedBy: at.assignedBy
              ? {
                  id: at.assignedBy.id,
                  name: at.assignedBy.name,
                  email: at.assignedBy.email,
                }
              : null,
          })),
          user: {
            id: att.users.id,
            name: att.users.name,
            email: att.users.email,
          },
        })),
      },
    });
  } catch (error: any) {
    console.error("Get latest month attendances error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get latest month attendances",
      },
      { status: 500 }
    );
  }
}

