import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getAttendanceDetails, calculateDailyPerformanceScore } from "@/lib/attendance-service";

/**
 * GET /api/attendance/:id
 * 
 * Returns detailed attendance record with full task breakdown.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const attendanceId = parseInt(id);

    if (isNaN(attendanceId)) {
      return NextResponse.json(
        { success: false, error: "Invalid attendance ID" },
        { status: 400 }
      );
    }

    const attendance = await getAttendanceDetails(attendanceId);

    if (!attendance) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found" },
        { status: 404 }
      );
    }

    // Calculate performance score
    const performanceScore = calculateDailyPerformanceScore(attendance);

    return NextResponse.json({
      success: true,
      data: {
        id: attendance.id,
        userId: attendance.userId,
        date: attendance.date.toISOString(),
        checkInTime: attendance.checkInTime.toISOString(),
        checkOutTime: attendance.checkOutTime?.toISOString() || null,
        checkInLocation: attendance.checkInLocation,
        checkOutLocation: attendance.checkOutLocation,
        status: attendance.status,
        notes: attendance.notes,
        performanceScore,
        attendanceTasks: attendance.attendanceTasks.map((at) => ({
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
            assignedBy: at.task.assignedBy
              ? {
                  id: at.task.assignedBy.id,
                  name: at.task.assignedBy.name,
                  email: at.task.assignedBy.email,
                }
              : null,
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
          id: attendance.users.id,
          name: attendance.users.name,
          email: attendance.users.email,
        },
        approvedBy: attendance.approvedBy
          ? {
              id: attendance.approvedBy.id,
              name: attendance.approvedBy.name,
              email: attendance.approvedBy.email,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error("Get attendance details error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get attendance details",
      },
      { status: 500 }
    );
  }
}
