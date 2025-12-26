/**
 * Setup Company and Admin Script
 * Creates a default company and admin user
 * 
 * Usage:
 *   tsx scripts/setup-company-and-admin.ts
 */

import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🏢 Setting up company and admin...\n");

  // Check if company already exists
  let company = await prisma.companies.findFirst({
    where: { slug: "ata-generators" },
  });

  if (company) {
    console.log(`✅ Company already exists: ${company.name} (ID: ${company.id})`);
  } else {
    // Create Company
    console.log("🏢 Creating company...");
    company = await prisma.companies.create({
      data: {
        name: "ATA Generators & Parts",
        slug: "ata-generators",
        timezone: "Asia/Dubai",
      },
    });
    console.log(`✅ Company created: ${company.name} (ID: ${company.id})`);
  }

  // Check if admin already exists
  const existingAdmin = await prisma.users.findUnique({
    where: { email: "admin@demo.co" },
  });

  if (existingAdmin) {
    console.log(`\n✅ Admin already exists: ${existingAdmin.email}`);
    console.log(`   ID: ${existingAdmin.id}`);
    console.log(`   Name: ${existingAdmin.name}`);
    console.log(`   Role: ${existingAdmin.role}`);
    console.log(`   Status: ${existingAdmin.accountStatus}`);
    return;
  }

  // Create Admin User
  console.log("\n👤 Creating admin user...");
  const hashedPassword = await bcrypt.hash("00243540000", 10);
  const admin = await prisma.users.create({
    data: {
      companyId: company.id,
      name: "Admin User",
      email: "admin@demo.co",
      password: hashedPassword,
      role: UserRole.ADMIN,
      accountStatus: "APPROVED",
    },
  });

  console.log("\n✅ Admin user created successfully!");
  console.log(`   ID: ${admin.id}`);
  console.log(`   Name: ${admin.name}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Role: ${admin.role}`);
  console.log(`   Company: ${company.name}`);
  console.log(`   Status: ${admin.accountStatus}`);
  console.log("\n📝 Login credentials:");
  console.log(`   Email: ${admin.email}`);
  console.log(`   Password: 00243540000`);
  console.log(`   URL: https://ata-frontend-pied.vercel.app/login`);
}

main()
  .catch((e) => {
    console.error("\n❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

