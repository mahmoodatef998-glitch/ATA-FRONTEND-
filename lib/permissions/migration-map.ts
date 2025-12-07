/**
 * Permission Migration Map
 * Maps old Permission enum to new PermissionAction enum
 * Used for backward compatibility during migration
 */

import { PermissionAction } from "./role-permissions";

// Old Permission enum (from lib/permissions.ts)
export enum Permission {
  VIEW_ORDERS = "VIEW_ORDERS",
  CREATE_ORDERS = "CREATE_ORDERS",
  UPDATE_ORDERS = "UPDATE_ORDERS",
  DELETE_ORDERS = "DELETE_ORDERS",
  VIEW_PAYMENTS = "VIEW_PAYMENTS",
  CREATE_PAYMENTS = "CREATE_PAYMENTS",
  UPDATE_PAYMENTS = "UPDATE_PAYMENTS",
  DELETE_PAYMENTS = "DELETE_PAYMENTS",
  VIEW_MANUFACTURING = "VIEW_MANUFACTURING",
  UPDATE_MANUFACTURING_STAGE = "UPDATE_MANUFACTURING_STAGE",
  MANAGE_MANUFACTURING = "MANAGE_MANUFACTURING",
  VIEW_QUOTATIONS = "VIEW_QUOTATIONS",
  CREATE_QUOTATIONS = "CREATE_QUOTATIONS",
  UPDATE_QUOTATIONS = "UPDATE_QUOTATIONS",
  SEND_QUOTATIONS = "SEND_QUOTATIONS",
  VIEW_POS = "VIEW_POS",
  CREATE_POS = "CREATE_POS",
  UPDATE_POS = "UPDATE_POS",
  VIEW_DELIVERY_NOTES = "VIEW_DELIVERY_NOTES",
  CREATE_DELIVERY_NOTES = "CREATE_DELIVERY_NOTES",
  UPDATE_DELIVERY_NOTES = "UPDATE_DELIVERY_NOTES",
  VIEW_CLIENTS = "VIEW_CLIENTS",
  CREATE_CLIENTS = "CREATE_CLIENTS",
  UPDATE_CLIENTS = "UPDATE_CLIENTS",
  MANAGE_USERS = "MANAGE_USERS",
  MANAGE_COMPANIES = "MANAGE_COMPANIES",
  VIEW_REPORTS = "VIEW_REPORTS",
  SYSTEM_SETTINGS = "SYSTEM_SETTINGS",
  VIEW_ATTENDANCE = "VIEW_ATTENDANCE",
  MANAGE_ATTENDANCE = "MANAGE_ATTENDANCE",
  VIEW_TASKS = "VIEW_TASKS",
  CREATE_TASKS = "CREATE_TASKS",
  UPDATE_TASKS = "UPDATE_TASKS",
  ASSIGN_TASKS = "ASSIGN_TASKS",
  VIEW_WORKLOGS = "VIEW_WORKLOGS",
  SUBMIT_WORKLOGS = "SUBMIT_WORKLOGS",
  APPROVE_WORKLOGS = "APPROVE_WORKLOGS",
  VIEW_OVERTIME = "VIEW_OVERTIME",
  APPROVE_OVERTIME = "APPROVE_OVERTIME",
  VIEW_KPI = "VIEW_KPI",
  MANAGE_KPI = "MANAGE_KPI",
  SUBMIT_REVIEWS = "SUBMIT_REVIEWS",
  VIEW_REVIEWS = "VIEW_REVIEWS",
}

/**
 * Mapping from old Permission to new PermissionAction
 */
