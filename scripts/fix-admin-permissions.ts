/**
 * Fix Admin Permissions
 * Ensures admin role has ALL permissions including overview.view and po.*
 * 
 * Usage:
 *   tsx scripts/fix-admin-permissions.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔐 Fixing Admin Permissions...\n");

  // Get all permissions from database
  const allPermissions = await prisma.permissions.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  console.log(`📋 Found ${allPermissions.length} permissions in database\n`);

  // Find admin role
  const adminRole = await prisma.roles.findFirst({
    where: {
      name: "admin",
      isSystem: true,
    },
    include: {
      rolePermissions: {
        include: {
          permissions: true,
        },
      },
    },
  });

  if (!adminRole) {
    console.error("❌ Admin role not found!");
    console.error("   Please run RBAC seed first: npx prisma db seed");
    process.exit(1);
  }

  console.log(`✅ Admin role found (ID: ${adminRole.id})\n`);

  // Get current permission IDs
  const currentPermissionIds = new Set(
    adminRole.rolePermissions.map((rp) => rp.permissionId)
  );

  // Find missing permissions
  const missingPermissions = allPermissions.filter(
    (p) => !currentPermissionIds.has(p.id)
  );

  if (missingPermissions.length === 0) {
    console.log("✅ Admin already has all permissions!\n");
    console.log(`   Total permissions: ${allPermissions.length}`);
    console.log(`   Admin has: ${adminRole.rolePermissions.length}`);
    
    // List all permissions to verify
    console.log("\n📋 Admin Permissions:");
    adminRole.rolePermissions.forEach((rp) => {
      console.log(`   ✅ ${rp.permissions.name}`);
    });
    
    return;
  }

  console.log(`📝 Adding ${missingPermissions.length} missing permissions:\n`);

  // Add missing permissions
  for (const permission of missingPermissions) {
    try {
      await prisma.role_permissions.create({
        data: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      });
      console.log(`   ✅ Added: ${permission.name}`);
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Unique constraint violation - permission already exists
        console.log(`   ⚠️  Already exists: ${permission.name}`);
      } else {
        console.error(`   ❌ Error adding ${permission.name}:`, error.message);
      }
    }
  }

  // Verify final state
  const updatedRole = await prisma.roles.findUnique({
    where: { id: adminRole.id },
    include: {
      rolePermissions: {
        include: {
          permissions: true,
        },
      },
    },
  });

  console.log("\n📊 Final Status:");
  console.log(`   Role: ${updatedRole?.displayName}`);
  console.log(`   Total Permissions: ${allPermissions.length}`);
  console.log(`   Admin Has: ${updatedRole?.rolePermissions.length}`);
  console.log(`   Status: ${updatedRole?.rolePermissions.length === allPermissions.length ? "✅ Full Access" : "⚠️  Missing Permissions"}\n`);

  // Check for specific missing permissions
  const requiredPermissions = ["overview.view", "lead.read", "po.create", "po.read", "po.update", "po.delete"];
  const adminPermissionNames = new Set(
    updatedRole?.rolePermissions.map((rp) => rp.permissions.name) || []
  );

  console.log("🔍 Checking Required Permissions:");
  requiredPermissions.forEach((perm) => {
    if (adminPermissionNames.has(perm)) {
      console.log(`   ✅ ${perm}`);
    } else {
      console.log(`   ❌ ${perm} - MISSING!`);
    }
  });

  console.log("\n✅ Admin permissions fixed!");
  console.log("   You may need to logout and login again for changes to take effect.\n");
}

main()
  .catch((e) => {
    console.error("\n❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




