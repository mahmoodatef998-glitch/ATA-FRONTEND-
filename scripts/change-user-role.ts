/**
 * Change User Role Script
 * Changes a user's role in the database
 * 
 * Usage:
 *   USER_EMAIL="user@example.com" \
 *   NEW_ROLE="OPERATIONS_MANAGER" \
 *   tsx scripts/change-user-role.ts
 */

import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const userEmail = process.env.USER_EMAIL || "";
  const newRole = (process.env.NEW_ROLE || "") as UserRole;

  // Validate inputs
  if (!userEmail || !userEmail.includes("@")) {
    console.error("❌ Valid USER_EMAIL is required!");
    console.error("   Usage: USER_EMAIL=\"user@example.com\" NEW_ROLE=\"ADMIN\" npx tsx scripts/change-user-role.ts");
    process.exit(1);
  }

  if (!newRole) {
    console.error("❌ NEW_ROLE is required!");
    console.error("   Valid roles:", Object.values(UserRole).join(", "));
    process.exit(1);
  }

  // Validate role
  const validRoles = Object.values(UserRole);
  if (!validRoles.includes(newRole)) {
    console.error(`❌ Invalid role: ${newRole}`);
    console.error(`   Valid roles: ${validRoles.join(", ")}`);
    process.exit(1);
  }

  console.log("🔄 Changing user role...");
  console.log(`   Email: ${userEmail}`);
  console.log(`   New Role: ${newRole}`);

  // Find user
  const user = await prisma.users.findUnique({
    where: { email: userEmail.toLowerCase() },
    include: { companies: true },
  });

  if (!user) {
    console.error(`❌ User with email ${userEmail} not found!`);
    process.exit(1);
  }

  console.log(`   Current Role: ${user.role}`);
  console.log(`   Name: ${user.name}`);

  if (user.role === newRole) {
    console.log("⚠️  User already has this role!");
    process.exit(0);
  }

  // Update role
  const updated = await prisma.users.update({
    where: { id: user.id },
    data: {
      role: newRole,
      updatedAt: new Date(),
    },
  });

  console.log("\n✅ User role updated successfully!");
  console.log(`   ID: ${updated.id}`);
  console.log(`   Name: ${updated.name}`);
  console.log(`   Email: ${updated.email}`);
  console.log(`   Old Role: ${user.role}`);
  console.log(`   New Role: ${updated.role}`);
  console.log(`   Company: ${user.companies.name}`);

  console.log("\n📝 Next steps:");
  console.log("   1. User should log out and log in again");
  console.log("   2. New permissions will be applied");
  console.log("   3. Verify permissions work correctly");
}

main()
  .catch((e) => {
    console.error("❌ Error changing user role:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

