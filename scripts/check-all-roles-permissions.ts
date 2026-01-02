/**
 * Check All Roles Permissions
 * Displays all permissions for all roles in the system
 * 
 * Usage:
 *   tsx scripts/check-all-roles-permissions.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking All Roles Permissions...\n");
  console.log("=" .repeat(60));
  console.log();

  // Get all roles
  const roles = await prisma.roles.findMany({
    where: {
      isSystem: true,
    },
    include: {
      rolePermissions: {
        include: {
          permissions: {
            select: {
              id: true,
              name: true,
              displayName: true,
              category: true,
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  if (roles.length === 0) {
    console.log("❌ No roles found in database!");
    console.log("   Please run: SEED_RBAC_PERMISSIONS.bat");
    process.exit(1);
  }

  // Get all permissions for comparison
  const allPermissions = await prisma.permissions.findMany({
    select: {
      id: true,
      name: true,
      displayName: true,
      category: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  console.log(`📊 Total Permissions in System: ${allPermissions.length}`);
  console.log(`👥 Total Roles: ${roles.length}\n`);
  console.log("=" .repeat(60));
  console.log();

  // Display each role
  for (const role of roles) {
    const permissionNames = role.rolePermissions.map((rp) => rp.permissions.name).sort();
    const missingPermissions = allPermissions.filter(
      (p) => !permissionNames.includes(p.name)
    );

    console.log(`📋 Role: ${role.displayName} (${role.name})`);
    console.log(`   ID: ${role.id}`);
    console.log(`   Description: ${role.description || "N/A"}`);
    console.log(`   System Role: ${role.isSystem ? "✅ Yes" : "❌ No"}`);
    console.log(`   Total Permissions: ${permissionNames.length}/${allPermissions.length}`);
    
    if (missingPermissions.length > 0) {
      console.log(`   ⚠️  Missing Permissions: ${missingPermissions.length}`);
    } else {
      console.log(`   ✅ Has All Permissions`);
    }
    console.log();

    // Group permissions by category
    const permissionsByCategory: Record<string, string[]> = {};
    role.rolePermissions.forEach((rp) => {
      const category = rp.permissions.category || "Other";
      if (!permissionsByCategory[category]) {
        permissionsByCategory[category] = [];
      }
      permissionsByCategory[category].push(rp.permissions.name);
    });

    // Display permissions by category
    console.log("   📝 Permissions by Category:");
    Object.keys(permissionsByCategory)
      .sort()
      .forEach((category) => {
        const perms = permissionsByCategory[category].sort();
        console.log(`      ${category} (${perms.length}):`);
        perms.forEach((perm) => {
          const permInfo = allPermissions.find((p) => p.name === perm);
          const displayName = permInfo?.displayName || perm;
          console.log(`         ✅ ${perm} - ${displayName}`);
        });
      });

    // Show missing permissions if any
    if (missingPermissions.length > 0) {
      console.log();
      console.log("   ⚠️  Missing Permissions:");
      missingPermissions.forEach((perm) => {
        console.log(`         ❌ ${perm.name} - ${perm.displayName}`);
      });
    }

    console.log();
    console.log("-".repeat(60));
    console.log();
  }

  // Summary table
  console.log("📊 Summary Table:");
  console.log();
  console.log("Role".padEnd(25) + "Permissions".padEnd(15) + "Status");
  console.log("-".repeat(60));
  roles.forEach((role) => {
    const count = role.rolePermissions.length;
    const total = allPermissions.length;
    const status = count === total ? "✅ Complete" : `⚠️  ${total - count} missing`;
    console.log(
      role.displayName.padEnd(25) +
      `${count}/${total}`.padEnd(15) +
      status
    );
  });

  console.log();
  console.log("=" .repeat(60));
  console.log();

  // Check specific required permissions for Admin
  const adminRole = roles.find((r) => r.name === "admin");
  if (adminRole) {
    const adminPerms = new Set(
      adminRole.rolePermissions.map((rp) => rp.permissions.name)
    );
    const requiredPerms = [
      "overview.view",
      "lead.read",
      "po.create",
      "po.read",
      "po.update",
      "po.delete",
      "user.create",
      "user.read",
      "user.update",
      "user.delete",
      "role.manage",
    ];

    console.log("🔍 Admin Required Permissions Check:");
    console.log();
    requiredPerms.forEach((perm) => {
      if (adminPerms.has(perm)) {
        console.log(`   ✅ ${perm}`);
      } else {
        console.log(`   ❌ ${perm} - MISSING!`);
      }
    });
    console.log();
  }
}

main()
  .catch((e) => {
    console.error("\n❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




