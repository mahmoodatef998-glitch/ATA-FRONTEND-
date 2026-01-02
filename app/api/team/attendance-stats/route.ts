import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { normalizeDateToDubai } from "@/lib/attendance-service";
import { getUaeTime } from "@/lib/timezone-utils";
import { handleApiError } from "@/lib/error-handler";
import { getCached } from "@/lib/cache";

/**
 * Get attendance statistics for the team
 * Returns count of checked-in users, total users, and attendance details
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

    // ✅ Performance: Cache attendance stats for 2 minutes (changes frequently during day)
    const cacheKey = `team:attendance-stats:${companyId}`;
    
    const result = await getCached(
      cacheKey,
      async () => {
        // Get today's normalized date in Dubai timezone
        const uaeTime = getUaeTime();
        const normalizedDate = normalizeDateToDubai(uaeTime);

        // Get all team members who can check in/out (all roles except Admin)
        // This includes: TECHNICIAN, SUPERVISOR, OPERATIONS_MANAGER, HR, ACCOUNTANT
        const teamMembers = await prisma.users.findMany({
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
            role: true,
          },
        });

        // Get today's attendance records for team members in this company
        const todayAttendance = await prisma.attendance.findMany({
          where: {
            date: normalizedDate,
            status: "APPROVED",
            // Note: companyId will be used after migration is applied
            // For now, filter through users relation
            users: {
              companyId,
              role: {
                in: ["TECHNICIAN", "SUPERVISOR", "OPERATIONS_MANAGER", "HR", "ACCOUNTANT"],
              },
            },
          },
          select: {
            id: true,
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
        });

        // Count checked-in users (users with check-in but no check-out)
        const checkedInUsers = todayAttendance.filter(
          (att) => att.checkOutTime === null
        );

        // Count checked-out users (users who checked in and checked out today)
        const checkedOutUsers = todayAttendance.filter(
          (att) => att.checkOutTime !== null
        );

        // Get list of users who haven't checked in today
        const checkedInUserIds = new Set(todayAttendance.map((att) => att.userId));
        const notCheckedIn = teamMembers.filter(
          (member) => !checkedInUserIds.has(member.id)
        );

        return {
          success: true,
          data: {
            total: teamMembers.length,
            checkedIn: checkedInUsers.length,
            checkedOut: checkedOutUsers.length,
            notCheckedIn: notCheckedIn.length,
            checkedInUsers: checkedInUsers.map((att) => ({
              id: att.users.id,
              name: att.users.name,
              email: att.users.email,
              checkInTime: att.checkInTime.toISOString(),
            })),
            checkedOutUsers: checkedOutUsers.map((att) => ({
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
          },
        };
      },
      120 // ✅ Performance: 2 minutes cache TTL
    );

    const response = NextResponse.json(result);
    
    // ✅ Performance: Add cache headers for better performance
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=120, stale-while-revalidate=240'
    );
    
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

