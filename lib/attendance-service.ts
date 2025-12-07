import { prisma } from "@/lib/prisma";
import { TaskStatus } from "@prisma/client";

const DUBAI_TIMEZONE = "Asia/Dubai";

/**
 * Convert UTC date to Dubai timezone and normalize to start of day
 * Returns a Date object representing midnight in Dubai timezone (stored as UTC)
 * All times on the same day in Dubai will return the same normalized date
 */
export function normalizeDateToDubai(date: Date): Date {
  try {
    // Get the date components in Dubai timezone using Intl.DateTimeFormat
    // This is more reliable than toLocaleDateString
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: DUBAI_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const parts = formatter.formatToParts(date);
    const year = parseInt(parts.find(p => p.type === "year")?.value || "0", 10);
    const month = parseInt(parts.find(p => p.type === "month")?.value || "0", 10);
    const day = parseInt(parts.find(p => p.type === "day")?.value || "0", 10);

    if (isNaN(year) || isNaN(month) || isNaN(day) || year === 0 || month === 0 || day === 0) {
      throw new Error(`Invalid date components: year=${year}, month=${month}, day=${day}`);
    }

    // Create a date at midnight in Dubai timezone
    // Dubai is UTC+4, so Dubai midnight (00:00:00) = UTC 20:00:00 previous day
    // Example: If Dubai date is 2025-11-25, then:
    //   Dubai midnight (2025-11-25 00:00:00) = UTC 2025-11-24 20:00:00
    // So we create UTC date for (year, month-1, day-1, 20:00:00)
    const dubaiMidnightUTC = new Date(Date.UTC(year, month - 1, day - 1, 20, 0, 0, 0));
    
    return dubaiMidnightUTC;
  } catch (error) {
    console.error("Error normalizing date to Dubai:", error, "Input date:", date);
    // Fallback: use the date as-is but set to midnight UTC
    const fallback = new Date(date);
    fallback.setUTCHours(0, 0, 0, 0);
    return fallback;
  }
}

/**
 * Get start and end of month in Dubai timezone
 * Returns normalized dates that can be used in Prisma queries
 */
export function getMonthBoundsInDubai(year: number, month: number): {
  monthStart: Date;
  monthEnd: Date;
} {
  // Create date for first day of month at midnight
  const monthStartDate = new Date(year, month - 1, 1);
  const monthStart = normalizeDateToDubai(monthStartDate);
  
  // Create date for last day of month
  // new Date(year, month, 0) gives us the last day of the previous month
  // So new Date(year, month, 0) when month is the target month gives last day
  const lastDayOfMonth = new Date(year, month, 0);
  const monthEnd = normalizeDateToDubai(lastDayOfMonth);
  
  // Add 24 hours minus 1ms to get the end of the last day
  // This ensures we include all records for the last day
  const endOfLastDay = new Date(monthEnd.getTime() + 24 * 60 * 60 * 1000 - 1);
  
  return {
    monthStart,
    monthEnd: endOfLastDay,
  };
}

/**
 * Get the latest month that contains attendance records for a user
 */
export async function getLatestMonthForUser(userId: number): Promise<{
  year: number;
  month: number;
  monthStart: Date;
  monthEnd: Date;
} | null> {
  // Find the most recent attendance record
  const latestAttendance = await prisma.attendance.findFirst({
    where: { userId },
    orderBy: { date: "desc" },
    select: { date: true },
  });

  if (!latestAttendance) {
    return null;
  }

  // Convert to Dubai timezone to get year/month
  const dubaiDate = new Date(
    latestAttendance.date.toLocaleString("en-US", { timeZone: DUBAI_TIMEZONE })
  );
  
  const year = dubaiDate.getFullYear();
  const month = dubaiDate.getMonth() + 1;
  
  const { monthStart, monthEnd } = getMonthBoundsInDubai(year, month);

  return {
    year,
    month,
    monthStart,
    monthEnd,
  };
}

/**
 * Get attendances for the latest month (or specified month) for a user
 * Returns attendances ordered DESC by date (newest first)
 */
