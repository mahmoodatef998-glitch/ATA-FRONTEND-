const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetRadius() {
  try {
    await prisma.company_settings.updateMany({
      data: { checkInRadius: 500 }
    });
    console.log('✅ checkInRadius reset to 500 meters');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetRadius();

