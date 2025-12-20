import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/error-handler";
import type { AttendanceTask, TeamMemberWithAttendance } from "@/lib/types/api";

/**
 * GET /api/attendance/today-team
 * 
 * Returns today's attendance status for all team members
 * For supervisors/admins: returns all team members
 * For technicians: returns only their own status
 */
export async function GET(request: NextRequest) {
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
    const companyId = session.user.companyId;

    // Get today's normalized date in Dubai timezone
    const uaeTime = getUaeTime();
    const normalizedDate = normalizeDateToDubai(uaeTime);

    // Get all team members who can check in/out (all roles except Admin)
    const teamMembers = await prisma.users.findMany({
      where: {
        companyId,
        role: {
          in: [UserRole.TECHNICIAN, UserRole.SUPERVISOR, UserRole.OPERATIONS_MANAGER, UserRole.HR, UserRole.ACCOUNTANT],
        },
        accountStatus: "APPROVED",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        specialization: true,
        profilePicture: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Get today's attendance records for all team members
    const todayAttendance = await prisma.attendance.findMany({
      where: {
        date: normalizedDate,
        status: "APPROVED",
        users: {
          companyId,
          role: {
            in: [UserRole.TECHNICIAN, UserRole.SUPERVISOR, UserRole.OPERATIONS_MANAGER, UserRole.HR, UserRole.ACCOUNTANT],
          },
        },
      },
      include: {
        attendanceTasks: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                deadline: true,
                location: true,
                estimatedHours: true,
                actualHours: true,
              },
            },
          },
        },
      },
    });

    // Create a map of userId to attendance
    const attendanceMap = new Map<
      number,
      typeof todayAttendance[0]
    >();
    todayAttendance.forEach((att) => {
      attendanceMap.set(att.userId, att);
    });

    // Build team members with attendance status
    const teamWithAttendance: TeamMemberWithAttendance[] = teamMembers.map((member) => {
      const attendance = attendanceMap.get(member.id);
      
      if (!attendance) {
        return {
          ...member,
          attendance: null,
          isPresent: false,
        };
      }

      // Calculate hours worked and overtime
      let hoursWorked: number | null = null;
      let overtime: number | null = null;
      const workingHours = 8; // Default working hours

      if (attendance.checkInTime && attendance.checkOutTime) {
        hoursWorked = (new Date(attendance.checkOutTime).getTime() - new Date(attendance.checkInTime).getTime()) / (1000 * 60 * 60);
        overtime = hoursWorked > workingHours ? hoursWorked - workingHours : 0;
      } else if (attendance.checkInTime && !attendance.checkOutTime) {
        // Still working - calculate hours from check-in to now
        const now = new Date();
        hoursWorked = (now.getTime() - new Date(attendance.checkInTime).getTime()) / (1000 * 60 * 60);
        overtime = hoursWorked > workingHours ? hoursWorked - workingHours : 0;
      }

      return {
        ...member,
        attendance: {
          id: attendance.id,
          checkInTime: attendance.checkInTime.toISOString(),
          checkOutTime: attendance.checkOutTime?.toISOString() || null,
          checkInLocation: attendance.checkInLocation,
          checkOutLocation: attendance.checkOutLocation,
          status: attendance.status,
          hoursWorked,
          overtime,
          tasks: attendance.attendanceTasks.map((at): AttendanceTask => ({
            id: at.id,
            taskId: at.taskId,
            status: at.status,
            performedAt: at.performedAt?.toISOString() || null,
            completedAt: at.completedAt?.toISOString() || null,
            task: {
              id: at.task.id,
              title: at.task.title,
              description: at.task.description ?? null,
              status: at.task.status,
              priority: at.task.priority,
              deadline: at.task.deadline?.toISOString() ?? null,
              location: at.task.location ?? null,
              estimatedHours: at.task.estimatedHours ?? null,
              actualHours: at.task.actualHours ?? null,
            },
          })),
        },
        isPresent: true,
      };
    });

    // Filter for technicians if needed
    let filteredTeam = teamWithAttendance;
    if (session.user.role === UserRole.TECHNICIAN) {
      const userId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
      filteredTeam = teamWithAttendance.filter((member) => member.id === userId);
    }

    return NextResponse.json({
      success: true,
      data: {
        date: normalizedDate.toISOString(),
        team: filteredTeam,
        stats: {
          total: filteredTeam.length,
          present: filteredTeam.filter((m) => m.isPresent).length,
          absent: filteredTeam.filter((m) => !m.isPresent).length,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

