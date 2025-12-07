import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { getUaeTime } from "@/lib/timezone-utils";
import bcrypt from "bcryptjs";
import {
  requireTeamModuleAccess,
  requireResourceAccess,
  requireCanAssignRole,
} from "@/lib/permissions/middleware";
import { authorize, authorizeAny } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import {
  createAuditLog,
  AuditAction,
  AuditResource,
  getAuditContext,
} from "@/lib/rbac/audit-logger";
import { handleApiError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";

interface AttendanceRecord {
  id: number;
  checkInTime: string;
  checkOutTime: string | null;
  checkInLocation: string | null;
  checkOutLocation: string | null;
  status: string;
  attendanceType: string;
  hoursWorked: number | null;
  overtime: number;
}

// GET - Get member details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require team module access
    const session = await requireTeamModuleAccess();
    const { id } = await params;
    const memberId = parseInt(id);
    const companyId = typeof session.user.companyId === "string" 
      ? parseInt(session.user.companyId) 
      : session.user.companyId;

    if (isNaN(memberId)) {
      return NextResponse.json(
        { success: false, error: "Invalid member ID" },
        { status: 400 }
      );
    }

    // Check if user can view this member
    // Technicians can only view their own profile
    // Others need TEAM_MEMBERS_READ permission
    const sessionUserId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
    const userRole = session.user.role;
    const isAdmin = userRole === UserRole.ADMIN || userRole === "ADMIN" || String(userRole) === "ADMIN";
    
    // Admin can view any member, others need permission if not viewing own profile
    if (sessionUserId !== memberId && !isAdmin) {
      // Not viewing own profile and not Admin, need permission using RBAC
      await authorizeAny([
        PermissionAction.USER_READ,
        PermissionAction.TEAM_MEMBERS_READ,
      ]);
    }

    // Get all attendance records (not just current month) for calendar view
    // First check if user exists and belongs to company
    // Use findFirst because we have multiple conditions
    // Include all team module roles
    const teamRoles = [
      UserRole.ADMIN,
      UserRole.HR,
      UserRole.OPERATIONS_MANAGER,
      UserRole.SUPERVISOR,
      UserRole.TECHNICIAN,
      UserRole.ACCOUNTANT,
    ];
    
    const member = await prisma.users.findFirst({
      where: {
        id: memberId,
        companyId,
        role: {
          in: teamRoles,
        },
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
        accountStatus: true,
        companies: {
          select: {
            id: true,
            name: true,
          },
        },
        attendance: {
          select: {
            id: true,
            checkInTime: true,
            checkOutTime: true,
            checkInLat: true,
            checkInLng: true,
            checkInLocation: true,
            checkOutLocation: true,
            status: true,
            attendanceType: true,
          },
          orderBy: {
            checkInTime: "desc",
          },
          // Get all records for calendar view
        },
        assignedTasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, error: "Team member not found or not authorized" },
        { status: 404 }
      );
    }

    // Check account status - only show approved accounts
    // accountStatus might be undefined if not in select, so check safely
    if (member.accountStatus && member.accountStatus !== "APPROVED") {
      return NextResponse.json(
        { success: false, error: "Team member account is not approved" },
        { status: 403 }
      );
    }

    // Calculate current month stats
    const now = getUaeTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const currentMonthAttendance = (member.attendance || []).filter((att) => {
      try {
        const checkInDate = new Date(att.checkInTime);
        return checkInDate >= startOfMonth && checkInDate <= endOfMonth;
      } catch (error) {
        logger.error("Error filtering attendance", { attendanceId: att?.id, error }, "team");
        return false;
      }
    });

    let daysWorked = 0;
    let totalHours = 0;
    let overtimeHours = 0;
    let isCheckedIn = false;
    let checkInTime: string | null = null;
    let checkInLocation: string | null = null;

    // Process all attendance records with hours calculation
    const attendanceWithHours: AttendanceRecord[] = (member.attendance || []).map((att) => {
      let hoursWorked: number | null = null;
      let overtime: number = 0;
      try {
        if (att.checkOutTime) {
          const checkIn = new Date(att.checkInTime);
          const checkOut = new Date(att.checkOutTime);
          if (!isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime())) {
            hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
            if (hoursWorked > 8) {
              overtime = hoursWorked - 8;
            }
          }
        }
      } catch (error) {
        logger.error("Error calculating hours for attendance", { attendanceId: att.id, error }, "team");
        hoursWorked = null;
        overtime = 0;
      }
      return { 
        ...att, 
        hoursWorked: hoursWorked ? parseFloat(hoursWorked.toFixed(2)) : null,
        overtime: parseFloat(overtime.toFixed(2)),
        checkInTime: att.checkInTime instanceof Date ? att.checkInTime.toISOString() : att.checkInTime,
        checkOutTime: att.checkOutTime instanceof Date ? att.checkOutTime.toISOString() : (att.checkOutTime ? new Date(att.checkOutTime).toISOString() : null),
        status: String(att.status), // Ensure status is string
        attendanceType: String(att.attendanceType), // Ensure attendanceType is string
      };
    });

    // Calculate current month stats
    currentMonthAttendance.forEach((att) => {
      try {
        if (att.checkOutTime) {
          daysWorked++;
          const checkIn = new Date(att.checkInTime);
          const checkOut = new Date(att.checkOutTime);
          if (!isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime())) {
            const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
            totalHours += hours;
            if (hours > 8) {
              overtimeHours += hours - 8;
            }
          }
        } else {
          // Currently checked in
          isCheckedIn = true;
          const checkInDate = new Date(att.checkInTime);
          if (!isNaN(checkInDate.getTime())) {
            checkInTime = checkInDate.toISOString();
            checkInLocation = att.checkInLocation;
          }
        }
      } catch (error) {
        logger.error("Error processing attendance record", { attendanceId: att.id, error }, "team");
      }
    });

    // Get overtime for current month
    const currentMonthOvertime = await prisma.overtime.findMany({
      where: {
        userId: memberId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        approved: true,
      },
      select: {
        hours: true,
      },
    });

    currentMonthOvertime.forEach((ot) => {
      overtimeHours += ot.hours;
    });

    // Group attendance by month for calendar view
    const attendanceByMonth: Record<string, AttendanceRecord[]> = {};
    if (attendanceWithHours && Array.isArray(attendanceWithHours)) {
      attendanceWithHours.forEach((att) => {
        try {
          if (att && att.checkInTime) {
            const date = new Date(att.checkInTime);
            if (!isNaN(date.getTime())) {
              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              if (!attendanceByMonth[monthKey]) {
                attendanceByMonth[monthKey] = [];
              }
              attendanceByMonth[monthKey].push(att);
            }
          }
        } catch (error) {
          logger.error("Error grouping attendance by month", { attendanceId: att?.id, error }, "team");
        }
      });
    }

    // Get all overtime records for monthly calculations
    const allOvertime = await prisma.overtime.findMany({
      where: {
        userId: memberId,
        approved: true,
      },
      select: {
        hours: true,
        date: true,
      },
    });

    // Calculate monthly totals
    const monthlyTotals: Record<string, { totalHours: number; totalOvertime: number; daysWorked: number }> = {};
    Object.keys(attendanceByMonth).forEach((monthKey) => {
      const monthAttendance = attendanceByMonth[monthKey];
      let monthHours = 0;
      let monthOvertime = 0;
      let monthDays = 0;
      
      monthAttendance.forEach((att) => {
        if (att.hoursWorked !== null) {
          monthDays++;
          monthHours += att.hoursWorked;
          monthOvertime += att.overtime;
        }
      });
      
      monthlyTotals[monthKey] = {
        totalHours: parseFloat(monthHours.toFixed(2)),
        totalOvertime: parseFloat(monthOvertime.toFixed(2)),
        daysWorked: monthDays,
      };
    });

    // Add overtime to monthly totals
    allOvertime.forEach((ot) => {
      const date = new Date(ot.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyTotals[monthKey]) {
        monthlyTotals[monthKey].totalOvertime += ot.hours;
        monthlyTotals[monthKey].totalOvertime = parseFloat(monthlyTotals[monthKey].totalOvertime.toFixed(2));
      } else {
        // Create new month entry if only has overtime
        monthlyTotals[monthKey] = {
          totalHours: 0,
          totalOvertime: parseFloat(ot.hours.toFixed(2)),
          daysWorked: 0,
        };
      }
    });

    const totalTasks = member.assignedTasks.length;
    const pendingTasks = member.assignedTasks.filter((t) => t.status === "PENDING").length;
    const inProgressTasks = member.assignedTasks.filter((t) => t.status === "IN_PROGRESS").length;
    const completedTasks = member.assignedTasks.filter((t) => t.status === "COMPLETED").length;

    // Ensure all data is properly formatted
    const formattedMember = {
      user: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        profilePicture: (member as any).profilePicture || null,
        department: (member as any).department || null,
        specialization: (member as any).specialization || null,
        createdAt: member.createdAt instanceof Date ? member.createdAt.toISOString() : member.createdAt,
        companies: member.companies,
      },
      stats: {
        daysWorked: daysWorked || 0,
        totalHours: parseFloat((totalHours || 0).toFixed(2)),
        overtimeHours: parseFloat((overtimeHours || 0).toFixed(2)),
        isCheckedIn: isCheckedIn || false,
        checkInTime: checkInTime || null,
        checkInLocation: checkInLocation || null,
        tasks: {
          total: totalTasks || 0,
          pending: pendingTasks || 0,
          inProgress: inProgressTasks || 0,
          completed: completedTasks || 0,
        },
      },
      attendance: Array.isArray(attendanceWithHours) ? attendanceWithHours : [],
      attendanceByMonth: attendanceByMonth || {},
      monthlyTotals: monthlyTotals || {},
    };

    logger.debug("Get team member details success", {
      memberId,
      hasAttendance: formattedMember.attendance.length > 0,
      monthsCount: Object.keys(formattedMember.attendanceByMonth).length,
    }, "team");

    return NextResponse.json({
      success: true,
      data: formattedMember,
    });
  } catch (error: any) {
    logger.error("Get team member details error", error, "team");
    
    // Return more detailed error in development
    const errorMessage = process.env.NODE_ENV === "development"
      ? `${error.message} (${error.name})`
      : error.message || "Failed to get team member details";
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        ...(process.env.NODE_ENV === "development" && {
          details: error.stack,
        }),
      },
      { status: 500 }
    );
  }
}

