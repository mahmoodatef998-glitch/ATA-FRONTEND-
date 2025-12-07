/**
 * Role-Based Permissions System
 * Granular permissions using dot notation
 */

import { UserRole } from "@prisma/client";

/**
 * Permission Actions
 * Defines all possible actions a user can perform using dot notation
 */
export enum PermissionAction {
  // Users Management
  USER_CREATE = "user.create",
  USER_READ = "user.read",
  USER_UPDATE = "user.update",
  USER_DELETE = "user.delete",
  ROLE_MANAGE = "role.manage",

  // Clients Management
  CLIENT_CREATE = "client.create",
  CLIENT_READ = "client.read",
  CLIENT_UPDATE = "client.update",
  CLIENT_DELETE = "client.delete",

  // Leads Management
  LEAD_CREATE = "lead.create",
  LEAD_READ = "lead.read",
  LEAD_UPDATE = "lead.update",
  LEAD_DELETE = "lead.delete",
  LEAD_MOVE_STAGE = "lead.move_stage",

  // Tasks Management
  TASK_CREATE = "task.create",
  TASK_READ = "task.read",
  TASK_UPDATE = "task.update",
  TASK_DELETE = "task.delete",
  TASK_ASSIGN = "task.assign",
  TASK_COMPLETE = "task.complete",
  TASK_COMMENT = "task.comment",
  TASK_CHANGE_PRIORITY = "task.change_priority",

  // Attendance Management
  ATTENDANCE_CLOCK = "attendance.clock",
  ATTENDANCE_READ = "attendance.read",
  ATTENDANCE_MANAGE = "attendance.manage",

  // Finance Management
  INVOICE_CREATE = "invoice.create",
  INVOICE_READ = "invoice.read",
  INVOICE_UPDATE = "invoice.update",
  INVOICE_DELETE = "invoice.delete",
  PAYMENT_RECORD = "payment.record",
  FINANCE_REPORTS = "finance.reports",
  
  // Purchase Orders
  PO_CREATE = "po.create",
  PO_READ = "po.read",
  PO_UPDATE = "po.update",
  PO_DELETE = "po.delete",
  
  // Overview/Dashboard
  OVERVIEW_VIEW = "overview.view",

  // HR Management
  HR_VIEW = "hr.view",
  HR_MANAGE = "hr.manage",
  PAYROLL_MANAGE = "payroll.manage",

  // Reports
  REPORT_VIEW = "report.view",
  REPORT_GENERATE = "report.generate",

  // Files Management
  FILE_UPLOAD = "file.upload",
  FILE_READ = "file.read",
  FILE_DELETE = "file.delete",

  // System Settings
  SETTING_VIEW = "setting.view",
  SETTING_UPDATE = "setting.update",
  AUDIT_READ = "audit.read",

  // Legacy/Backward Compatibility (mapped to new permissions)
  // Team Members (mapped to user.*)
  TEAM_MEMBERS_CREATE = "user.create",
  TEAM_MEMBERS_READ = "user.read",
  TEAM_MEMBERS_UPDATE = "user.update",
  TEAM_MEMBERS_DELETE = "user.delete",
  TEAM_MEMBERS_ASSIGN_ROLE = "role.manage",
  
  // Attendance (mapped to attendance.*)
  ATTENDANCE_CREATE = "attendance.clock",
  ATTENDANCE_READ_OWN = "attendance.read",
  ATTENDANCE_READ_ALL = "attendance.read",
  ATTENDANCE_UPDATE = "attendance.manage",
  ATTENDANCE_APPROVE = "attendance.manage",
  ATTENDANCE_DELETE = "attendance.manage",
  
  // Tasks (mapped to task.*)
  TASKS_CREATE = "task.create",
  TASKS_READ_OWN = "task.read",
  TASKS_READ_ALL = "task.read",
  TASKS_UPDATE_OWN = "task.update",
  TASKS_UPDATE_ALL = "task.update",
  TASKS_DELETE = "task.delete",
  TASKS_MARK_COMPLETED = "task.complete",
  TASKS_ASSIGN = "task.assign",
  
  // System Access (mapped to setting.*)
  ACCESS_DASHBOARD = "setting.view",
  ACCESS_ORDERS = "setting.view",
  ACCESS_CLIENTS = "setting.view",
  ACCESS_SETTINGS = "setting.update",
  
