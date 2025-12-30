import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { getCached } from "@/lib/cache";
import { getUaeTime } from "@/lib/timezone-utils";
import { normalizeDateToDubai } from "@/lib/attendance-service";

/**
 * Unified API endpoint for team dashboard data
 * Fetches all required data in parallel for better performance
 * 
 * This reduces the number of API calls from 3-4 to just 1
 */
export async function GET(request: NextRequest) {
  // Build-time probe safe response
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const session = await requireAuth();
    const companyId = session.user.companyId;
    const userRole = session.user.role;

    // ✅ Performance: Cache key includes role for different data views
    const cacheKey = `dashboard:team-summary:${companyId}:${userRole}`;

    // ✅ Performance: Cache for 2 minutes
    return await getCached(
      cacheKey,
      async () => {
        const isTechnician = userRole === UserRole.TECHNICIAN;
        const isSupervisor = [
          UserRole.SUPERVISOR,
          UserRole.ADMIN,
          UserRole.OPERATIONS_MANAGER,
          UserRole.HR,
          UserRole.ACCOUNTANT,
        ].includes(userRole as any);

        // ✅ Performance: Fetch all data in parallel using Promise.all
        const [tasksData, attendanceData, kpiData] = await Promise.all([
          // Fetch tasks (for technicians)
          isTechnician
            ? prisma.tasks.findMany({
                where: {
                  companyId,
                  assignedToId: session.user.id,
                  status: {
                    in: ["PENDING", "IN_PROGRESS", "COMPLETED"],
                  },
                },
                select: {
                  id: true,
                  status: true,
                },
                take: 100,
              })
            : Promise.resolve([]),

          // Fetch attendance stats (for supervisors)
          isSupervisor
            ? (async () => {
                const uaeTime = getUaeTime();
                const normalizedDate = normalizeDateToDubai(uaeTime);

                const [teamMembers, todayAttendance] = await Promise.all([
                  prisma.users.findMany({
                    where: {
                      companyId,
                      role: {
                        in: ["TECHNICIAN", "SUPERVISOR", "OPERATIONS_MANAGER", "HR", "ACCOUNTANT"],
                      },
                      accountStatus: "APPROVED",
                    },
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  }),
                  prisma.attendance.findMany({
                    where: {
                      date: normalizedDate,
                      status: "APPROVED",
                      users: {
                        companyId,
                        role: {
                          in: ["TECHNICIAN", "SUPERVISOR", "OPERATIONS_MANAGER", "HR", "ACCOUNTANT"],
                        },
                      },
                    },
                    select: {
                      userId: true,
                      checkInTime: true,
                      checkOutTime: true,
                      users: {
                        select: {
                          id: true,
                          name: true,
                          email: true,
                        },
                      },
                    },
                  }),
                ]);

                const checkedInUserIds = new Set(
                  todayAttendance.filter((att) => att.checkOutTime === null).map((att) => att.userId)
                );
                const checkedOutUserIds = new Set(
                  todayAttendance.filter((att) => att.checkOutTime !== null).map((att) => att.userId)
                );
                const notCheckedIn = teamMembers.filter(
                  (member) => !checkedInUserIds.has(member.id) && !checkedOutUserIds.has(member.id)
                );

                return {
                  total: teamMembers.length,
                  checkedIn: checkedInUserIds.size,
                  checkedOut: checkedOutUserIds.size,
                  notCheckedIn: notCheckedIn.length,
                  checkedInUsers: todayAttendance
                    .filter((att) => att.checkOutTime === null)
                    .map((att) => ({
                      id: att.users.id,
                      name: att.users.name,
                      email: att.users.email,
                      checkInTime: att.checkInTime.toISOString(),
                    })),
                  checkedOutUsers: todayAttendance
                    .filter((att) => att.checkOutTime !== null)
                    .map((att) => ({
                      id: att.users.id,
                      name: att.users.name,
                      email: att.users.email,
                      checkInTime: att.checkInTime.toISOString(),
                      checkOutTime: att.checkOutTime!.toISOString(),
                    })),
                  notCheckedInUsers: notCheckedIn.map((member) => ({
                    id: member.id,
                    name: member.name,
                    email: member.email,
                  })),
                };
              })()
            : Promise.resolve(null),

          // Fetch KPI (for technicians)
          isTechnician
            ? (async () => {
                const userId = session.user.id;
                const [attendanceRecords, tasks, reviews] = await Promise.all([
                  prisma.attendance.findMany({
                    where: { userId },
                    select: {
                      checkInTime: true,
                      checkOutTime: true,
                    },
                    take: 100, // Limit to recent records
                  }),
                  prisma.tasks.findMany({
                    where: {
                      assignedToId: userId,
                      companyId,
                    },
                    select: {
                      status: true,
                    },
                    take: 100,
                  }),
                  prisma.supervisor_reviews
                    .findMany({
                      where: { technicianId: userId },
                      select: { rating: true },
                      take: 50,
                    })
                    .catch(() => []),
                ]);

                const totalDays = attendanceRecords.length;
                const daysPresent = attendanceRecords.filter((a) => a.checkOutTime !== null).length;
                const attendanceRate = totalDays > 0 ? (daysPresent / totalDays) * 100 : 0;

                let totalHours = 0;
                attendanceRecords.forEach((record) => {
                  if (record.checkOutTime) {
                    const hours =
                      (record.checkOutTime.getTime() - record.checkInTime.getTime()) / (1000 * 60 * 60);
                    totalHours += hours;
                  }
                });

                const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
                const taskCompletionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

                const averageRating =
                  reviews.length > 0
                    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
                    : 0;

                return {
                  attendance: {
                    totalDays,
                    daysPresent,
                    attendanceRate: attendanceRate.toFixed(2),
                  },
                  hours: {
                    totalHours: totalHours.toFixed(2),
                    averageHoursPerDay: totalDays > 0 ? (totalHours / totalDays).toFixed(2) : 0,
                  },
                  tasks: {
                    total: tasks.length,
                    completed: completedTasks,
                    completionRate: taskCompletionRate.toFixed(2),
                  },
                  performance: {
                    averageRating: averageRating.toFixed(2),
                    totalReviews: reviews.length,
                  },
                };
              })()
            : Promise.resolve(null),
        ]);

        // Format response based on role
        if (isTechnician) {
          const stats = {
            total: tasksData.length,
            pending: tasksData.filter((t) => t.status === "PENDING").length,
            inProgress: tasksData.filter((t) => t.status === "IN_PROGRESS").length,
            completed: tasksData.filter((t) => t.status === "COMPLETED").length,
          };

          return {
            success: true,
            data: {
              stats,
              kpi: kpiData,
            },
          };
        } else if (isSupervisor) {
          return {
            success: true,
            data: {
              teamStats: attendanceData,
            },
          };
        }

        return {
          success: true,
          data: {},
        };
      },
      120 // 2 minutes cache TTL
    ).then((result) => NextResponse.json(result));
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch dashboard data",
      },
      { status: 500 }
    );
  }
}