// PATCH - Update member
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check permission using RBAC - HR and Admin can update team members
    const { userId, companyId } = await authorize(PermissionAction.USER_UPDATE);
    
    const session = await requireAuth();
    const userRole = session.user.role;
    const isAdmin = userRole === UserRole.ADMIN || userRole === "ADMIN" || String(userRole) === "ADMIN";
    
    const { id } = await params;
    const memberId = parseInt(id);

    if (isNaN(memberId)) {
      return NextResponse.json(
        { success: false, error: "Invalid member ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, role, department, specialization, password, phone, isActive } = body;

    // CRITICAL: Prevent user from editing their own account through this endpoint
    if (memberId === userId) {
      return NextResponse.json(
        { success: false, error: "Cannot edit your own account through this endpoint. Please use profile settings." },
        { status: 403 }
      );
    }

    // Check if member exists and belongs to same company
    const existingMember = await prisma.users.findUnique({
      where: { id: memberId },
      select: { companyId: true, role: true },
    });

    if (!existingMember) {
      return NextResponse.json(
        { success: false, error: "Team member not found" },
        { status: 404 }
      );
    }

    if (existingMember.companyId !== session.user.companyId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Member belongs to different company" },
        { status: 403 }
      );
    }

    // Admin can edit any team member (including other Admins)
    // But prevent editing Admin accounts if not Admin
    // Note: isAdmin is already defined above (line 398)
    
    // Only allow editing team member roles (all team module roles)
    const allowedTeamRoles = [
      UserRole.TECHNICIAN,
      UserRole.SUPERVISOR,
      UserRole.HR,
      UserRole.OPERATIONS_MANAGER,
      UserRole.ACCOUNTANT,
      UserRole.ADMIN, // Admin can edit Admin accounts
    ];
    
    // If trying to edit an Admin account, only Admin can do that
    if (existingMember.role === UserRole.ADMIN && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Only administrators can edit administrator accounts" },
        { status: 403 }
      );
    }
    
    // If member is not in allowed roles, check if Admin is trying to edit them
    if (!allowedTeamRoles.includes(existingMember.role) && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Can only edit team member accounts" },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) {
      // Check if email is already taken by another user
      const emailExists = await prisma.users.findFirst({
        where: {
          email,
          id: { not: memberId },
        },
      });
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: "Email already in use" },
          { status: 400 }
        );
      }
      updateData.email = email;
    }
    
    // Check if trying to assign role
    // CRITICAL: Only update role if it's explicitly provided AND different from current role
    // AND it's a valid role change
    if (role !== undefined && role !== null && String(role).trim() !== "") {
      // Convert to string for comparison
      const newRole = String(role).trim();
      const currentRole = String(existingMember.role).trim();
      
      // Only update if role is actually different
      if (newRole !== currentRole) {
        // Validate role is a valid team role
        // Convert allowedTeamRoles to strings for comparison
        const allowedRoleStrings = allowedTeamRoles.map(r => String(r));
        if (!allowedRoleStrings.includes(newRole)) {
          return NextResponse.json(
            { 
              success: false, 
              error: "Can only assign team member roles",
              debug: {
                providedRole: newRole,
                allowedRoles: allowedRoleStrings,
              }
            },
            { status: 403 }
          );
        }
        
        // CRITICAL: Prevent changing role to Admin unless current user is Admin
        if (newRole === "ADMIN" && !isAdmin) {
          return NextResponse.json(
            { success: false, error: "Only administrators can assign the Admin role" },
            { status: 403 }
          );
        }
        
        // CRITICAL: Prevent changing Admin role to something else unless current user is Admin
        if (currentRole === "ADMIN" && newRole !== "ADMIN" && !isAdmin) {
          return NextResponse.json(
            { success: false, error: "Only administrators can change Admin role" },
            { status: 403 }
          );
        }
        
        // Check if user can assign this role using RBAC
        await requireCanAssignRole(newRole as UserRole);
        
        // Log role change for audit
        logger.info("Role change", { userId, adminRole: session.user.role, memberId, fromRole: currentRole, toRole: newRole }, "team");
        
        // Create audit log for role change
        const auditContext = getAuditContext(request);
        await createAuditLog({
          companyId: companyId,
          userId: userId,
          userName: session.user.name,
          userRole: session.user.role,
          action: AuditAction.USER_ROLE_CHANGED,
          resource: AuditResource.USER,
          resourceId: memberId,
          details: {
            targetUserId: memberId,
            targetUserEmail: existingMember.email,
            oldRole: currentRole,
            newRole: newRole,
          },
          ...auditContext,
        });
        
        updateData.role = newRole as UserRole;
      }
      // If role is same as current, don't include it in update (no change needed)
    }
    if (department !== undefined) updateData.department = department;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) {
      updateData.isActive = isActive;
      // Log status change for audit
      const auditContext = getAuditContext(request);
      await createAuditLog({
        companyId: companyId,
        userId: userId,
        userName: session.user.name,
        userRole: session.user.role,
        action: AuditAction.USER_STATUS_CHANGED,
        resource: AuditResource.USER,
        resourceId: memberId,
        details: {
          targetUserId: memberId,
          targetUserEmail: existingMember.email,
          oldStatus: existingMember.isActive,
          newStatus: isActive,
        },
        ...auditContext,
      });
    }
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
      // Log password change for audit
      const auditContext = getAuditContext(request);
      await createAuditLog({
        companyId: companyId,
        userId: userId,
        userName: session.user.name,
        userRole: session.user.role,
        action: AuditAction.USER_PASSWORD_CHANGED,
        resource: AuditResource.USER,
        resourceId: memberId,
        details: {
          targetUserId: memberId,
          targetUserEmail: existingMember.email,
        },
        ...auditContext,
      });
    }

    // CRITICAL: Double-check that we're not updating the current user's own account
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: "No changes to update" },
        { status: 400 }
      );
    }

    // CRITICAL: Final validation - ensure we're not accidentally updating the wrong user
    const finalCheck = await prisma.users.findUnique({
      where: { id: memberId },
      select: { id: true, role: true, email: true },
    });

    if (!finalCheck) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    // Audit log for user update (if any changes were made)
    if (Object.keys(updateData).length > 0) {
      const auditContext = getAuditContext(request);
      await createAuditLog({
        companyId: companyId,
        userId: userId,
        userName: session.user.name,
        userRole: session.user.role,
        action: AuditAction.USER_UPDATED,
        resource: AuditResource.USER,
        resourceId: memberId,
        details: {
          targetUserId: memberId,
          targetUserEmail: existingMember.email,
          changes: Object.keys(updateData),
        },
        ...auditContext,
      });
    }

    // Log the update for audit trail
    logger.debug("Update team member request", {
      adminId: userId,
      adminRole: session.user.role,
      memberId: memberId,
      memberCurrentRole: finalCheck.role,
      updateData: updateData,
      timestamp: new Date().toISOString(),
    });

    const updatedMember = await prisma.users.update({
      where: { id: memberId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        department: true,
        specialization: true,
        isActive: true,
      },
    });

    // CRITICAL: Verify the update didn't accidentally change the user's own role
    if (updatedMember.id === userId) {
      // This should never happen due to our earlier check, but double-check
      const adminCheck = await prisma.users.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      
      if (adminCheck && adminCheck.role !== UserRole.ADMIN && adminCheck.role !== "ADMIN") {
        // Emergency rollback - restore original role
        await prisma.users.update({
          where: { id: userId },
          data: { role: UserRole.ADMIN },
        });
        
        return NextResponse.json(
          { 
            success: false, 
            error: "CRITICAL: Attempted to change Admin role. Operation blocked and rolled back." 
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedMember,
      message: "Team member updated successfully",
    });
  } catch (error: any) {
    console.error("Update team member error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to update team member",
        ...(process.env.NODE_ENV === "development" && {
          details: error.stack,
        })
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check permission using RBAC - HR and Admin can delete team members
    const { userId, companyId } = await authorize(PermissionAction.USER_DELETE);
    
    const session = await requireAuth();
    const { id } = await params;
    const memberId = parseInt(id);

    if (isNaN(memberId)) {
      return NextResponse.json(
        { success: false, error: "Invalid member ID" },
        { status: 400 }
      );
    }

    // Check if member exists and belongs to same company
    const existingMember = await prisma.users.findUnique({
      where: { id: memberId },
      select: { companyId: true, role: true },
    });

    if (!existingMember) {
      return NextResponse.json(
        { success: false, error: "Team member not found" },
        { status: 404 }
      );
    }

    if (existingMember.companyId !== session.user.companyId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Member belongs to different company" },
        { status: 403 }
      );
    }

    // Only allow deleting team member roles (not Admin)
    const allowedTeamRoles = [
      UserRole.TECHNICIAN,
      UserRole.SUPERVISOR,
      UserRole.HR,
      UserRole.OPERATIONS_MANAGER,
      UserRole.ACCOUNTANT,
    ];
    
    if (!allowedTeamRoles.includes(existingMember.role)) {
      return NextResponse.json(
        { success: false, error: "Can only delete team member accounts" },
        { status: 403 }
      );
    }

    // Prevent deleting yourself
    if (memberId === userId) {
      return NextResponse.json(
        { success: false, error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    await prisma.users.delete({
      where: { id: memberId },
    });

    return NextResponse.json({
      success: true,
      message: "Team member deleted successfully",
    });
  } catch (error: any) {
    logger.error("Delete team member error", error, "team");
    return handleApiError(error);
      { status: 500 }
    );
  }
}
