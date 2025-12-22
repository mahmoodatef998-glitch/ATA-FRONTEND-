/**
 * Check Admin User Script
 * Checks if admin user exists in the database
 * 
 * Usage:
 *   tsx scripts/check-admin.ts
 */

import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ Database URL not found!");
  console.error("   Please set DIRECT_URL or DATABASE_URL environment variable");
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function main() {
  console.log("🔍 Checking for admin user...\n");

  try {
    // Check if accountStatus column exists
    let hasAccountStatus = false;
    try {
      const result = await prisma.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'accountStatus'
      `;
      hasAccountStatus = result.length > 0;
    } catch (e) {
      // Column doesn't exist, continue without it
    }

    // Build select object dynamically
    const baseSelect = {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    };

    const selectWithStatus = hasAccountStatus 
      ? { ...baseSelect, accountStatus: true }
      : baseSelect;

    // Check for admin by role
    const adminByRole = await prisma.users.findFirst({
      where: {
        role: "ADMIN",
      },
      select: selectWithStatus,
    });

    // Check for demo admin by email
    const demoAdmin = await prisma.users.findUnique({
      where: {
        email: "admin@demo.co",
      },
      select: selectWithStatus,
    });

    // List all users
    const allUsers = await prisma.users.findMany({
      select: selectWithStatus,
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("=".repeat(50));
    console.log("📊 Results:");
    console.log("=".repeat(50));

    if (adminByRole) {
      console.log("\n✅ Admin user found (by role):");
      console.log(`   ID: ${adminByRole.id}`);
      console.log(`   Name: ${adminByRole.name}`);
      console.log(`   Email: ${adminByRole.email}`);
      console.log(`   Role: ${adminByRole.role}`);
      if (hasAccountStatus && 'accountStatus' in adminByRole) {
        console.log(`   Status: ${(adminByRole as any).accountStatus}`);
      }
      console.log(`   Created: ${adminByRole.createdAt}`);
    } else {
      console.log("\n❌ No admin user found (by role)");
    }

    if (demoAdmin) {
      console.log("\n✅ Demo admin found (by email):");
      console.log(`   ID: ${demoAdmin.id}`);
      console.log(`   Name: ${demoAdmin.name}`);
      console.log(`   Email: ${demoAdmin.email}`);
      console.log(`   Role: ${demoAdmin.role}`);
      if (hasAccountStatus && 'accountStatus' in demoAdmin) {
        console.log(`   Status: ${(demoAdmin as any).accountStatus}`);
      }
      console.log(`   Created: ${demoAdmin.createdAt}`);
    } else {
      console.log("\n❌ No demo admin found (admin@demo.co)");
    }

    console.log("\n" + "=".repeat(50));
    console.log(`📋 All users in database (${allUsers.length} total):`);
    console.log("=".repeat(50));

    if (allUsers.length === 0) {
      console.log("\n⚠️  No users found in database!");
      console.log("   You need to run database seed or create admin user.");
      console.log("\n   To create admin:");
      console.log("   1. Run: RUN_MIGRATIONS.bat (first)");
      console.log("   2. Run: CREATE_ADMIN.bat");
      console.log("   3. Or run: npx prisma db seed");
    } else {
      allUsers.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        if (hasAccountStatus && 'accountStatus' in user) {
          console.log(`   Status: ${(user as any).accountStatus}`);
        }
      });
    }

    console.log("\n" + "=".repeat(50));
    console.log("📝 Login Credentials:");
    console.log("=".repeat(50));

    if (adminByRole || demoAdmin) {
      const admin = adminByRole || demoAdmin;
      console.log(`\n✅ Use these credentials to login:`);
      console.log(`   Email: ${admin!.email}`);
      console.log(`   Password: 00243540000`);
      console.log(`   URL: https://ata-frontend-pied.vercel.app/login`);
    } else {
      console.log("\n❌ No admin user found!");
      console.log("\n   To create admin user:");
      console.log("   1. Run: RUN_MIGRATIONS.bat (first)");
      console.log("   2. Run: CREATE_ADMIN.bat");
      console.log("   3. Or run database seed: npx prisma db seed");
    }

    console.log("\n" + "=".repeat(50));
  } catch (error: any) {
    console.error("\n❌ Error checking admin:", error.message);
    
    if (error.message.includes("does not exist")) {
      console.error("\n⚠️  Database schema is not up to date!");
      console.error("   You need to run migrations first:");
      console.error("   1. Run: RUN_MIGRATIONS.bat");
      console.error("   2. Then run: CHECK_ADMIN_EXISTS.bat again");
    }
    
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("❌ Error checking admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