  // Orders (mapped to lead.* for now, can be extended)
  ORDERS_CREATE = "lead.create",
  ORDERS_READ = "lead.read",
  ORDERS_UPDATE = "lead.update",
  ORDERS_DELETE = "lead.delete",
  ORDERS_UPDATE_STATUS = "lead.move_stage",
  ORDERS_UPDATE_STAGE = "lead.move_stage",
  ORDERS_VIEW_ALL = "lead.read",
  
  // Clients (already mapped)
  CLIENTS_CREATE = "client.create",
  CLIENTS_READ = "client.read",
  CLIENTS_UPDATE = "client.update",
  CLIENTS_DELETE = "client.delete",
  CLIENTS_APPROVE = "client.update",
  CLIENTS_REJECT = "client.update",
  
  // Invoices (already mapped)
  INVOICES_CREATE = "invoice.create",
  INVOICES_READ = "invoice.read",
  INVOICES_UPDATE = "invoice.update",
  INVOICES_DELETE = "invoice.delete",
  INVOICES_SEND = "invoice.update",
  INVOICES_MARK_PAID = "payment.record",
  
  // Quotations (mapped to invoice.* for now)
  QUOTATIONS_CREATE = "invoice.create",
  QUOTATIONS_READ = "invoice.read",
  QUOTATIONS_UPDATE = "invoice.update",
  QUOTATIONS_DELETE = "invoice.delete",
  QUOTATIONS_SEND = "invoice.update",
  QUOTATIONS_ACCEPT = "invoice.update",
  QUOTATIONS_REJECT = "invoice.update",
  
  // Audit & Reports (already mapped)
  AUDIT_LOGS_READ = "audit.read",
  REPORTS_VIEW = "report.view",
  REPORTS_EXPORT = "report.generate",
}

/**
 * Permission Resource
 * Defines resources that can be accessed
 */
export enum PermissionResource {
  USER = "user",
  CLIENT = "client",
  LEAD = "lead",
  TASK = "task",
  ATTENDANCE = "attendance",
  INVOICE = "invoice",
  PAYMENT = "payment",
  FINANCE = "finance",
  HR = "hr",
  PAYROLL = "payroll",
  REPORT = "report",
  FILE = "file",
  SETTING = "setting",
  AUDIT = "audit",
  // Legacy resources
  TEAM_MEMBERS = "user",
  TASKS = "task",
  ORDERS = "lead",
  CLIENTS = "client",
  INVOICES = "invoice",
  QUOTATIONS = "invoice",
  DASHBOARD = "setting",
  SETTINGS = "setting",
  REPORTS = "report",
}

/**
 * Role Permission Map
 * Defines what each role can do
 */
export const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  // Admin - All permissions (*), including role.manage and audit.read
  [UserRole.ADMIN]: [
    // Users
    PermissionAction.USER_CREATE,
    PermissionAction.USER_READ,
    PermissionAction.USER_UPDATE,
    PermissionAction.USER_DELETE,
    PermissionAction.ROLE_MANAGE,
    
    // Clients
    PermissionAction.CLIENT_CREATE,
    PermissionAction.CLIENT_READ,
    PermissionAction.CLIENT_UPDATE,
    PermissionAction.CLIENT_DELETE,
    
    // Leads
    PermissionAction.LEAD_CREATE,
    PermissionAction.LEAD_READ,
    PermissionAction.LEAD_UPDATE,
    PermissionAction.LEAD_DELETE,
    PermissionAction.LEAD_MOVE_STAGE,
    
    // Tasks
    PermissionAction.TASK_CREATE,
    PermissionAction.TASK_READ,
    PermissionAction.TASK_UPDATE,
    PermissionAction.TASK_DELETE,
    PermissionAction.TASK_ASSIGN,
    PermissionAction.TASK_COMPLETE,
    PermissionAction.TASK_COMMENT,
    PermissionAction.TASK_CHANGE_PRIORITY,
    
    // Attendance
    PermissionAction.ATTENDANCE_CLOCK,
    PermissionAction.ATTENDANCE_READ,
    PermissionAction.ATTENDANCE_MANAGE,
    
    // Finance
    PermissionAction.INVOICE_CREATE,
    PermissionAction.INVOICE_READ,
    PermissionAction.INVOICE_UPDATE,
    PermissionAction.INVOICE_DELETE,
    PermissionAction.PAYMENT_RECORD,
    PermissionAction.FINANCE_REPORTS,
    
    // HR
    PermissionAction.HR_VIEW,
    PermissionAction.HR_MANAGE,
    PermissionAction.PAYROLL_MANAGE,
    
    // Reports
    PermissionAction.REPORT_VIEW,
    PermissionAction.REPORT_GENERATE,
    
    // Files
    PermissionAction.FILE_UPLOAD,
    PermissionAction.FILE_READ,
    PermissionAction.FILE_DELETE,
    
    // System
    PermissionAction.SETTING_VIEW,
    PermissionAction.SETTING_UPDATE,
    PermissionAction.AUDIT_READ,
  ],

  // Operations Manager
  // Permissions: client.create, client.read, client.update
  // lead.* (all lead permissions)
  // task.* (all task permissions)
  // attendance.read
  // report.view, report.generate
  // file.read, file.upload
  // Forbidden: role.manage, user.delete, invoice.delete, setting.update
  [UserRole.OPERATIONS_MANAGER]: [
    // Clients - Create, Read, Update (no delete)
    PermissionAction.CLIENT_CREATE,
    PermissionAction.CLIENT_READ,
    PermissionAction.CLIENT_UPDATE,
    
    // Leads - All permissions
    PermissionAction.LEAD_CREATE,
    PermissionAction.LEAD_READ,
    PermissionAction.LEAD_UPDATE,
    PermissionAction.LEAD_DELETE,
    PermissionAction.LEAD_MOVE_STAGE,
    
    // Tasks - All permissions
    PermissionAction.TASK_CREATE,
    PermissionAction.TASK_READ,
    PermissionAction.TASK_UPDATE,
    PermissionAction.TASK_DELETE,
    PermissionAction.TASK_ASSIGN,
    PermissionAction.TASK_COMPLETE,
    PermissionAction.TASK_COMMENT,
    PermissionAction.TASK_CHANGE_PRIORITY,
    
    // Attendance - Read only
    PermissionAction.ATTENDANCE_READ,
    
    // Reports
    PermissionAction.REPORT_VIEW,
    PermissionAction.REPORT_GENERATE,
    
    // Files
    PermissionAction.FILE_READ,
    PermissionAction.FILE_UPLOAD,
    
    // System - View only (no update)
    PermissionAction.SETTING_VIEW,
  ],

  // Accountant
  // Permissions: invoice.create, invoice.read, invoice.update
  // payment.record
  // finance.reports
  // client.read
  // Forbidden: task.*, hr.manage, role.manage
  [UserRole.ACCOUNTANT]: [
    // Invoices - Create, Read, Update (no delete)
    PermissionAction.INVOICE_CREATE,
    PermissionAction.INVOICE_READ,
    PermissionAction.INVOICE_UPDATE,
    
    // Payment
    PermissionAction.PAYMENT_RECORD,
    
    // Finance Reports
    PermissionAction.FINANCE_REPORTS,
    
    // Clients - Read only
    PermissionAction.CLIENT_READ,
  ],

  // HR
  // Permissions: hr.view, hr.manage
  // attendance.read, attendance.manage
  // user.read, user.update (employee profiles)
  // file.read, file.upload (employee documents)
  // Forbidden: payment.record, role.manage
  [UserRole.HR]: [
    // HR - Full access
    PermissionAction.HR_VIEW,
    PermissionAction.HR_MANAGE,
    
    // Attendance - Read and Manage
    PermissionAction.ATTENDANCE_READ,
    PermissionAction.ATTENDANCE_MANAGE,
    
    // Users - Read and Update (employee profiles)
    PermissionAction.USER_READ,
    PermissionAction.USER_UPDATE,
    
    // Files - Read and Upload (employee documents)
    PermissionAction.FILE_READ,
    PermissionAction.FILE_UPLOAD,
  ],

  // Supervisor
  // Permissions: task.create, task.read, task.update, task.assign (assign only to technician)
  // task.comment, task.complete (for supervised technicians)
  // attendance.read (team only)
  // client.read
  // Forbidden: create clients, finance, role.manage
  [UserRole.SUPERVISOR]: [
    // Tasks - Create, Read, Update, Assign, Comment, Complete
    PermissionAction.TASK_CREATE,
    PermissionAction.TASK_READ,
    PermissionAction.TASK_UPDATE,
    PermissionAction.TASK_ASSIGN,
    PermissionAction.TASK_COMMENT,
    PermissionAction.TASK_COMPLETE,
    
    // Attendance - Read (team only)
    PermissionAction.ATTENDANCE_READ,
    
    // Clients - Read only
    PermissionAction.CLIENT_READ,
  ],

  // Technician
  // Permissions: task.read (assigned tasks only), task.update (status/photos), task.comment
  // attendance.clock (own)
  // file.upload (task attachments)
  // Forbidden: view other employees' data, finance, role.manage
  [UserRole.TECHNICIAN]: [
    // Tasks - Read (assigned only), Update (status/photos), Comment
    PermissionAction.TASK_READ,
    PermissionAction.TASK_UPDATE,
    PermissionAction.TASK_COMMENT,
    
    // Attendance - Clock (own)
    PermissionAction.ATTENDANCE_CLOCK,
    
    // Files - Upload (task attachments)
    PermissionAction.FILE_UPLOAD,
  ],

  // Other roles (no team module access)
  [UserRole.FACTORY_SUPERVISOR]: [
    // Leads - Read and update stages
    PermissionAction.LEAD_READ,
    PermissionAction.LEAD_UPDATE,
    PermissionAction.LEAD_MOVE_STAGE,
    
    // Tasks - Read and update
    PermissionAction.TASK_READ,
    PermissionAction.TASK_UPDATE,
    PermissionAction.TASK_COMPLETE,
    PermissionAction.TASK_COMMENT,
    
    // Files
    PermissionAction.FILE_READ,
  ],
  
  [UserRole.SALES_REP]: [
    // Clients - Full access
    PermissionAction.CLIENT_CREATE,
    PermissionAction.CLIENT_READ,
    PermissionAction.CLIENT_UPDATE,
    
    // Leads - Full access
    PermissionAction.LEAD_CREATE,
    PermissionAction.LEAD_READ,
    PermissionAction.LEAD_UPDATE,
    PermissionAction.LEAD_MOVE_STAGE,
    
    // Reports - View
    PermissionAction.REPORT_VIEW,
    
    // Files
    PermissionAction.FILE_UPLOAD,
    PermissionAction.FILE_READ,
  ],
  
  [UserRole.CLIENT]: [
    // Leads - Read own
    PermissionAction.LEAD_READ,
    
    // Files - Read own
    PermissionAction.FILE_READ,
  ],
};

