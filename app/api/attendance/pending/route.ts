import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    // Build-time probe safe response (avoid auth/prisma during Next build probes)
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return NextResponse.json({ success: true, ok: true }, { status: 200 });
    }

    const [{ prisma }, { requireRole }, { UserRole }] = await Promise.all([
      import("@/lib/prisma"),
      import("@/lib/auth-helpers"),
      import("@prisma/client"),
    ]);

    // Allow both ADMIN and SUPERVISOR to view pending requests
    const session = await requireRole([UserRole.ADMIN, UserRole.SUPERVISOR]);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");
    const skip = (page - 1) * limit;

    // Get pending attendance requests
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        status: "PENDING",
        users: {
          companyId: session.user.companyId,
        },
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
      orderBy: {
        checkInTime: "desc",
      },
      skip,
      take: limit,
    });

    // Get notifications to extract reason and distance
    // Fetch all attendance request notifications for this company
    // We search by body content since Prisma doesn't support JSON field queries easily
    const allNotifications = await prisma.notifications.findMany({
      where: {
        companyId: session.user.companyId,
        body: {
          contains: "requested to check in",
        },
      },
      select: {
        id: true,
        meta: true,
        body: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Limit to recent notifications
    });

    // Map attendance records with their notification meta
    const attendanceWithMeta = attendanceRecords.map((record) => {
      // Find notification that matches this attendance ID
      const notification = allNotifications.find((notif) => {
        const meta = notif.meta as any;
        return meta?.attendanceId === record.id;
      });

      // Extract reason and distance from notification meta or body
      let reason = "";
      let distance = 0;
      
      if (notification) {
        const meta = notification.meta as any;
        reason = meta?.reason || "";
        distance = meta?.distance || 0;
        
        // If not in meta, try to extract from body
        if (!reason && notification.body) {
          const reasonMatch = notification.body.match(/Reason:\s*(.+?)(?:\.|Distance|$)/i);
          if (reasonMatch) {
            reason = reasonMatch[1].trim();
          }
          const distanceMatch = notification.body.match(/Distance:\s*(\d+)m/i);
          if (distanceMatch) {
            distance = parseInt(distanceMatch[1], 10);
          }
        }
      }

      return {
        ...record,
        meta: {
          reason,
          distance,
        },
      };
    });

    const total = await prisma.attendance.count({
      where: {
        status: "PENDING",
        users: {
          companyId: session.user.companyId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        attendance: attendanceWithMeta,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    logger.error("Get pending attendance error", error, "attendance");
    return handleApiError(error);
  }
}