export const PERMISSION_MIGRATION_MAP: Record<Permission, PermissionAction> = {
  // Orders → Leads
  [Permission.VIEW_ORDERS]: PermissionAction.LEAD_READ,
  [Permission.CREATE_ORDERS]: PermissionAction.LEAD_CREATE,
  [Permission.UPDATE_ORDERS]: PermissionAction.LEAD_UPDATE,
  [Permission.DELETE_ORDERS]: PermissionAction.LEAD_DELETE,

  // Payments → Finance
  [Permission.VIEW_PAYMENTS]: PermissionAction.INVOICE_READ,
  [Permission.CREATE_PAYMENTS]: PermissionAction.PAYMENT_RECORD,
  [Permission.UPDATE_PAYMENTS]: PermissionAction.PAYMENT_RECORD,
  [Permission.DELETE_PAYMENTS]: PermissionAction.INVOICE_DELETE,

  // Manufacturing → Leads/Tasks
  [Permission.VIEW_MANUFACTURING]: PermissionAction.LEAD_READ,
  [Permission.UPDATE_MANUFACTURING_STAGE]: PermissionAction.LEAD_MOVE_STAGE,
  [Permission.MANAGE_MANUFACTURING]: PermissionAction.LEAD_UPDATE,

  // Quotations → Invoices
  [Permission.VIEW_QUOTATIONS]: PermissionAction.INVOICE_READ,
  [Permission.CREATE_QUOTATIONS]: PermissionAction.INVOICE_CREATE,
  [Permission.UPDATE_QUOTATIONS]: PermissionAction.INVOICE_UPDATE,
  [Permission.SEND_QUOTATIONS]: PermissionAction.INVOICE_UPDATE,

  // Purchase Orders → Leads
  [Permission.VIEW_POS]: PermissionAction.LEAD_READ,
  [Permission.CREATE_POS]: PermissionAction.LEAD_CREATE,
  [Permission.UPDATE_POS]: PermissionAction.LEAD_UPDATE,

  // Delivery Notes → Leads
  [Permission.VIEW_DELIVERY_NOTES]: PermissionAction.LEAD_READ,
  [Permission.CREATE_DELIVERY_NOTES]: PermissionAction.LEAD_CREATE,
  [Permission.UPDATE_DELIVERY_NOTES]: PermissionAction.LEAD_UPDATE,

  // Clients
  [Permission.VIEW_CLIENTS]: PermissionAction.CLIENT_READ,
  [Permission.CREATE_CLIENTS]: PermissionAction.CLIENT_CREATE,
  [Permission.UPDATE_CLIENTS]: PermissionAction.CLIENT_UPDATE,

  // Users
  [Permission.MANAGE_USERS]: PermissionAction.USER_UPDATE,
  [Permission.MANAGE_COMPANIES]: PermissionAction.SETTING_UPDATE,

  // Reports
  [Permission.VIEW_REPORTS]: PermissionAction.REPORT_VIEW,
  [Permission.SYSTEM_SETTINGS]: PermissionAction.SETTING_UPDATE,

  // Attendance
  [Permission.VIEW_ATTENDANCE]: PermissionAction.ATTENDANCE_READ,
  [Permission.MANAGE_ATTENDANCE]: PermissionAction.ATTENDANCE_MANAGE,

  // Tasks
  [Permission.VIEW_TASKS]: PermissionAction.TASK_READ,
  [Permission.CREATE_TASKS]: PermissionAction.TASK_CREATE,
  [Permission.UPDATE_TASKS]: PermissionAction.TASK_UPDATE,
  [Permission.ASSIGN_TASKS]: PermissionAction.TASK_ASSIGN,

  // Work Logs → Tasks/Comments
  [Permission.VIEW_WORKLOGS]: PermissionAction.TASK_READ,
  [Permission.SUBMIT_WORKLOGS]: PermissionAction.TASK_COMMENT,
  [Permission.APPROVE_WORKLOGS]: PermissionAction.TASK_COMPLETE,

  // Overtime → Attendance
  [Permission.VIEW_OVERTIME]: PermissionAction.ATTENDANCE_READ,
  [Permission.APPROVE_OVERTIME]: PermissionAction.ATTENDANCE_MANAGE,

  // KPI → Reports
  [Permission.VIEW_KPI]: PermissionAction.REPORT_VIEW,
  [Permission.MANAGE_KPI]: PermissionAction.REPORT_GENERATE,

  // Reviews → Tasks/Comments
  [Permission.SUBMIT_REVIEWS]: PermissionAction.TASK_COMMENT,
  [Permission.VIEW_REVIEWS]: PermissionAction.TASK_READ,
};

/**
 * Convert old Permission to new PermissionAction
 */
export function migratePermission(oldPermission: Permission): PermissionAction {
  return PERMISSION_MIGRATION_MAP[oldPermission] || PermissionAction.USER_READ;
}

/**
 * Check if old permission exists in migration map
 */
export function hasMigration(oldPermission: Permission): boolean {
  return oldPermission in PERMISSION_MIGRATION_MAP;
}