/**
 * Check if a role has a specific permission
 * @deprecated Use userHasPermission from @/lib/rbac/permission-service instead
 * This function is kept only for backward compatibility
 */
export function hasPermission(
  role: UserRole,
  action: PermissionAction
): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(action);
}

/**
 * Check if a role has any of the specified permissions
 * @deprecated Use userHasAnyPermission from @/lib/rbac/permission-service instead
 * This function is kept only for backward compatibility
 */
export function hasAnyPermission(
  role: UserRole,
  actions: PermissionAction[]
): boolean {
  return actions.some((action) => hasPermission(role, action));
}

/**
 * Check if a role has all of the specified permissions
 * @deprecated Use userHasAllPermissions from @/lib/rbac/permission-service instead
 * This function is kept only for backward compatibility
 */
export function hasAllPermissions(
  role: UserRole,
  actions: PermissionAction[]
): boolean {
  return actions.every((action) => hasPermission(role, action));
}

/**
 * Get all permissions for a role
 * @deprecated Use getUserPermissions from @/lib/rbac/permission-service instead
 * This function is kept only for backward compatibility
 */
export function getRolePermissions(role: UserRole): PermissionAction[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if role can assign another role
 * HR and Operations Manager cannot assign Admin role
 * @deprecated Use requireCanAssignRole from @/lib/permissions/middleware instead (uses RBAC)
 * This function is kept only for backward compatibility
 */
export function canAssignRole(
  assignerRole: UserRole,
  targetRole: UserRole
): boolean {
  // Admin can assign any role
  if (assignerRole === UserRole.ADMIN) {
    return true;
  }

  // HR and Operations Manager cannot assign Admin role
  if (
    (assignerRole === UserRole.HR || assignerRole === UserRole.OPERATIONS_MANAGER) &&
    targetRole === UserRole.ADMIN
  ) {
    return false;
  }

  // Check if assigner has permission to assign roles (legacy check)
  return hasPermission(assignerRole, PermissionAction.ROLE_MANAGE);
}

/**
 * Check if role can access Our Team module
 */
export function canAccessTeamModule(role: UserRole): boolean {
  const teamRoles = [
    UserRole.ADMIN,
    UserRole.HR,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SUPERVISOR,
    UserRole.TECHNICIAN,
    UserRole.ACCOUNTANT,
  ];
  return teamRoles.includes(role);
}

/**
 * Check if role can access other modules (outside Our Team)
 * Only Admin, Operations Manager, and Accountant can access Client CRM
 * Supervisor, HR, and Technician can only access Our Team section
 */
export function canAccessOtherModules(role: UserRole): boolean {
  const allowedRoles = [
    UserRole.ADMIN,
    UserRole.OPERATIONS_MANAGER,
    UserRole.ACCOUNTANT,
    // Removed: SUPERVISOR, HR, TECHNICIAN - they can only access Our Team section
    UserRole.SALES_REP,
    UserRole.FACTORY_SUPERVISOR,
  ];
  return allowedRoles.includes(role);
}

/**
 * Helper function to check permission by string (for dynamic checks)
 */
export function hasPermissionByString(
  role: UserRole,
  permissionString: string
): boolean {
  // Try to find matching PermissionAction
  const action = Object.values(PermissionAction).find(
    (action) => action === permissionString
  );
  
  if (action) {
    return hasPermission(role, action);
  }
  
  // If not found, return false
  return false;
}

/**
 * Get all permissions grouped by category
 */
export function getPermissionsByCategory(): Record<string, PermissionAction[]> {
  const categories: Record<string, PermissionAction[]> = {
    Users: [
      PermissionAction.USER_CREATE,
      PermissionAction.USER_READ,
      PermissionAction.USER_UPDATE,
      PermissionAction.USER_DELETE,
      PermissionAction.ROLE_MANAGE,
    ],
    Clients: [
      PermissionAction.CLIENT_CREATE,
      PermissionAction.CLIENT_READ,
      PermissionAction.CLIENT_UPDATE,
      PermissionAction.CLIENT_DELETE,
    ],
    Leads: [
      PermissionAction.LEAD_CREATE,
      PermissionAction.LEAD_READ,
      PermissionAction.LEAD_UPDATE,
      PermissionAction.LEAD_DELETE,
      PermissionAction.LEAD_MOVE_STAGE,
    ],
    Tasks: [
      PermissionAction.TASK_CREATE,
      PermissionAction.TASK_READ,
      PermissionAction.TASK_UPDATE,
      PermissionAction.TASK_DELETE,
      PermissionAction.TASK_ASSIGN,
      PermissionAction.TASK_COMPLETE,
      PermissionAction.TASK_COMMENT,
      PermissionAction.TASK_CHANGE_PRIORITY,
    ],
    Attendance: [
      PermissionAction.ATTENDANCE_CLOCK,
      PermissionAction.ATTENDANCE_READ,
      PermissionAction.ATTENDANCE_MANAGE,
    ],
    Finance: [
      PermissionAction.INVOICE_CREATE,
      PermissionAction.INVOICE_READ,
      PermissionAction.INVOICE_UPDATE,
      PermissionAction.INVOICE_DELETE,
      PermissionAction.PAYMENT_RECORD,
      PermissionAction.FINANCE_REPORTS,
    ],
    HR: [
      PermissionAction.HR_VIEW,
      PermissionAction.HR_MANAGE,
      PermissionAction.PAYROLL_MANAGE,
    ],
    Reports: [
      PermissionAction.REPORT_VIEW,
      PermissionAction.REPORT_GENERATE,
    ],
    Files: [
      PermissionAction.FILE_UPLOAD,
      PermissionAction.FILE_READ,
      PermissionAction.FILE_DELETE,
    ],
    System: [
      PermissionAction.SETTING_VIEW,
      PermissionAction.SETTING_UPDATE,
      PermissionAction.AUDIT_READ,
    ],
  };
  
  return categories;
}