export async function getLatestMonthAttendances(
  userId: number,
  month?: number,
  year?: number
): Promise<{
  monthStart: Date;
  monthEnd: Date;
  attendances: any[];
} | null> {
  let monthBounds: { monthStart: Date; monthEnd: Date; year: number; month: number };

  if (month && year) {
    const bounds = getMonthBoundsInDubai(year, month);
    monthBounds = { ...bounds, year, month };
  } else {
    const latest = await getLatestMonthForUser(userId);
    if (!latest) {
      return null;
    }
    monthBounds = latest;
  }

  // Fetch attendances for this month
  const attendances = await prisma.attendance.findMany({
    where: {
      userId,
      date: {
        gte: monthBounds.monthStart,
        lte: monthBounds.monthEnd,
      },
    },
    include: {
      attendanceTasks: {
        include: {
          task: {
            include: {
              assignedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          assignedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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
    orderBy: {
      date: "desc", // Newest first
    },
  });

  return {
    monthStart: monthBounds.monthStart,
    monthEnd: monthBounds.monthEnd,
    attendances,
  };
}

/**
 * Get detailed attendance record with full task breakdown
 */
export async function getAttendanceDetails(attendanceId: number) {
  const attendance = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: {
      attendanceTasks: {
        include: {
          task: {
            include: {
              assignedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          assignedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      users: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return attendance;
}

/**
 * Calculate daily performance score
 * 
 * Scoring algorithm:
 * - Task completion rate: 40% (tasks completed / tasks assigned)
 * - Punctuality: 30% (check-in within allowed window)
 * - Task performance ratings: 30% (average of performance ratings 1-5)
 * 
 * @param attendance Attendance record with attendanceTasks
 * @param shiftStartHour Default shift start hour (default: 8)
 * @param allowedMinutes Minutes allowed for late check-in (default: 15)
 */
export function calculateDailyPerformanceScore(
  attendance: {
    checkInTime: Date;
    attendanceTasks: Array<{
      status: TaskStatus;
      performance: number | null;
    }>;
  },
  shiftStartHour: number = 8,
  allowedMinutes: number = 15
): number {
  let score = 0;
  let maxScore = 100;

  // 1. Task completion rate (40 points)
  const totalTasks = attendance.attendanceTasks.length;
  if (totalTasks > 0) {
    const completedTasks = attendance.attendanceTasks.filter(
      (at) => at.status === TaskStatus.COMPLETED
    ).length;
    const completionRate = completedTasks / totalTasks;
    score += completionRate * 40;
  } else {
    // No tasks assigned, reduce max score
    maxScore -= 40;
  }

  // 2. Punctuality (30 points)
  // Convert checkInTime to Dubai timezone for accurate hour/minute calculation
  const checkInTimeStr = attendance.checkInTime.toLocaleString("en-US", {
    timeZone: DUBAI_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  
  // Parse the formatted string to get hours and minutes
  const [checkInHour, checkInMinute] = checkInTimeStr.split(":").map(Number);
  
  const shiftStartMinutes = shiftStartHour * 60;
  const checkInMinutes = checkInHour * 60 + checkInMinute;
  const minutesLate = Math.max(0, checkInMinutes - shiftStartMinutes - allowedMinutes);
  
  if (minutesLate === 0) {
    score += 30; // On time
  } else if (minutesLate <= 30) {
    score += 30 * (1 - minutesLate / 30); // Gradual penalty
  } else {
    score += 0; // More than 30 minutes late
  }

  // 3. Task performance ratings (30 points)
  const tasksWithRatings = attendance.attendanceTasks.filter(
    (at) => at.performance !== null && at.performance !== undefined
  );
  
  if (tasksWithRatings.length > 0) {
    const avgRating =
      tasksWithRatings.reduce((sum, at) => sum + (at.performance || 0), 0) /
      tasksWithRatings.length;
    // Convert 1-5 rating to 0-30 points
    score += (avgRating / 5) * 30;
  } else {
    // No ratings, reduce max score
    maxScore -= 30;
  }

  // Calculate percentage
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  return Math.round(Math.max(0, Math.min(100, percentage)));
}

/**
 * Get calendar summary for a month (for calendar badges)
 */
export async function getCalendarSummary(
  userId: number,
  year: number,
  month: number
): Promise<Array<{ day: number; hasAttendance: boolean; isComplete: boolean }>> {
  const { monthStart, monthEnd } = getMonthBoundsInDubai(year, month);
  const daysInMonth = new Date(year, month, 0).getDate();

  const attendances = await prisma.attendance.findMany({
    where: {
      userId,
      date: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    select: {
      date: true,
      checkOutTime: true,
    },
  });

  // Create a map of dates to attendance status
  const attendanceMap = new Map<string, { hasAttendance: boolean; isComplete: boolean }>();
  
  attendances.forEach((att) => {
    // Convert normalized date back to Dubai timezone to get the day
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: DUBAI_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    
    const parts = formatter.formatToParts(att.date);
    const day = parseInt(parts.find(p => p.type === "day")?.value || "0", 10);
    
    if (day > 0) {
      attendanceMap.set(day.toString(), {
        hasAttendance: true,
        isComplete: att.checkOutTime !== null,
      });
    }
  });

  // Build calendar array
  const calendar: Array<{ day: number; hasAttendance: boolean; isComplete: boolean }> = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const status = attendanceMap.get(day.toString()) || {
      hasAttendance: false,
      isComplete: false,
    };
    calendar.push({
      day,
      ...status,
    });
  }

  return calendar;
}

