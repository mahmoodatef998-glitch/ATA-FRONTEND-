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
    const [{ prisma }, { requireAuth }, prismaClient, timezoneUtils, locationUtils] =
      await Promise.all([
        import("@/lib/prisma"),
        import("@/lib/auth-helpers"),
        import("@prisma/client"),
        import("@/lib/timezone-utils"),
        import("@/lib/location-utils"),
      ]);

    const { UserRole } = prismaClient;
    const { getUaeTime } = timezoneUtils;
    const { getCompanyLocation, isWithinRadius } = locationUtils;

    const session = await requireAuth();
    const userId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;

    // All employees (except Admin) can check out
    if (session.user.role === UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Admins cannot check out" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { lat, lng, location } = body;

    if (!lat || !lng) {
      return NextResponse.json(
        { success: false, error: "Location coordinates are required" },
        { status: 400 }
      );
    }

    // Get UAE time
    const uaeTime = getUaeTime();

    // Find today's check-in (UAE time)
    const today = new Date(uaeTime);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        checkInTime: {
          gte: today,
          lt: tomorrow,
        },
        checkOutTime: null,
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { success: false, error: "No active check-in found. Please check in first." },
        { status: 400 }
      );
    }

    const checkOutTime = uaeTime; // Use UAE time
    const checkInTime = attendance.checkInTime;
    const hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

    // Get company settings and location
    const [companySettings, companyLocation] = await Promise.all([
      prisma.company_settings.findUnique({
        where: { companyId: session.user.companyId },
      }),
      getCompanyLocation(session.user.companyId),
    ]);

    const workingHours = companySettings?.workingHours || 8.0;
    const overtimeThreshold = companySettings?.overtimeThreshold || 0.5;

    // Validate checkout location if company has location settings
    // Note: Checkout is always allowed, but location is logged for audit purposes
    // Tolerance buffer is automatically applied by isWithinRadius function
    if (companyLocation && companySettings) {
      const withinRadius = isWithinRadius(
        lat,
        lng,
        companyLocation.lat,
        companyLocation.lng,
        companySettings.checkInRadius
      );

      // Location is logged but doesn't block checkout
      // This is for audit purposes only
      if (!withinRadius && attendance.status === "APPROVED") {
        // Outside radius but was approved - might need review
        // For now, allow checkout but could add approval logic here
      }
    }

    // Update attendance with check-out
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOutTime,
        checkOutLat: lat,
        checkOutLng: lng,
        checkOutLocation: location || null,
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

    // Calculate and create overtime if applicable
    if (hoursWorked > workingHours) {
      const overtimeHours = hoursWorked - workingHours;
      if (overtimeHours >= overtimeThreshold) {
        await prisma.overtime.create({
          data: {
            userId,
            date: today,
            hours: overtimeHours,
            reason: `Automatic overtime calculation - worked ${hoursWorked.toFixed(2)} hours`,
            approved: false, // Requires supervisor approval
          },
        });
      }
    }

    // Emit Socket.io event for real-time updates
    if (global.io) {
      global.io.to(`company_${session.user.companyId}`).emit("attendance_updated", {
        userId,
        userName: session.user.name,
        action: "check_out",
        hoursWorked: hoursWorked.toFixed(2),
        timestamp: checkOutTime,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedAttendance,
        hoursWorked: hoursWorked.toFixed(2),
        overtimeHours: hoursWorked > workingHours ? (hoursWorked - workingHours).toFixed(2) : 0,
      },
      message: "Checked out successfully",
    });
  } catch (error: any) {
    console.error("Check-out error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check out" },
      { status: 500 }
    );
  }
}

