/**
 * Give Admin Full Access
 * Ensures admin role has ALL permissions in the system
 * 
 * Usage:
 *   tsx scripts/give-admin-full-access.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔐 Giving Admin Full Access...\n");

  // Get all permissions
  const allPermissions = await prisma.permissions.findMany({
    select: { id: true, name: true },
  });

  console.log(`📋 Found ${allPermissions.length} permissions in system\n`);

  // Find or create admin role
  let adminRole = await prisma.roles.findFirst({
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
    console.log("⚠️  Admin role not found. Creating...");
    adminRole = await prisma.roles.create({
      data: {
        name: "admin",
        displayName: "Admin",
        description: "Full system access with all permissions",
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
    console.log("✅ Admin role created\n");
  } else {
    console.log(`✅ Admin role found (ID: ${adminRole.id})\n`);
  }

  // Get current permissions
  const currentPermissionIds = new Set(
    adminRole.rolePermissions.map((rp) => rp.permissionId)
  );

  // Add all missing permissions
  const missingPermissions = allPermissions.filter(
    (p) => !currentPermissionIds.has(p.id)
  );

  if (missingPermissions.length === 0) {
    console.log("✅ Admin already has all permissions!\n");
    console.log(`   Total permissions: ${allPermissions.length}`);
    console.log(`   Admin has: ${adminRole.rolePermissions.length}`);
  } else {
    console.log(`📝 Adding ${missingPermissions.length} missing permissions...\n`);

    // Add missing permissions
    for (const permission of missingPermissions) {
      await prisma.role_permissions.create({
        data: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      });
      console.log(`   ✅ Added: ${permission.name}`);
    }

    console.log(`\n✅ Admin now has ALL ${allPermissions.length} permissions!\n`);
  }

  // Verify
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

  console.log("📊 Final Status:");
  console.log(`   Role: ${updatedRole?.displayName}`);
  console.log(`   Total Permissions: ${allPermissions.length}`);
  console.log(`   Admin Has: ${updatedRole?.rolePermissions.length}`);
  console.log(`   Status: ${updatedRole?.rolePermissions.length === allPermissions.length ? "✅ Full Access" : "⚠️  Missing Permissions"}\n`);

  // List all permissions
  console.log("📋 All Permissions:");
  updatedRole?.rolePermissions.forEach((rp) => {
    console.log(`   ✅ ${rp.permissions.name}`);
  });
}

main()
  .catch((e) => {
    console.error("\n❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

