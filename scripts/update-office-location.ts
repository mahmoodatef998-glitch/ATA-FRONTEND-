/**
 * Script to update office location for companies
 * Sets the default office location to: Latitude: 25.326922, Longitude: 55.498791
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_OFFICE_LAT = 25.357529;
const DEFAULT_OFFICE_LNG = 55.473482;

async function updateOfficeLocation() {
  try {
    console.log("🔄 Updating office location for all companies...");
    console.log(`📍 Setting location to: Lat ${DEFAULT_OFFICE_LAT}, Lng ${DEFAULT_OFFICE_LNG}`);

    // Update all companies with the new office location (override existing locations)
    const result = await prisma.companies.updateMany({
      data: {
        officeLat: DEFAULT_OFFICE_LAT,
        officeLng: DEFAULT_OFFICE_LNG,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Updated ${result.count} companies with office location`);

    // Verify the update
    const companies = await prisma.companies.findMany({
      select: {
        id: true,
        name: true,
        officeLat: true,
        officeLng: true,
      },
    });

    console.log("\n📋 Current company locations:");
    companies.forEach((company) => {
      console.log(
        `  - ${company.name} (ID: ${company.id}): Lat ${company.officeLat}, Lng ${company.officeLng}`
      );
    });

    console.log("\n✅ Office location update completed successfully!");
  } catch (error) {
    console.error("❌ Error updating office location:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateOfficeLocation()
  .then(() => {
    console.log("\n✨ Script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });

