import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { handleApiError, ValidationError } from "@/lib/error-handler";
import * as XLSX from "xlsx";
import { formatTime, formatDate } from "@/lib/utils";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * GET /api/attendance/export?userId=123&date=2024-11-25&period=day|month
 * 
 * Exports attendance data to Excel
 * - period=day: Export single day attendance
 * - period=month: Export entire month attendance
 */
export async function GET(request: NextRequest) {
  try {
    // Build-time probe safe response (avoid auth/prisma during Next build probes)
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return NextResponse.json({ success: true, ok: true }, { status: 200 });
    }

    const [{ prisma }, { requireAuth }, prismaClient, attendanceService] =
      await Promise.all([
        import("@/lib/prisma"),
        import("@/lib/auth-helpers"),
        import("@prisma/client"),
        import("@/lib/attendance-service"),
      ]);
    const { UserRole } = prismaClient;
    const { normalizeDateToDubai, getMonthBoundsInDubai } = attendanceService;

    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    
    const userIdParam = searchParams.get("userId");
    const dateParam = searchParams.get("date"); // YYYY-MM-DD
    const period = searchParams.get("period") || "day"; // day or month

    if (!dateParam) {
      throw new ValidationError(
        "Date parameter is required (format: YYYY-MM-DD)",
        [{ field: "date", message: "Date parameter is required" }]
      );
    }

    // Parse date (YYYY-MM-DD format)
    const [year, month, day] = dateParam.split("-").map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      throw new ValidationError(
        "Invalid date format. Use YYYY-MM-DD",
        [{ field: "date", message: "Invalid date format. Expected YYYY-MM-DD" }]
      );
    }

    // Build where clause
    const where: Prisma.attendanceWhereInput = {
      status: "APPROVED",
    };

    // If userId is provided, filter by user
    if (userIdParam) {
      const userId = parseInt(userIdParam);
      if (isNaN(userId)) {
        throw new ValidationError("Invalid userId", [{ field: "userId", message: "userId must be a number" }]);
      }
      where.userId = userId;
    } else {
      // For supervisors/admins without userId, show all team members
      if (session.user.role === UserRole.TECHNICIAN) {
        const userId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
        where.userId = userId;
      } else {
        where.users = {
          companyId: session.user.companyId,
          role: {
            in: [UserRole.TECHNICIAN, UserRole.SUPERVISOR, UserRole.OPERATIONS_MANAGER, UserRole.HR, UserRole.ACCOUNTANT],
          },
        };
      }
    }

    let attendances: any[] = [];

    if (period === "day") {
      // Export single day
      const targetDate = new Date(year, month - 1, day);
      const normalizedDate = normalizeDateToDubai(targetDate);
      where.date = normalizedDate;

      attendances = await prisma.attendance.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          checkInTime: "asc",
        },
      });
    } else if (period === "month") {
      // Export entire month - use the same logic as getLatestMonthAttendances
      // This ensures consistency with calendar view
      const { monthStart, monthEnd } = getMonthBoundsInDubai(year, month);

      where.date = {
        gte: monthStart,
        lte: monthEnd,
      };

      attendances = await prisma.attendance.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: [
          { date: "asc" },
          { checkInTime: "asc" },
        ],
      });

      // Debug: Log the query parameters and results count
      if (process.env.NODE_ENV === "development") {
        console.log(`[Export] Month query: ${year}-${month}`);
        console.log(`[Export] monthStart: ${monthStart.toISOString()}`);
        console.log(`[Export] monthEnd: ${monthEnd.toISOString()}`);
        console.log(`[Export] Found ${attendances.length} attendance records`);
        
        // Group by date to see distribution (convert normalized dates back to Dubai dates)
        const byDate = new Map<string, { count: number; users: string[]; records: any[] }>();
        attendances.forEach((att) => {
          // Convert normalized date back to Dubai timezone to get the actual date
          const formatter = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Dubai",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
          const parts = formatter.formatToParts(att.date);
          const day = parts.find(p => p.type === "day")?.value || "0";
          const monthPart = parts.find(p => p.type === "month")?.value || "0";
          const yearPart = parts.find(p => p.type === "year")?.value || "0";
          const dateStr = `${yearPart}-${monthPart}-${day}`;
          
          if (!byDate.has(dateStr)) {
            byDate.set(dateStr, { count: 0, users: [], records: [] });
          }
          const entry = byDate.get(dateStr)!;
          entry.count++;
          entry.records.push(att);
          if (att.users?.name && !entry.users.includes(att.users.name)) {
            entry.users.push(att.users.name);
          }
        });
        
        console.log(`[Export] Records by date:`);
        Array.from(byDate.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .forEach(([date, data]) => {
            console.log(`  ${date}: ${data.count} records - Users: ${data.users.join(", ")}`);
            data.records.forEach((rec, idx) => {
              console.log(`    ${idx + 1}. ${rec.users?.name || "Unknown"} - DB date: ${rec.date.toISOString()}, Check-in: ${rec.checkInTime.toISOString()}`);
            });
          });
        
        // Specifically check November 21
        const nov21Key = `${year}-11-21`;
        if (byDate.has(nov21Key)) {
          const nov21Data = byDate.get(nov21Key)!;
          console.log(`[Export] November 21, ${year}: ${nov21Data.count} records`);
          console.log(`[Export] November 21 users: ${nov21Data.users.join(", ")}`);
        }
      }
    } else {
      throw new ValidationError("Invalid period. Use 'day' or 'month'", [
        { field: "period", message: "Period must be 'day' or 'month'" }
      ]);
    }

    // Group attendances by user for better organization
    const attendancesByUser = new Map<number, any[]>();
    
    attendances.forEach((att) => {
      const userId = att.userId;
      if (!attendancesByUser.has(userId)) {
        attendancesByUser.set(userId, []);
      }
      attendancesByUser.get(userId)!.push(att);
    });

    // Track totals for summary
    const userTotals = new Map<number, { 
      totalHours: number; 
      totalOvertime: number; 
      days: number;
      userName: string;
    }>();

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Process each user and create a separate sheet
    attendancesByUser.forEach((userAttendances, userId) => {
      const userName = userAttendances[0]?.users?.name || "Unknown";
      let userTotalHours = 0;
      let userTotalOvertime = 0;
      let userDays = 0;

      // Sort by date
      userAttendances.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      });

      // Prepare data for this user's sheet
      const userSheetData: any[] = [];
      
      // Add header row
      userSheetData.push({
        date: "Date",
        "check in": "Check In",
        "check out": "Check Out",
        "total working": "Total Working (Hours)",
        "over time": "Over Time (Hours)",
      });

      // Add each attendance record
      userAttendances.forEach((att) => {
        const checkInTime = att.checkInTime ? formatTime(att.checkInTime) : "N/A";
        const checkOutTime = att.checkOutTime ? formatTime(att.checkOutTime) : "N/A";
        
        // Calculate hours worked
        let totalWorking = 0;
        if (att.checkOutTime && att.checkInTime) {
          const hours = (new Date(att.checkOutTime).getTime() - new Date(att.checkInTime).getTime()) / (1000 * 60 * 60);
          totalWorking = hours;
        } else if (att.checkInTime) {
          // Still checked in - calculate from check-in to now
          const hours = (new Date().getTime() - new Date(att.checkInTime).getTime()) / (1000 * 60 * 60);
          totalWorking = hours;
        }

        // Calculate overtime (hours over 8)
        const overTime = totalWorking > 8 ? totalWorking - 8 : 0;

        // Format date - convert normalized date back to Dubai timezone
        let attendanceDate: string;
        if (att.date) {
          // Convert normalized date back to Dubai timezone to get the actual date
          const formatter = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Dubai",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
          const parts = formatter.formatToParts(att.date);
          const yearPart = parts.find(p => p.type === "year")?.value || "0";
          const monthPart = parts.find(p => p.type === "month")?.value || "0";
          const dayPart = parts.find(p => p.type === "day")?.value || "0";
          
          // Format as YYYY-MM-DD for Excel
          attendanceDate = `${yearPart}-${monthPart}-${dayPart}`;
        } else {
          attendanceDate = dateParam;
        }

        userSheetData.push({
          date: attendanceDate,
          "check in": checkInTime,
          "check out": checkOutTime,
          "total working": totalWorking > 0 ? totalWorking.toFixed(2) : "0.00",
          "over time": overTime > 0 ? overTime.toFixed(2) : "0.00",
        });

        // Accumulate totals
        userTotalHours += totalWorking;
        userTotalOvertime += overTime;
        userDays += 1;
      });

      // Add summary row for this user
      userSheetData.push({
        date: "",
        "check in": "",
        "check out": "",
        "total working": "",
        "over time": "",
      });

      userSheetData.push({
        date: "TOTAL",
        "check in": "",
        "check out": "",
        "total working": userTotalHours.toFixed(2),
        "over time": userTotalOvertime.toFixed(2),
      });

      userSheetData.push({
        date: "Days Worked",
        "check in": "",
        "check out": "",
        "total working": userDays.toString(),
        "over time": "",
      });

      // Store user totals for summary sheet
      userTotals.set(userId, {
        totalHours: userTotalHours,
        totalOvertime: userTotalOvertime,
        days: userDays,
        userName: userName,
      });

      // Create worksheet for this user
      const userWorksheet = XLSX.utils.json_to_sheet(userSheetData);
      
      // Set column widths
      const columnWidths = [
        { wch: 15 }, // date
        { wch: 12 }, // check in
        { wch: 12 }, // check out
        { wch: 18 }, // total working
        { wch: 15 }, // over time
      ];
      userWorksheet["!cols"] = columnWidths;

      // Add worksheet to workbook with user's name as sheet name
      // Excel sheet names are limited to 31 characters
      const sheetName = userName.length > 31 ? userName.substring(0, 31) : userName;
      XLSX.utils.book_append_sheet(workbook, userWorksheet, sheetName);
    });

    // Create Summary sheet
    const summaryData: any[] = [];
    
    // Add header
    summaryData.push({
      "Employee Name": "Employee Name",
      "Days Worked": "Days Worked",
      "Total Hours": "Total Hours",
      "Total Overtime": "Total Overtime",
    });

    // Add each user's summary
    attendancesByUser.forEach((userAttendances, userId) => {
      const totals = userTotals.get(userId);
      
      if (totals) {
        summaryData.push({
          "Employee Name": totals.userName,
          "Days Worked": totals.days,
          "Total Hours": parseFloat(totals.totalHours.toFixed(2)),
          "Total Overtime": parseFloat(totals.totalOvertime.toFixed(2)),
        });
      }
    });

    // Add empty row
    summaryData.push({
      "Employee Name": "",
      "Days Worked": "",
      "Total Hours": "",
      "Total Overtime": "",
    });

    // Add grand totals
    const grandTotalHours = Array.from(userTotals.values()).reduce((sum, t) => sum + t.totalHours, 0);
    const grandTotalOvertime = Array.from(userTotals.values()).reduce((sum, t) => sum + t.totalOvertime, 0);
    const grandTotalDays = Array.from(userTotals.values()).reduce((sum, t) => sum + t.days, 0);

    summaryData.push({
      "Employee Name": "GRAND TOTAL",
      "Days Worked": grandTotalDays,
      "Total Hours": parseFloat(grandTotalHours.toFixed(2)),
      "Total Overtime": parseFloat(grandTotalOvertime.toFixed(2)),
    });

    // Create summary worksheet
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    
    // Set column widths for summary
    const summaryColumnWidths = [
      { wch: 25 }, // Employee Name
      { wch: 15 }, // Days Worked
      { wch: 15 }, // Total Hours
      { wch: 18 }, // Total Overtime
    ];
    summaryWorksheet["!cols"] = summaryColumnWidths;

    // Add summary sheet to workbook (always last)
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Summary");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Generate filename
    const fileName = userIdParam
      ? `Attendance_${attendances[0]?.users?.name || "Employee"}_${monthNames[month - 1]}_${year}.xlsx`
      : `Attendance_Report_${monthNames[month - 1]}_${year}.xlsx`;

    // Return Excel file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

