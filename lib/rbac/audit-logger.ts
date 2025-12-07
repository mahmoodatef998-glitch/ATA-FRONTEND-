/**
 * Audit Logging Service
 * Tracks critical actions for security and compliance
 */

import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { logger } from "@/lib/logger";

export enum AuditAction {
  // User Management
  USER_CREATED = "user.created",
  USER_UPDATED = "user.updated",
  USER_DELETED = "user.deleted",
  USER_ROLE_CHANGED = "user.role_changed",
  USER_STATUS_CHANGED = "user.status_changed",
  USER_PASSWORD_CHANGED = "user.password_changed",
  
  // Attendance Management
  ATTENDANCE_CREATED = "attendance.created",
  ATTENDANCE_UPDATED = "attendance.updated",
  ATTENDANCE_DELETED = "attendance.deleted",
  ATTENDANCE_APPROVED = "attendance.approved",
  ATTENDANCE_REJECTED = "attendance.rejected",
  
  // Task Management
  TASK_CREATED = "task.created",
  TASK_UPDATED = "task.updated",
  TASK_DELETED = "task.deleted",
  TASK_COMPLETED = "task.completed",
  TASK_ASSIGNED = "task.assigned",
  
  // Order Management
  ORDER_CREATED = "order.created",
  ORDER_UPDATED = "order.updated",
  ORDER_DELETED = "order.deleted",
  ORDER_STATUS_CHANGED = "order.status_changed",
  ORDER_STAGE_CHANGED = "order.stage_changed",
  
  // Client Management
  CLIENT_CREATED = "client.created",
  CLIENT_UPDATED = "client.updated",
  CLIENT_DELETED = "client.deleted",
  CLIENT_APPROVED = "client.approved",
  CLIENT_REJECTED = "client.rejected",
  
  // Invoice Management
  INVOICE_CREATED = "invoice.created",
  INVOICE_UPDATED = "invoice.updated",
  INVOICE_DELETED = "invoice.deleted",
  INVOICE_SENT = "invoice.sent",
  INVOICE_PAID = "invoice.paid",
  
  // Quotation Management
  QUOTATION_CREATED = "quotation.created",
  QUOTATION_UPDATED = "quotation.updated",
  QUOTATION_DELETED = "quotation.deleted",
  QUOTATION_SENT = "quotation.sent",
  QUOTATION_ACCEPTED = "quotation.accepted",
  QUOTATION_REJECTED = "quotation.rejected",
  
  // System Settings
  SETTINGS_UPDATED = "settings.updated",
  COMPANY_SETTINGS_UPDATED = "company.settings_updated",
  OFFICE_LOCATION_UPDATED = "company.location_updated",
  
  // Permission Management
  PERMISSION_GRANTED = "permission.granted",
  PERMISSION_REVOKED = "permission.revoked",
  ROLE_PERMISSIONS_UPDATED = "role.permissions_updated",
}

export enum AuditResource {
  USER = "user",
  ATTENDANCE = "attendance",
  TASK = "task",
  ORDER = "order",
  CLIENT = "client",
  INVOICE = "invoice",
  QUOTATION = "quotation",
  SETTINGS = "settings",
  COMPANY = "company",
  ROLE = "role",
}

export interface AuditLogData {
  companyId: number;
  userId?: number;
  userName?: string;
  userRole?: UserRole;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: number;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.audit_logs.create({
      data: {
        companyId: data.companyId,
        userId: data.userId,
        userName: data.userName,
        userRole: data.userRole,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        details: data.details || {},
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
    
    logger.info("Audit log created", {
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      userId: data.userId,
      context: "audit",
    });
  } catch (error) {
    // Don't throw error - audit logging should not break the main flow
    logger.error("Failed to create audit log", error, "audit");
  }
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(params: {
  companyId: number;
  userId?: number;
  action?: AuditAction;
  resource?: AuditResource;
  resourceId?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const {
    companyId,
    userId,
    action,
    resource,
    resourceId,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = params;

  const where: any = {
    companyId,
  };

  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (resource) where.resource = resource;
  if (resourceId) where.resourceId = resourceId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.audit_logs.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
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
    }),
    prisma.audit_logs.count({ where }),
  ]);

  return {
    logs,
    total,
    limit,
    offset,
  };
}

/**
 * Helper to get user info from request for audit logging
 */
export function getAuditContext(request?: Request): {
  ipAddress?: string;
  userAgent?: string;
} {
  if (!request) return {};
  
  return {
    ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0] || 
               request.headers.get("x-real-ip") || 
               undefined,
    userAgent: request.headers.get("user-agent") || undefined,
  };
}


