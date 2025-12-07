const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateCheckInRadius() {
  try {
    console.log('📍 Updating checkInRadius to 2000 meters\n');

    const settings = await prisma.company_settings.findMany();

    for (const setting of settings) {
      console.log(`Updating company settings ID: ${setting.id}`);
      console.log(`  Old checkInRadius: ${setting.checkInRadius} meters`);

      const updated = await prisma.company_settings.update({
        where: { id: setting.id },
        data: {
          checkInRadius: 2000, // 2000 meters = 2 km
          updatedAt: new Date(),
        },
      });

      console.log(`  ✅ New checkInRadius: ${updated.checkInRadius} meters`);
      console.log(`  ✅ Effective radius (with 100m tolerance): ${updated.checkInRadius + 100} meters\n`);
    }

    console.log('✅ checkInRadius updated successfully!');
  } catch (error) {
    console.error('❌ Error updating checkInRadius:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateCheckInRadius();

