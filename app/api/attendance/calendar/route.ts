import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/attendance/calendar?userId=&month=&year=
 * 
 * Returns per-day summary for calendar badges.
 * Used for displaying calendar view with present/absent/partial indicators.
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
    const { getCalendarSummary } = attendanceService;

    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const userIdParam = searchParams.get("userId");
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    if (!monthParam || !yearParam) {
      return NextResponse.json(
        { success: false, error: "Month and year are required" },
        { status: 400 }
      );
    }

    // Determine target user
    let targetUserId: number;
    if (userIdParam && (session.user.role === UserRole.SUPERVISOR || session.user.role === UserRole.ADMIN)) {
      targetUserId = parseInt(userIdParam);
    } else {
      targetUserId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
    }

    const month = parseInt(monthParam);
    const year = parseInt(yearParam);

    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: "Invalid month or year" },
        { status: 400 }
      );
    }

    const calendar = await getCalendarSummary(targetUserId, year, month);

    return NextResponse.json({
      success: true,
      data: {
        year,
        month,
        calendar,
      },
    });
  } catch (error: any) {
    console.error("Get calendar summary error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get calendar summary",
      },
      { status: 500 }
    );
  }
}
