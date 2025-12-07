/**
 * RBAC Seed Script
 * Seeds roles and permissions into the database
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// All permissions from the system
const permissions = [
  // Users
  { name: "user.create", displayName: "Create User", category: "Users", resource: "user", action: "create", description: "Create new users" },
  { name: "user.read", displayName: "Read User", category: "Users", resource: "user", action: "read", description: "View user information" },
  { name: "user.update", displayName: "Update User", category: "Users", resource: "user", action: "update", description: "Update user information" },
  { name: "user.delete", displayName: "Delete User", category: "Users", resource: "user", action: "delete", description: "Delete users" },
  { name: "role.manage", displayName: "Manage Roles", category: "Users", resource: "role", action: "manage", description: "Manage roles and permissions" },
  
  // Clients
  { name: "client.create", displayName: "Create Client", category: "Clients", resource: "client", action: "create", description: "Create new clients" },
  { name: "client.read", displayName: "Read Client", category: "Clients", resource: "client", action: "read", description: "View client information" },
  { name: "client.update", displayName: "Update Client", category: "Clients", resource: "client", action: "update", description: "Update client information" },
  { name: "client.delete", displayName: "Delete Client", category: "Clients", resource: "client", action: "delete", description: "Delete clients" },
  
  // Leads
  { name: "lead.create", displayName: "Create Lead", category: "Leads", resource: "lead", action: "create", description: "Create new leads" },
  { name: "lead.read", displayName: "Read Lead", category: "Leads", resource: "lead", action: "read", description: "View lead information" },
  { name: "lead.update", displayName: "Update Lead", category: "Leads", resource: "lead", action: "update", description: "Update lead information" },
  { name: "lead.delete", displayName: "Delete Lead", category: "Leads", resource: "lead", action: "delete", description: "Delete leads" },
  { name: "lead.move_stage", displayName: "Move Lead Stage", category: "Leads", resource: "lead", action: "move_stage", description: "Move leads between stages" },
  
  // Tasks
  { name: "task.create", displayName: "Create Task", category: "Tasks", resource: "task", action: "create", description: "Create new tasks" },
  { name: "task.read", displayName: "Read Task", category: "Tasks", resource: "task", action: "read", description: "View task information" },
  { name: "task.update", displayName: "Update Task", category: "Tasks", resource: "task", action: "update", description: "Update task information" },
  { name: "task.delete", displayName: "Delete Task", category: "Tasks", resource: "task", action: "delete", description: "Delete tasks" },
  { name: "task.assign", displayName: "Assign Task", category: "Tasks", resource: "task", action: "assign", description: "Assign tasks to users" },
  { name: "task.complete", displayName: "Complete Task", category: "Tasks", resource: "task", action: "complete", description: "Mark tasks as completed" },
  { name: "task.comment", displayName: "Comment on Task", category: "Tasks", resource: "task", action: "comment", description: "Add comments to tasks" },
  { name: "task.change_priority", displayName: "Change Task Priority", category: "Tasks", resource: "task", action: "change_priority", description: "Change task priority" },
  
  // Attendance
  { name: "attendance.clock", displayName: "Clock In/Out", category: "Attendance", resource: "attendance", action: "clock", description: "Check in and check out" },
  { name: "attendance.read", displayName: "Read Attendance", category: "Attendance", resource: "attendance", action: "read", description: "View attendance records" },
  { name: "attendance.manage", displayName: "Manage Attendance", category: "Attendance", resource: "attendance", action: "manage", description: "Manage attendance records" },
  
  // Finance
  { name: "invoice.create", displayName: "Create Invoice", category: "Finance", resource: "invoice", action: "create", description: "Create new invoices" },
  { name: "invoice.read", displayName: "Read Invoice", category: "Finance", resource: "invoice", action: "read", description: "View invoice information" },
  { name: "invoice.update", displayName: "Update Invoice", category: "Finance", resource: "invoice", action: "update", description: "Update invoice information" },
  { name: "invoice.delete", displayName: "Delete Invoice", category: "Finance", resource: "invoice", action: "delete", description: "Delete invoices" },
  { name: "payment.record", displayName: "Record Payment", category: "Finance", resource: "payment", action: "record", description: "Record payments" },
  { name: "finance.reports", displayName: "Finance Reports", category: "Finance", resource: "finance", action: "reports", description: "View financial reports" },
  
  // Purchase Orders
  { name: "po.create", displayName: "Create Purchase Order", category: "Purchase Orders", resource: "po", action: "create", description: "Create new purchase orders" },
  { name: "po.read", displayName: "Read Purchase Order", category: "Purchase Orders", resource: "po", action: "read", description: "View purchase order information" },
  { name: "po.update", displayName: "Update Purchase Order", category: "Purchase Orders", resource: "po", action: "update", description: "Update purchase order information" },
  { name: "po.delete", displayName: "Delete Purchase Order", category: "Purchase Orders", resource: "po", action: "delete", description: "Delete purchase orders" },
  
  // Overview/Dashboard
  { name: "overview.view", displayName: "View Overview", category: "Dashboard", resource: "overview", action: "view", description: "View dashboard overview" },
  
  // HR
  { name: "hr.view", displayName: "View HR", category: "HR", resource: "hr", action: "view", description: "View HR information" },
  { name: "hr.manage", displayName: "Manage HR", category: "HR", resource: "hr", action: "manage", description: "Manage HR operations" },
  { name: "payroll.manage", displayName: "Manage Payroll", category: "HR", resource: "payroll", action: "manage", description: "Manage payroll" },
  
  // Reports
  { name: "report.view", displayName: "View Reports", category: "Reports", resource: "report", action: "view", description: "View reports" },
  { name: "report.generate", displayName: "Generate Reports", category: "Reports", resource: "report", action: "generate", description: "Generate reports" },
  
  // Files
  { name: "file.upload", displayName: "Upload File", category: "Files", resource: "file", action: "upload", description: "Upload files" },
  { name: "file.read", displayName: "Read File", category: "Files", resource: "file", action: "read", description: "View files" },
  { name: "file.delete", displayName: "Delete File", category: "Files", resource: "file", action: "delete", description: "Delete files" },
  
  // System
  { name: "setting.view", displayName: "View Settings", category: "System", resource: "setting", action: "view", description: "View system settings" },
  { name: "setting.update", displayName: "Update Settings", category: "System", resource: "setting", action: "update", description: "Update system settings" },
  { name: "audit.read", displayName: "Read Audit Logs", category: "System", resource: "audit", action: "read", description: "View audit logs" },
];

// Role definitions with their permissions
const roleDefinitions = [
  {
    name: "admin",
    displayName: "Admin",
    description: "Full system access with all permissions",
    isSystem: true,
    permissions: permissions.filter(p => p.name !== "attendance.clock").map(p => p.name), // All permissions except attendance.clock
  },
  {
    name: "operation_manager",
    displayName: "Operations Manager",
    description: "Operations and team management",
    isSystem: true,
    permissions: [
      "client.create", "client.read", "client.update",
      "lead.create", "lead.read", "lead.update", "lead.delete", "lead.move_stage",
      "task.create", "task.read", "task.update", "task.delete", "task.assign", "task.complete", "task.comment", "task.change_priority",
      "attendance.clock", "attendance.read",
      "invoice.create", "invoice.read", "invoice.update", // Added for quotation upload
      "user.read", // Added for viewing team members
      "report.view", "report.generate",
      "file.read", "file.upload",
      "setting.view",
    ],
  },
  {
    name: "accountant",
    displayName: "Accountant",
    description: "Financial and accounting operations",
    isSystem: true,
    permissions: [
      "invoice.create", "invoice.read", "invoice.update",
      "payment.record",
      "finance.reports",
      "client.read",
      "attendance.clock",
      // Purchase Orders
      "po.create", "po.read", "po.update", "po.delete",
      // Overview/Dashboard
      "overview.view",
      // Order History - allow viewing order history
      "lead.read",
    ],
  },
  {
    name: "hr",
    displayName: "HR",
    description: "Human resources management - Our Team section only",
    isSystem: true,
    permissions: [
      "hr.view", "hr.manage",
      "attendance.clock", "attendance.read", "attendance.manage",
      "user.create", "user.read", "user.update", "user.delete",
      "role.manage",
      "file.read", "file.upload",
      // Tasks - HR can view all tasks but cannot create new tasks
      "task.read",
      // Note: HR does NOT have overview.view or lead.read - they can only access Our Team section
    ],
  },
  {
    name: "supervisor",
    displayName: "Supervisor",
    description: "Task and attendance supervision",
    isSystem: true,
    permissions: [
      "task.create", "task.read", "task.update", "task.assign", "task.comment", "task.complete",
      "attendance.clock", "attendance.read",
      "client.read",
    ],
  },
  {
    name: "technician",
    displayName: "Technician",
    description: "Basic operations for technicians",
    isSystem: true,
    permissions: [
      "task.read", "task.update", "task.comment",
      "attendance.clock",
      "file.upload",
    ],
  },
];

async function main() {
  console.log("🌱 Seeding RBAC data...");

  // Create permissions
  console.log("📝 Creating permissions...");
  for (const perm of permissions) {
    await prisma.permissions.upsert({
      where: { name: perm.name },
      update: perm,
      create: perm,
    });
  }
  console.log(`✅ Created ${permissions.length} permissions`);

  // Create roles and assign permissions
  console.log("👥 Creating roles...");
  for (const roleDef of roleDefinitions) {
    const role = await prisma.roles.upsert({
      where: { name: roleDef.name },
      update: {
        displayName: roleDef.displayName,
        description: roleDef.description,
        isSystem: roleDef.isSystem,
      },
      create: {
        name: roleDef.name,
        displayName: roleDef.displayName,
        description: roleDef.description,
        isSystem: roleDef.isSystem,
      },
    });

    // Get permission IDs
    const permissionIds = await prisma.permissions.findMany({
      where: { name: { in: roleDef.permissions } },
      select: { id: true },
    });

    // Clear existing permissions
    await prisma.role_permissions.deleteMany({
      where: { roleId: role.id },
    });

    // Assign permissions
    await prisma.role_permissions.createMany({
      data: permissionIds.map(p => ({
        roleId: role.id,
        permissionId: p.id,
      })),
      skipDuplicates: true,
    });

    console.log(`✅ Created role "${roleDef.displayName}" with ${permissionIds.length} permissions`);
  }

  console.log("🎉 RBAC seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding RBAC:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


