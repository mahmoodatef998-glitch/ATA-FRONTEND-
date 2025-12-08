/**
 * Update Admin User Script
 * Changes demo admin credentials to production credentials
 * 
 * Usage:
 *   ADMIN_EMAIL="admin@yourcompany.com" \
 *   ADMIN_PASSWORD="YourStrongPassword123!" \
 *   ADMIN_NAME="Your Name" \
 *   tsx scripts/update-admin.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const newEmail = process.env.ADMIN_EMAIL || "admin@yourcompany.com";
  const newPassword = process.env.ADMIN_PASSWORD || "YourStrongPassword123!";
  const newName = process.env.ADMIN_NAME || "Admin";

  // Validate password strength
  if (newPassword.length < 12) {
    console.error("❌ Password must be at least 12 characters long!");
    process.exit(1);
  }

  // Check if running in production
  const isProduction = process.env.NODE_ENV === "production";
  
  if (!isProduction) {
    console.log("⚠️  Warning: Not in production mode!");
    console.log("   Set NODE_ENV=production to update in production");
    console.log("   Or continue in development mode? (y/n)");
    // In production, we'll skip this check
  }

  console.log("🔐 Updating admin user...");
  console.log(`   New Email: ${newEmail}`);
  console.log(`   New Name: ${newName}`);
  console.log(`   Password: [HIDDEN]`);

  // Hash password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Find admin user (by role or email)
  const admin = await prisma.users.findFirst({
    where: {
      OR: [
        { role: "ADMIN" },
        { email: "admin@demo.co" }, // Fallback to demo admin
      ],
    },
  });

  if (!admin) {
    console.error("❌ Admin user not found!");
    console.error("   Please create an admin user first.");
    process.exit(1);
  }

  // Check if email already exists (and it's not the current admin)
  const existingUser = await prisma.users.findFirst({
    where: {
      email: newEmail,
      id: { not: admin.id },
    },
  });

  if (existingUser) {
    console.error(`❌ Email ${newEmail} is already in use by another user!`);
    process.exit(1);
  }

  // Update admin
  const updated = await prisma.users.update({
    where: { id: admin.id },
    data: {
      email: newEmail,
      name: newName,
      password: hashedPassword,
      updatedAt: new Date(),
    },
  });

  console.log("✅ Admin updated successfully!");
  console.log(`   ID: ${updated.id}`);
  console.log(`   Email: ${updated.email}`);
  console.log(`   Name: ${updated.name}`);
  console.log(`   Role: ${updated.role}`);

  // Optional: Delete demo admin if it's different
  if (admin.email === "admin@demo.co" && newEmail !== "admin@demo.co") {
    console.log("\n🗑️  Deleting demo admin...");
    await prisma.users.deleteMany({
      where: {
        email: "admin@demo.co",
        id: { not: updated.id }, // Don't delete if it's the same user
      },
    });
    console.log("✅ Demo admin deleted!");
  }

  console.log("\n📝 Next steps:");
  console.log("   1. Log out from current session");
  console.log("   2. Log in with new credentials:");
  console.log(`      Email: ${newEmail}`);
  console.log(`      Password: [Your password]`);
  console.log("   3. Verify all permissions work correctly");
}

main()
  .catch((e) => {
    console.error("❌ Error updating admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

