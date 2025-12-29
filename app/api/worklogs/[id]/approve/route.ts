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
    const { userId, companyId } = await authorize(PermissionAction.TASK_COMPLETE);

    const { id } = await params;
    const workLogId = parseInt(id);

    const body = await request.json();
    const { approved = true } = body;

    const workLog = await prisma.work_logs.findUnique({
      where: { id: workLogId },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            companyId: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!workLog) {
      return NextResponse.json(
        { success: false, error: "Work log not found" },
        { status: 404 }
      );
    }

    // Verify work log belongs to same company
    if (workLog.tasks.companyId !== companyId) {
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

    const updatedWorkLog = await prisma.work_logs.update({
      where: { id: workLogId },
      data: {
        status: (approved ? "APPROVED" : "REJECTED") as any,
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
        tasks: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Notify technician
    await prisma.notifications.create({
      data: {
        companyId: companyId,
        userId: workLog.userId,
        title: `Work Log ${approved ? "Approved" : "Rejected"}`,
        body: `Your work log for task "${workLog.tasks.title}" has been ${approved ? "approved" : "rejected"}`,
        meta: {
          taskId: workLog.taskId,
          workLogId: workLog.id,
          type: approved ? "work_log_approved" : "work_log_rejected",
        },
      },
    });

    if (global.io) {
      global.io.to(`user_${workLog.userId}`).emit("new_notification", {
        title: `Work Log ${approved ? "Approved" : "Rejected"}`,
        body: `Your work log for task "${workLog.tasks.title}" has been ${approved ? "approved" : "rejected"}`,
        taskId: workLog.taskId,
        workLogId: workLog.id,
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedWorkLog,
      message: `Work log ${approved ? "approved" : "rejected"} successfully`,
    });
  } catch (error: any) {
    console.error("Approve work log error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to approve work log" },
      { status: 500 }
    );
  }
}

