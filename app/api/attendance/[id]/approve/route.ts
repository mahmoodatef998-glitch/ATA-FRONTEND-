import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { getUaeTime } from "@/lib/timezone-utils";
import { createAuditLog, AuditAction, AuditResource, getAuditContext } from "@/lib/rbac/audit-logger";
import { handleApiError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Allow both ADMIN and SUPERVISOR to approve
    const session = await requireRole([UserRole.ADMIN, UserRole.SUPERVISOR]);
    const { id } = await params;
    const attendanceId = parseInt(id);

    if (isNaN(attendanceId)) {
      return NextResponse.json(
        { success: false, error: "Invalid attendance ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { approved, rejectionReason } = body;

    if (approved === undefined) {
      return NextResponse.json(
        { success: false, error: "Approval status is required" },
        { status: 400 }
      );
    }

    // Get attendance record
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            companyId: true,
          },
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found" },
        { status: 404 }
      );
    }

    // Check company access
    if (attendance.users.companyId !== session.user.companyId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get old status for audit log
    const oldStatus = attendance.status;

    // Update attendance status
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status: approved ? "APPROVED" : "REJECTED",
        approvedById: session.user.id,
        approvedAt: getUaeTime(),
        rejectionReason: approved ? null : (rejectionReason || "Rejected by admin"),
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

    // Audit log
    const auditContext = getAuditContext(request);
    await createAuditLog({
      companyId: session.user.companyId,
      userId: typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: approved ? AuditAction.ATTENDANCE_APPROVED : AuditAction.ATTENDANCE_REJECTED,
      resource: AuditResource.ATTENDANCE,
      resourceId: attendanceId,
      details: {
        attendanceUserId: attendance.userId,
        attendanceUserName: attendance.users.name,
        oldStatus,
        newStatus: approved ? "APPROVED" : "REJECTED",
        rejectionReason: approved ? null : rejectionReason,
      },
      ...auditContext,
    });

    // Create notification for technician
    await prisma.notifications.create({
      data: {
        companyId: session.user.companyId,
        userId: attendance.userId,
        title: approved ? "Attendance Approved" : "Attendance Rejected",
        body: approved
          ? "Your check-in request has been approved."
          : `Your check-in request has been rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}`,
        meta: {
          attendanceId: attendanceId,
          type: "attendance_approval",
        },
      },
    });

    // Emit Socket.io event to the specific user and company room
    if (global.io) {
      const eventData = {
        attendanceId,
        approved,
        message: approved ? "Your check-in has been approved" : "Your check-in has been rejected",
        checkInTime: updatedAttendance.checkInTime,
        checkInLocation: updatedAttendance.checkInLocation,
      };
      
      // Emit to user-specific room
      global.io.to(`user_${attendance.userId}`).emit("attendance_approved", eventData);
      
      // Also emit to company room for real-time updates
      global.io.to(`company_${session.user.companyId}`).emit("attendance_updated", {
        userId: attendance.userId,
        userName: attendance.users.name,
        action: approved ? "check_in_approved" : "check_in_rejected",
        attendanceId,
        timestamp: getUaeTime(),
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedAttendance,
      message: approved ? "Attendance approved successfully" : "Attendance rejected",
    });
  } catch (error: any) {
    logger.error("Approve attendance error", error, "attendance");
    return handleApiError(error);
  }
}

