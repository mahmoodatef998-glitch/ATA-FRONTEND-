import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  // Build-time probe safe response (avoid auth/prisma during Next build probes)
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return NextResponse.json({ success: true, ok: true }, { status: 200 });
  }
  return NextResponse.json(
    { success: true, message: "Endpoint requires POST; probe handled." },
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const [
      { authorize },
      { PermissionAction },
      { requireAuth },
      { prisma },
      prismaClient,
      timezoneUtils,
      attendanceService,
      locationUtils,
      loggerModule,
    ] = await Promise.all([
      import("@/lib/rbac/authorize"),
      import("@/lib/permissions/role-permissions"),
      import("@/lib/auth-helpers"),
      import("@/lib/prisma"),
      import("@prisma/client"),
      import("@/lib/timezone-utils"),
      import("@/lib/attendance-service"),
      import("@/lib/location-utils"),
      import("@/lib/logger"),
    ]);

    const { UserRole } = prismaClient;
    const { getUaeTime } = timezoneUtils;
    const { normalizeDateToDubai } = attendanceService;
    const { calculateDistance, getCompanyLocation } = locationUtils;
    const { logger } = loggerModule;

    // Require authentication
    // Check permission to create attendance (check-in)
    // All employees (except Admin) can request check-in
    const { userId, companyId } = await authorize(PermissionAction.ATTENDANCE_CLOCK);
    
    // Get session for user info
    const session = await requireAuth();

    const body = await request.json();
    const { lat, lng, location, attendanceType = "OFFICE", reason } = body;

    // Validate coordinates
    if (lat === undefined || lng === undefined || lat === null || lng === null) {
      return NextResponse.json(
        { success: false, error: "Location coordinates are required" },
        { status: 400 }
      );
    }

    // Validate that lat and lng are valid numbers
    const latNum = Number(lat);
    const lngNum = Number(lng);
    
    if (isNaN(latNum) || isNaN(lngNum)) {
      return NextResponse.json(
        { success: false, error: "Invalid location coordinates. lat and lng must be valid numbers." },
        { status: 400 }
      );
    }

    // Validate coordinate ranges
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      return NextResponse.json(
        { success: false, error: "Invalid location coordinates. lat must be between -90 and 90, lng must be between -180 and 180." },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Reason is required for check-in request" },
        { status: 400 }
      );
    }

    // Get UAE time
    const uaeTime = getUaeTime();

    // Normalize date to Dubai timezone (start of day) - same as what we'll use when creating
    const normalizedDate = normalizeDateToDubai(uaeTime);

    // Check if user already checked in today using the date field (matches unique constraint)
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: normalizedDate,
        checkOutTime: null,
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        { success: false, error: "You are already checked in. Please check out first." },
        { status: 400 }
      );
    }

    // Get company location and settings
    const [companySettings, companyLocation] = await Promise.all([
      prisma.company_settings.findUnique({
        where: { companyId: companyId },
      }),
      getCompanyLocation(companyId),
    ]).catch((error) => {
      logger.error("Error fetching company settings/location", error, "attendance");
      return [null, null];
    });

    let distance = 0;
    if (companyLocation && companySettings && companySettings.checkInRadius) {
      try {
        distance = calculateDistance(
          lat,
          lng,
          companyLocation.lat,
          companyLocation.lng
        );
      } catch (error) {
        logger.error("Error calculating distance", error, "attendance");
      }
    }

    // normalizedDate was already calculated above for checking existing attendance
    // Create attendance record with PENDING status
    const attendance = await prisma.attendance.create({
      data: {
        userId,
        companyId: companyId, // Required: set companyId from authorize
        date: normalizedDate, // Normalized day in UTC+4
        checkInTime: uaeTime,
        checkInLat: latNum,
        checkInLng: lngNum,
        checkInLocation: location || null,
        attendanceType: attendanceType as any,
        status: "PENDING",
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create notification for admin and supervisors
    const adminUsers = await prisma.users.findMany({
      where: {
        companyId: companyId,
        role: {
          in: [UserRole.ADMIN, UserRole.SUPERVISOR],
        },
      },
      select: { id: true },
    });

    for (const admin of adminUsers) {
      await prisma.notifications.create({
        data: {
          companyId: companyId,
          userId: admin.id,
          title: "Check-in Request Pending Approval",
          body: `${session.user.name} requested to check in from outside the allowed radius. Reason: ${reason}. Distance: ${Math.round(distance)}m`,
          meta: {
            attendanceId: attendance.id,
            type: "attendance_request",
            reason: reason,
            distance: Math.round(distance),
          },
        },
      });
    }

    // Emit Socket.io event
    if (global.io) {
      global.io.to(`company_${companyId}`).emit("attendance_request", {
        attendanceId: attendance.id,
        userId,
        userName: session.user.name,
        location,
        reason,
        distance: Math.round(distance),
      });
    }

    return NextResponse.json({
      success: true,
      data: attendance,
      message: "Check-in request submitted successfully. Waiting for admin approval.",
      distance: Math.round(distance),
    });
  } catch (error: any) {
    try {
      const { logger } = await import("@/lib/logger");
      logger.error("[Request Check-in API] Error", error, "attendance");
    } catch {
      console.error("[Request Check-in API] Error:", error);
    }
    
    // Handle Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: "You already have a check-in record for today. Please check out first.",
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to submit check-in request",
      },
      { status: 500 }
    );
  }
}

