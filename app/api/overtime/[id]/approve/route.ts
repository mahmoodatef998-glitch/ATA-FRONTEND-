import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { authorize } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { UserRole } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { userId, companyId } = await authorize(PermissionAction.ATTENDANCE_MANAGE);

    const { id } = await params;
    const overtimeId = parseInt(id);
    // userId already defined from authorize() above

    const body = await request.json();
    const { approved = true } = body;

    const overtime = await prisma.overtime.findUnique({
      where: { id: overtimeId },
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

    if (!overtime) {
      return NextResponse.json(
        { success: false, error: "Overtime record not found" },
        { status: 404 }
      );
    }

    // Verify overtime belongs to same company
    if (overtime.users.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Only supervisors and admins can approve
    if (session.user.role !== UserRole.SUPERVISOR && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    const updatedOvertime = await prisma.overtime.update({
      where: { id: overtimeId },
      data: {
        approved,
        approvedById: userId,
        approvedAt: new Date(),
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

    // Notify technician
    await prisma.notifications.create({
      data: {
        companyId: companyId,
        userId: overtime.userId,
        title: `Overtime ${approved ? "Approved" : "Rejected"}`,
        body: `Your overtime request for ${overtime.hours} hours on ${new Date(overtime.date).toLocaleDateString()} has been ${approved ? "approved" : "rejected"}`,
        meta: {
          overtimeId: overtime.id,
          type: approved ? "overtime_approved" : "overtime_rejected",
        },
      },
    });

    if (global.io) {
      global.io.to(`user_${overtime.userId}`).emit("new_notification", {
        title: `Overtime ${approved ? "Approved" : "Rejected"}`,
        body: `Your overtime request has been ${approved ? "approved" : "rejected"}`,
        overtimeId: overtime.id,
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedOvertime,
      message: `Overtime ${approved ? "approved" : "rejected"} successfully`,
    });
  } catch (error: any) {
    console.error("Approve overtime error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to approve overtime" },
      { status: 500 }
    );
  }
}

