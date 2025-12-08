/**
 * Create User Script
 * Creates a new user account in the database
 * 
 * Usage:
 *   USER_NAME="User Name" \
 *   USER_EMAIL="user@example.com" \
 *   USER_PASSWORD="Password123!" \
 *   USER_ROLE="OPERATIONS_MANAGER" \
 *   COMPANY_ID="1" \
 *   tsx scripts/create-user.ts
 */

import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const name = process.env.USER_NAME || "User Name";
  const email = process.env.USER_EMAIL || "user@example.com";
  const password = process.env.USER_PASSWORD || "Password123!";
  const role = (process.env.USER_ROLE || "TECHNICIAN") as UserRole;
  const companyId = parseInt(process.env.COMPANY_ID || "1");
  const phone = process.env.USER_PHONE || null;

  // Validate inputs
  if (!name || name.trim().length === 0) {
    console.error("❌ USER_NAME is required!");
    process.exit(1);
  }

  if (!email || !email.includes("@")) {
    console.error("❌ Valid USER_EMAIL is required!");
    process.exit(1);
  }

  // Validate password
  if (password.length < 8) {
    console.error("❌ Password must be at least 8 characters!");
    process.exit(1);
  }

  // Validate role
  const validRoles = Object.values(UserRole);
  if (!validRoles.includes(role)) {
    console.error(`❌ Invalid role! Valid roles: ${validRoles.join(", ")}`);
    process.exit(1);
  }

  console.log("👤 Creating user...");
  console.log(`   Name: ${name}`);
  console.log(`   Email: ${email}`);
  console.log(`   Role: ${role}`);
  console.log(`   Company ID: ${companyId}`);

  // Check if company exists
  const company = await prisma.companies.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    console.error(`❌ Company with ID ${companyId} not found!`);
    console.error("   Available companies:");
    const companies = await prisma.companies.findMany({
      select: { id: true, name: true },
    });
    companies.forEach((c) => {
      console.error(`     - ID: ${c.id}, Name: ${c.name}`);
    });
    process.exit(1);
  }

  // Check if email already exists
  const existing = await prisma.users.findUnique({
    where: { email },
  });

  if (existing) {
    console.error(`❌ User with email ${email} already exists!`);
    console.error(`   Existing user: ${existing.name} (ID: ${existing.id})`);
    process.exit(1);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.users.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role,
      companyId,
      phone: phone || null,
      accountStatus: "APPROVED", // Auto-approve for script-created users
    },
  });

  console.log("\n✅ User created successfully!");
  console.log(`   ID: ${user.id}`);
  console.log(`   Name: ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Company: ${company.name}`);
  console.log(`   Status: ${user.accountStatus}`);
  console.log(`   Password: [HIDDEN]`);
  console.log("\n📝 Login credentials:");
  console.log(`   Email: ${user.email}`);
  console.log(`   Password: [Your provided password]`);
  console.log(`   URL: http://localhost:3005/login`);
}

main()
  .catch((e) => {
    console.error("❌ Error creating user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

