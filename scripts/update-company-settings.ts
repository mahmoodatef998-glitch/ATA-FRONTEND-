/**
 * Script to update company settings
 * Sets checkInRadius to 500 meters for better GPS accuracy tolerance
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_CHECK_IN_RADIUS = 500; // 500 meters - allows for GPS accuracy variations

async function updateCompanySettings() {
  try {
    console.log("🔄 Updating company settings...");
    console.log(`📍 Setting checkInRadius to: ${DEFAULT_CHECK_IN_RADIUS} meters`);

    // Get all companies
    const companies = await prisma.companies.findMany({
      select: { id: true, name: true },
    });

    for (const company of companies) {
      // Check if company_settings exists
      const existingSettings = await prisma.company_settings.findUnique({
        where: { companyId: company.id },
      });

      if (existingSettings) {
        // Update existing settings
        await prisma.company_settings.update({
          where: { companyId: company.id },
          data: {
            checkInRadius: DEFAULT_CHECK_IN_RADIUS,
            updatedAt: new Date(),
          },
        });
        console.log(`✅ Updated settings for ${company.name} (ID: ${company.id})`);
      } else {
        // Create new settings
        await prisma.company_settings.create({
          data: {
            companyId: company.id,
            checkInRadius: DEFAULT_CHECK_IN_RADIUS,
          },
        });
        console.log(`✅ Created settings for ${company.name} (ID: ${company.id})`);
      }
    }

    // Verify the update
    const allSettings = await prisma.company_settings.findMany({
      include: {
        companies: {
          select: {
            id: true,
            name: true,
            officeLat: true,
            officeLng: true,
          },
        },
      },
    });

    console.log("\n📋 Current company settings:");
    allSettings.forEach((settings) => {
      console.log(
        `  - ${settings.companies.name} (ID: ${settings.companies.id}):`
      );
      console.log(`    - Check-in Radius: ${settings.checkInRadius}m`);
      console.log(
        `    - Office Location: Lat ${settings.companies.officeLat}, Lng ${settings.companies.officeLng}`
      );
    });

    console.log("\n✅ Company settings update completed successfully!");
  } catch (error) {
    console.error("❌ Error updating company settings:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateCompanySettings()
  .then(() => {
    console.log("\n✨ Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });

