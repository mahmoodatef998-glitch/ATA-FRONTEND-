import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/error-handler";

export async function GET() {
  try {
    // Build-time probe safe response (avoid auth/prisma during Next build probes)
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return NextResponse.json({ success: true, ok: true }, { status: 200 });
    }

    const [
      { prisma },
      { requireAuth },
      prismaClient,
      attendanceService,
      timezoneUtils,
    ] = await Promise.all([
      import("@/lib/prisma"),
      import("@/lib/auth-helpers"),
      import("@prisma/client"),
      import("@/lib/attendance-service"),
      import("@/lib/timezone-utils"),
    ]);
    const { UserRole } = prismaClient;
    const { normalizeDateToDubai } = attendanceService;
    const { getUaeTime } = timezoneUtils;

    const session = await requireAuth();
    const userId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;

    // All employees (except Admin) can view their own attendance status
    if (session.user.role === UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Admins cannot view attendance status" },
        { status: 403 }
      );
    }

    // Get today's normalized date in Dubai timezone
    const uaeTime = getUaeTime();
    const normalizedDate = normalizeDateToDubai(uaeTime);

    // Find today's attendance using date field (matches unique constraint)
    const attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: normalizedDate,
        status: "APPROVED", // Only consider APPROVED attendance as checked in
      },
      orderBy: {
        checkInTime: "desc",
      },
    });

    if (!attendance) {
      // Check if there's a PENDING request
      const pendingAttendance = await prisma.attendance.findFirst({
        where: {
          userId,
          date: normalizedDate,
          status: "PENDING",
        },
        orderBy: {
          checkInTime: "desc",
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          checkedIn: false,
          checkInTime: null,
          checkOutTime: null,
          hasPendingRequest: !!pendingAttendance,
          pendingRequestId: pendingAttendance?.id || null,
        },
      });
    }

    const isCheckedIn = attendance.checkOutTime === null && attendance.status === "APPROVED";
    let hoursWorked = 0;

    if (attendance.checkOutTime) {
      hoursWorked = (attendance.checkOutTime.getTime() - attendance.checkInTime.getTime()) / (1000 * 60 * 60);
    } else {
      // Calculate hours from check-in to now
      hoursWorked = (new Date().getTime() - attendance.checkInTime.getTime()) / (1000 * 60 * 60);
    }

    return NextResponse.json({
      success: true,
      data: {
        checkedIn: isCheckedIn,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        checkInLocation: attendance.checkInLocation,
        checkOutLocation: attendance.checkOutLocation,
        hoursWorked: hoursWorked.toFixed(2),
        attendanceType: attendance.attendanceType,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[Attendance Status API] Error:", error);
    }
    return handleApiError(error);
  }
}

