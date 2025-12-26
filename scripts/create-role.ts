/**
 * Create RBAC Role Script
 * Creates a new RBAC role in the database
 * 
 * Usage:
 *   ROLE_NAME="custom_role" \
 *   ROLE_DISPLAY_NAME="Custom Role" \
 *   ROLE_DESCRIPTION="Description of the role" \
 *   COMPANY_ID="1" \
 *   tsx scripts/create-role.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const roleName = process.env.ROLE_NAME || "";
  const displayName = process.env.ROLE_DISPLAY_NAME || "";
  const description = process.env.ROLE_DESCRIPTION || null;
  const companyId = process.env.COMPANY_ID ? parseInt(process.env.COMPANY_ID) : null;
  const isSystem = process.env.IS_SYSTEM === "true";

  // Validate inputs
  if (!roleName || roleName.trim().length === 0) {
    console.error("❌ ROLE_NAME is required!");
    console.error("   Usage: ROLE_NAME=\"custom_role\" ROLE_DISPLAY_NAME=\"Custom Role\" npx tsx scripts/create-role.ts");
    process.exit(1);
  }

  if (!displayName || displayName.trim().length === 0) {
    console.error("❌ ROLE_DISPLAY_NAME is required!");
    process.exit(1);
  }

  // Validate role name format (should be lowercase, no spaces, use underscores)
  const namePattern = /^[a-z0-9_]+$/;
  if (!namePattern.test(roleName)) {
    console.error("❌ ROLE_NAME must be lowercase, alphanumeric, and use underscores only!");
    console.error("   Example: custom_role, sales_manager, project_lead");
    process.exit(1);
  }

  console.log("🎭 Creating RBAC role...");
  console.log(`   Name: ${roleName}`);
  console.log(`   Display Name: ${displayName}`);
  console.log(`   Description: ${description || "None"}`);
  console.log(`   Company ID: ${companyId || "Global (null)"}`);
  console.log(`   System Role: ${isSystem ? "Yes" : "No"}`);

  // Check if company exists (if companyId provided)
  if (companyId) {
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
  }

  // Check if role name already exists
  const existing = await prisma.roles.findUnique({
    where: { name: roleName },
  });

  if (existing) {
    console.error(`❌ Role with name "${roleName}" already exists!`);
    console.error(`   Existing role: ${existing.displayName} (ID: ${existing.id})`);
    console.error(`   Company: ${existing.companyId || "Global"}`);
    process.exit(1);
  }

  // Create role
  const role = await prisma.roles.create({
    data: {
      name: roleName.trim().toLowerCase(),
      displayName: displayName.trim(),
      description: description?.trim() || null,
      companyId: companyId || null,
      isSystem: isSystem,
    },
  });

  console.log("\n✅ Role created successfully!");
  console.log(`   ID: ${role.id}`);
  console.log(`   Name: ${role.name}`);
  console.log(`   Display Name: ${role.displayName}`);
  console.log(`   Description: ${role.description || "None"}`);
  console.log(`   Company: ${role.companyId ? `ID ${role.companyId}` : "Global"}`);
  console.log(`   System Role: ${role.isSystem ? "Yes" : "No"}`);
  console.log(`   Created At: ${role.createdAt}`);

  console.log("\n📝 Next steps:");
  console.log("   1. Assign permissions to this role (via Dashboard or API)");
  console.log("   2. Assign this role to users (via Dashboard or API)");
  console.log("   3. Test permissions work correctly");
  
  if (!companyId) {
    console.log("\n💡 Note: This is a global role (available to all companies)");
  } else {
    console.log(`\n💡 Note: This is a company-specific role (Company ID: ${companyId})`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Error creating role:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

