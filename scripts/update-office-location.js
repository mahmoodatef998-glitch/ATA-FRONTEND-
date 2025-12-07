/**
 * Script to update company office location
 * Usage: node scripts/update-office-location.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateOfficeLocation() {
  try {
    console.log('📍 Updating office location to: 25.323110, 55.482778');
    console.log('   (25°19\'23.2"N 55°28\'58.0"E)\n');

    // Get all companies
    const companies = await prisma.companies.findMany({
      select: {
        id: true,
        name: true,
        officeLat: true,
        officeLng: true,
      },
    });

    if (companies.length === 0) {
      console.log('❌ No companies found in database');
      return;
    }

    // Update each company
    for (const company of companies) {
      console.log(`Updating company: ${company.name} (ID: ${company.id})`);
      console.log(`  Old location: ${company.officeLat || 'null'}, ${company.officeLng || 'null'}`);

      const updated = await prisma.companies.update({
        where: { id: company.id },
        data: {
          officeLat: 25.323110,
          officeLng: 55.482778,
          updatedAt: new Date(),
        },
      });

      console.log(`  ✅ New location: ${updated.officeLat}, ${updated.officeLng}\n`);
    }

    console.log('✅ Office location updated successfully for all companies!');
  } catch (error) {
    console.error('❌ Error updating office location:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateOfficeLocation();

