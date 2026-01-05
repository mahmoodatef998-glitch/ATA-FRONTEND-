import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { handleApiError } from "@/lib/error-handler";
import { requireTeamModuleAccess } from "@/lib/permissions/middleware";
import { getCached } from "@/lib/cache";

export async function GET(request: NextRequest) {
  // Build-time probe safe response
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    // Require team module access
    const session = await requireTeamModuleAccess();
    const companyId = session.user.companyId;

    // ✅ Performance: Cache team members for 2 minutes (changes infrequently)
    const cacheKey = `team:members:${companyId}`;
    
    const result = await getCached(
      cacheKey,
      async () => {
        // Get all team members (all roles that can access team module)
        const teamRoles = [
      UserRole.ADMIN,
      UserRole.HR,
      UserRole.OPERATIONS_MANAGER,
      UserRole.SUPERVISOR,
      UserRole.TECHNICIAN,
      UserRole.ACCOUNTANT,
    ];
    
        const teamMembers = await prisma.users.findMany({
          where: {
            companyId,
            role: {
              in: teamRoles,
            },
            accountStatus: "APPROVED", // Only approved members
            // Note: isActive filter removed - show all approved members (isActive can be null for existing users)
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            department: true,
            specialization: true,
            createdAt: true,
          },
          orderBy: {
            name: "asc",
          },
        });

        // Get statistics for each member - Optimized to reduce queries
        // Get current month date range (calculate once)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get all member IDs
        const memberIds = teamMembers.map(m => m.id);

        // Fetch all attendance records for all members in one query (optimized)
        const allAttendanceRecords = await prisma.attendance.findMany({
          where: {
            userId: { in: memberIds },
            checkInTime: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
            status: "APPROVED",
          },
          select: {
            userId: true,
            checkInTime: true,
            checkOutTime: true,
          },
        });

        // Fetch all overtime records for all members in one query (optimized)
        const allOvertimeRecords = await prisma.overtime.findMany({
          where: {
            userId: { in: memberIds },
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
            approved: true,
          },
          select: {
            userId: true,
            hours: true,
          },
        });

        // Fetch today's attendance for all members in one query (optimized)
        const todayAttendanceRecords = await prisma.attendance.findMany({
          where: {
            userId: { in: memberIds },
            checkInTime: {
              gte: today,
              lt: tomorrow,
            },
            checkOutTime: null,
            status: "APPROVED",
          },
          select: {
            userId: true,
            checkInTime: true,
          },
        });

        // Group data by userId for quick lookup
        const attendanceByUser = new Map<number, typeof allAttendanceRecords>();
        const overtimeByUser = new Map<number, typeof allOvertimeRecords>();
        const todayAttendanceByUser = new Map<number, (typeof todayAttendanceRecords)[0]>();

        allAttendanceRecords.forEach(record => {
          if (!attendanceByUser.has(record.userId)) {
            attendanceByUser.set(record.userId, []);
          }
          attendanceByUser.get(record.userId)!.push(record);
        });

        allOvertimeRecords.forEach(record => {
          if (!overtimeByUser.has(record.userId)) {
            overtimeByUser.set(record.userId, []);
          }
          overtimeByUser.get(record.userId)!.push(record);
        });

        todayAttendanceRecords.forEach(record => {
          todayAttendanceByUser.set(record.userId, record);
        });

        // Calculate stats for each member
        const membersWithStats = teamMembers.map((member) => {
          const attendanceRecords = attendanceByUser.get(member.id) || [];
          const overtimeRecords = overtimeByUser.get(member.id) || [];
          const todayAttendance = todayAttendanceByUser.get(member.id);

          // Calculate working days (days with check-in)
          const workingDays = new Set(
            attendanceRecords.map((a) => {
              const date = new Date(a.checkInTime);
              return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            })
          ).size;

          // Calculate total hours worked
          let totalHours = 0;
          for (const record of attendanceRecords) {
            if (record.checkOutTime) {
              const checkIn = new Date(record.checkInTime);
              const checkOut = new Date(record.checkOutTime);
              const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
              totalHours += hours;
            }
          }

          const overtimeHours = overtimeRecords.reduce((sum, record) => sum + record.hours, 0);

          return {
            ...member,
            stats: {
              workingDays,
              totalHours: Math.round(totalHours * 10) / 10,
              overtimeHours: Math.round(overtimeHours * 10) / 10,
              isCheckedIn: !!todayAttendance,
              checkInTime: todayAttendance?.checkInTime || null,
            },
          };
        });

        return {
          success: true,
          data: membersWithStats,
        };
      },
      180 // ✅ Performance: 3 minutes cache TTL for faster page loads (increased from 120s)
    );

    const response = NextResponse.json(result);
    
    // ✅ Performance: Aggressive cache headers for sub-1.5s page loads
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=180, stale-while-revalidate=360, max-age=180'
    );
    response.headers.set('X-Cache-Status', 'HIT');
    
    return response;
  } catch (error) {
    // Log error for debugging
    console.error("[Team Members API] Error:", error);
    return handleApiError(error);
  }
}

