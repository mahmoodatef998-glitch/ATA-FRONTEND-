/**
 * Verify Roles Permissions
 * Verifies that each role has the correct permissions according to the design
 * 
 * Usage:
 *   tsx scripts/verify-roles-permissions.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Expected permissions for each role (from seed-rbac.ts)
const expectedPermissions: Record<string, string[]> = {
  admin: [
    // All permissions except attendance.clock
    "user.create", "user.read", "user.update", "user.delete", "role.manage",
    "client.create", "client.read", "client.update", "client.delete",
    "lead.create", "lead.read", "lead.update", "lead.delete", "lead.move_stage",
    "task.create", "task.read", "task.update", "task.delete", "task.assign", "task.complete", "task.comment", "task.change_priority",
    "attendance.read", "attendance.manage",
    "invoice.create", "invoice.read", "invoice.update", "invoice.delete", "payment.record", "finance.reports",
    "hr.view", "hr.manage", "payroll.manage",
    "report.view", "report.generate",
    "file.upload", "file.read", "file.delete",
    "setting.view", "setting.update", "audit.read",
    "po.create", "po.read", "po.update", "po.delete",
    "overview.view",
  ],
  operation_manager: [
    "client.create", "client.read", "client.update",
    "lead.create", "lead.read", "lead.update", "lead.delete", "lead.move_stage",
    "task.create", "task.read", "task.update", "task.delete", "task.assign", "task.complete", "task.comment", "task.change_priority",
    "attendance.clock", "attendance.read",
    "invoice.create", "invoice.read", "invoice.update",
    "user.read",
    "po.read",
    "report.view", "report.generate",
    "file.read", "file.upload",
    "setting.view",
  ],
  accountant: [
    "invoice.create", "invoice.read", "invoice.update",
    "payment.record",
    "finance.reports",
    "client.read",
    "attendance.clock",
    "po.create", "po.read", "po.update", "po.delete",
    "overview.view",
    "lead.read",
  ],
  hr: [
    "hr.view", "hr.manage",
    "attendance.clock", "attendance.read", "attendance.manage",
    "user.create", "user.read", "user.update", "user.delete",
    "role.manage",
    "file.read", "file.upload",
    "task.read",
  ],
  supervisor: [
    "task.create", "task.read", "task.update", "task.assign", "task.comment", "task.complete",
    "attendance.clock", "attendance.read",
    "client.read",
  ],
  technician: [
    "task.read", "task.update", "task.comment",
    "attendance.clock",
    "file.upload",
  ],
};

async function main() {
  console.log("🔍 Verifying Roles Permissions...\n");
  console.log("=".repeat(60));
  console.log();

  let allCorrect = true;

  // Get all roles
  const roles = await prisma.roles.findMany({
    where: {
      isSystem: true,
    },
    include: {
      rolePermissions: {
        include: {
          permissions: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  for (const role of roles) {
    const expected = expectedPermissions[role.name] || [];
    const actual = role.rolePermissions.map((rp) => rp.permissions.name).sort();
    const expectedSorted = [...expected].sort();

    console.log(`📋 Role: ${role.displayName} (${role.name})`);
    console.log(`   Expected: ${expected.length} permissions`);
    console.log(`   Actual: ${actual.length} permissions`);
    console.log();

    // Check for missing permissions
    const missing = expected.filter((p) => !actual.includes(p));
    if (missing.length > 0) {
      console.log(`   ❌ Missing Permissions (${missing.length}):`);
      missing.forEach((perm) => {
        console.log(`      - ${perm}`);
      });
      allCorrect = false;
      console.log();
    }

    // Check for extra permissions (not in expected list)
    const extra = actual.filter((p) => !expected.includes(p));
    if (extra.length > 0) {
      console.log(`   ⚠️  Extra Permissions (${extra.length}):`);
      extra.forEach((perm) => {
        console.log(`      - ${perm}`);
      });
      console.log();
    }

    // Check if all match
    const allMatch =
      missing.length === 0 &&
      extra.length === 0 &&
      actual.length === expected.length;

    if (allMatch) {
      console.log(`   ✅ All permissions correct!`);
    } else {
      allCorrect = false;
    }

    console.log();
    console.log("-".repeat(60));
    console.log();
  }

  console.log("=".repeat(60));
  console.log();

  if (allCorrect) {
    console.log("✅ All roles have correct permissions!");
  } else {
    console.log("⚠️  Some roles have incorrect permissions.");
    console.log("   Please run: SEED_RBAC_PERMISSIONS.bat to fix");
  }

  console.log();
}

main()
  .catch((e) => {
    console.error("\n❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

