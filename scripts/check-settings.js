const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSettings() {
  try {
    const settings = await prisma.company_settings.findMany({
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

    console.log('Company Settings:');
    console.log(JSON.stringify(settings, null, 2));

    const companies = await prisma.companies.findMany({
      select: {
        id: true,
        name: true,
        officeLat: true,
        officeLng: true,
      },
    });

    console.log('\nCompanies:');
    console.log(JSON.stringify(companies, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSettings();

