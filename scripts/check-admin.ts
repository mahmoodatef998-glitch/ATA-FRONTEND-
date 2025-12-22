/**
 * Check Admin User Script
 * Checks if admin user exists in the database
 * 
 * Usage:
 *   tsx scripts/check-admin.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking for admin user...\n");

  // Check for admin by role
  const adminByRole = await prisma.users.findFirst({
    where: {
      role: "ADMIN",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      accountStatus: true,
      createdAt: true,
    },
  });

  // Check for demo admin by email
  const demoAdmin = await prisma.users.findUnique({
    where: {
      email: "admin@demo.co",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      accountStatus: true,
      createdAt: true,
    },
  });

  // List all users
  const allUsers = await prisma.users.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      accountStatus: true,
    },
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
    console.log(`   Status: ${adminByRole.accountStatus}`);
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
    console.log(`   Status: ${demoAdmin.accountStatus}`);
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
    console.log("   1. Run: CREATE_ADMIN.bat");
    console.log("   2. Or run: npx prisma db seed");
  } else {
    allUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.accountStatus}`);
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
    console.log("   1. Run: CREATE_ADMIN.bat");
    console.log("   2. Or run database seed: npx prisma db seed");
  }

  console.log("\n" + "=".repeat(50));
}

main()
  .catch((e) => {
    console.error("❌ Error checking admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

