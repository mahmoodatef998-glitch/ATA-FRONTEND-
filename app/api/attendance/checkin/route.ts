import { NextRequest, NextResponse } from "next/server";
import { handleApiError, ValidationError, ForbiddenError } from "@/lib/error-handler";

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

/**
 * @swagger
 * /api/attendance/checkin:
 *   post:
 *     summary: Check in for attendance
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lat
 *               - lng
 *             properties:
 *               lat:
 *                 type: number
 *                 description: Latitude coordinate
 *               lng:
 *                 type: number
 *                 description: Longitude coordinate
 *               location:
 *                 type: string
 *                 description: Location name/address
 *               attendanceType:
 *                 type: string
 *                 enum: [OFFICE, FIELD, REMOTE]
 *                 default: OFFICE
 *     responses:
 *       200:
 *         description: Check-in successful
 *       400:
 *         description: Validation error or already checked in
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only technicians can check in
 */
export async function POST(request: NextRequest) {
  try {
    const [
      { authorize },
      { PermissionAction },
      { requireAuth },
      { prisma },
      prismaClient,
      locationUtils,
      timezoneUtils,
      attendanceService,
      loggerModule,
    ] = await Promise.all([
      import("@/lib/rbac/authorize"),
      import("@/lib/permissions/role-permissions"),
      import("@/lib/auth-helpers"),
      import("@/lib/prisma"),
      import("@prisma/client"),
      import("@/lib/location-utils"),
      import("@/lib/timezone-utils"),
      import("@/lib/attendance-service"),
      import("@/lib/logger"),
    ]);

    const { UserRole, Prisma } = prismaClient;
    const { isWithinRadius, getCompanyLocation, calculateDistance } = locationUtils;
    const { getUaeTime } = timezoneUtils;
    const { normalizeDateToDubai } = attendanceService;
    const { logger } = loggerModule;

    // Check permission to create attendance (check-in)
    // All employees (except Admin) can check in
    const { userId, companyId } = await authorize(PermissionAction.ATTENDANCE_CLOCK);
    
    // Get session for user info
    const session = await requireAuth();

    const body = await request.json();
    const { lat, lng, location, attendanceType = "OFFICE" } = body;

    // Validate coordinates
    if (lat === undefined || lng === undefined || lat === null || lng === null) {
      throw new ValidationError("Location coordinates are required", [
        { field: "lat", message: "Latitude is required" },
        { field: "lng", message: "Longitude is required" },
      ]);
    }

    // Validate that lat and lng are valid numbers
    const latNum = Number(lat);
    const lngNum = Number(lng);
    
    if (isNaN(latNum) || isNaN(lngNum)) {
      throw new ValidationError("Invalid location coordinates. lat and lng must be valid numbers.", [
        { field: "lat", message: "Latitude must be a valid number" },
        { field: "lng", message: "Longitude must be a valid number" },
      ]);
    }

    // Validate coordinate ranges
    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      throw new ValidationError(
        "Invalid location coordinates. lat must be between -90 and 90, lng must be between -180 and 180.",
        [
          { field: "lat", message: "Latitude must be between -90 and 90" },
          { field: "lng", message: "Longitude must be between -180 and 180" },
        ]
      );
    }

    // Get UAE time
    const uaeTime = getUaeTime();

    // Normalize date to Dubai timezone (start of day) - same as what we'll use when creating
    const normalizedDate = normalizeDateToDubai(uaeTime);

    // Debug logging
    logger.debug("Check-in initiated", { 
      userId, 
      uaeTime: uaeTime.toISOString(), 
      normalizedDate: normalizedDate.toISOString(),
      context: "attendance" 
    });

    // Check if user already has attendance for this date (unique constraint on userId + date)
    // We check for ANY attendance on this date, not just unchecked-out ones
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: normalizedDate,
      },
    });

    if (existingAttendance) {
      logger.debug("Existing attendance found", { 
        attendanceId: existingAttendance.id, 
        hasCheckOut: existingAttendance.checkOutTime !== null,
        context: "attendance" 
      });
      if (existingAttendance.checkOutTime === null) {
        return NextResponse.json(
          { success: false, error: "You are already checked in. Please check out first." },
          { status: 400 }
        );
      } else {
        // User already checked out today - delete the old record and allow new check-in
        // This allows users to check in again after checking out (e.g., after lunch break)
        logger.info("Deleting old checked-out attendance record to allow new check-in", { 
          attendanceId: existingAttendance.id,
          context: "attendance" 
        });
        await prisma.attendance.delete({
          where: { id: existingAttendance.id },
        });
      }
    }

    // Get company settings and location
    let companySettings, companyLocation;
    try {
      [companySettings, companyLocation] = await Promise.all([
        prisma.company_settings.findUnique({
          where: { companyId: companyId },
        }),
        getCompanyLocation(companyId),
      ]);
    } catch (error) {
      logger.error("Error fetching company settings/location", error, "attendance");
      // Use default location if error occurs
      companySettings = null;
      companyLocation = { lat: 25.357529, lng: 55.473482 };
    }

    // Ensure companyLocation is always available
    if (!companyLocation) {
      logger.warn("Company location not found, using default", {
        companyId: companyId,
        context: "attendance",
      });
      companyLocation = { lat: 25.357529, lng: 55.473482 };
    }

    let attendanceStatus: "PENDING" | "APPROVED" | "REJECTED" = "APPROVED";
    let requiresApproval = false;

    // Validate location if company has location settings
    let locationValidation: {
      valid: boolean;
      distance?: number;
      message?: string;
    } = { valid: true };

    if (companyLocation && companySettings && companySettings.checkInRadius) {
      try {
        // Log all values before calculation for debugging
        logger.info("📍 Location Validation - Before Calculation", {
          userLocation: { lat: latNum, lng: lngNum },
          companyLocation: { lat: companyLocation.lat, lng: companyLocation.lng },
          checkInRadius: companySettings.checkInRadius,
          companyId: session.user.companyId,
          context: "attendance",
        });

        const distance = calculateDistance(
          latNum,
          lngNum,
          companyLocation.lat,
          companyLocation.lng
        );

        // Add small tolerance buffer (50 meters) for high-precision location matching
        // This accounts for minor GPS accuracy variations while maintaining precision
        const toleranceBuffer = 50; // meters (reduced for higher precision)
        const effectiveRadius = companySettings.checkInRadius + toleranceBuffer;

        // Log distance calculation result for debugging
        logger.info("📍 Location Validation - After Calculation", {
          userLocation: { lat: latNum, lng: lngNum },
          officeLocation: { lat: companyLocation.lat, lng: companyLocation.lng },
          distance: distance,
          distanceInMeters: `${distance.toFixed(2)}m`,
          checkInRadius: companySettings.checkInRadius,
          toleranceBuffer: toleranceBuffer,
          effectiveRadius: effectiveRadius,
          isWithinRadius: distance <= effectiveRadius,
          context: "attendance",
        });

        const isWithin = distance <= effectiveRadius;

        locationValidation = {
          valid: isWithin,
          distance: Math.round(distance),
          message: isWithin
            ? `You are within the allowed radius (${Math.round(distance)}m from office)`
            : `You are outside the allowed radius (${Math.round(distance)}m from office, allowed: ${companySettings.checkInRadius}m with ${toleranceBuffer}m tolerance)`,
        };

        if (!isWithin) {
          // Outside radius - reject direct check-in, require request
          return NextResponse.json(
            {
              success: false,
              error: "You are outside the allowed radius",
              message: `You are ${Math.round(distance)}m from the office (allowed: ${companySettings.checkInRadius}m with ${toleranceBuffer}m tolerance). Please use "Request Check-in" button instead.`,
              locationValidation,
              requiresRequest: true,
            },
            { status: 400 }
          );
        }
      } catch (error) {
        logger.error("Error validating location", error, "attendance");
        locationValidation = {
          valid: false,
          message: "Error validating location. Check-in approved automatically.",
        };
        // If location validation fails, approve automatically
        attendanceStatus = "APPROVED";
      }
    }

    // normalizedDate was already calculated above for checking existing attendance
    // Create attendance record with error handling for unique constraint
    let attendance;
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount < maxRetries) {
      try {
        attendance = await prisma.attendance.create({
          data: {
            userId,
            companyId: companyId, // Required: set companyId from authorize
            date: normalizedDate, // Normalized day in UTC+4
            checkInTime: uaeTime, // Use UAE time
            checkInLat: latNum,
            checkInLng: lngNum,
            checkInLocation: location || null,
            attendanceType: attendanceType as any,
            status: attendanceStatus,
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
        break; // Success, exit loop
      } catch (error) {
        // Handle unique constraint violation
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          const target = error.meta?.target as string[] | undefined;
          if (target?.includes("date")) {
            logger.warn("Unique constraint violation during check-in", { 
              attempt: retryCount + 1,
              userId,
              date: normalizedDate.toISOString(),
              context: "attendance" 
            });
            // Double-check if attendance exists
            const existing = await prisma.attendance.findFirst({
              where: {
                userId,
                date: normalizedDate,
              },
            });
            
            if (existing) {
              if (existing.checkOutTime === null) {
                throw new ValidationError("You are already checked in. Please check out first.");
              } else {
                // User already checked out today - delete the old record and retry
                logger.info("Deleting old checked-out record and retrying", { 
                  attendanceId: existing.id,
                  context: "attendance" 
                });
                await prisma.attendance.delete({
                  where: { id: existing.id },
                });
                retryCount++;
                continue; // Retry creating attendance
              }
            }
          }
        }
        
        // Re-throw other errors
        logger.error("Error creating attendance record", error, "attendance");
        throw error;
      }
    }
    
    if (!attendance) {
      return NextResponse.json(
        { success: false, error: "Failed to create attendance record after retries" },
        { status: 500 }
      );
    }

    // If requires approval, notify admin
    if (requiresApproval) {
      // Create notification for admin
      const adminUsers = await prisma.users.findMany({
        where: {
          companyId: companyId,
          role: UserRole.ADMIN,
        },
        select: { id: true },
      });

      for (const admin of adminUsers) {
        await prisma.notifications.create({
          data: {
            companyId: companyId,
            userId: admin.id,
            title: "Attendance Request Pending Approval",
            body: `${session.user.name} checked in from outside the allowed radius. Location: ${location || "Unknown"}`,
            meta: {
              attendanceId: attendance.id,
              type: "attendance_approval",
            },
          },
        });
      }

      // Emit Socket.io event
      if (global.io) {
        global.io.to(`company_${companyId}`).emit("attendance_pending", {
          attendanceId: attendance.id,
          userId,
          userName: session.user.name,
          location,
        });
      }
    } else {
      // Emit Socket.io event for real-time updates
      if (global.io) {
        global.io.to(`company_${companyId}`).emit("attendance_updated", {
          userId,
          userName: session.user.name,
          action: "check_in",
          timestamp: uaeTime,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: attendance,
      message: requiresApproval
        ? "Check-in request submitted. Waiting for admin approval."
        : "Checked in successfully",
      requiresApproval,
      locationValidation,
    });
  } catch (error: any) {
    try {
      const { logger } = await import("@/lib/logger");
      logger.error("Check-in API error", error, "attendance");
    } catch {
      console.error("Check-in API error:", error);
    }
    return handleApiError(error);
  }
}

