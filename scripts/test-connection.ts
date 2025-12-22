/**
 * Test Database Connection Script
 * Tests if database connection works
 * 
 * Usage:
 *   DIRECT_URL="postgresql://..." tsx scripts/test-connection.ts
 */

import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ Database URL not found!");
  console.error("   Please set DIRECT_URL or DATABASE_URL environment variable");
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function main() {
  try {
    console.log("🔍 Testing database connection...");
    console.log(`   URL: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`); // Hide password
    console.log();

    // Test connection
    await prisma.$connect();
    console.log("✅ Connection successful!");

    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Query test successful!");

    console.log();
    console.log("📊 Database is ready!");
    console.log("   You can now run: CHECK_ADMIN_EXISTS.bat");

    process.exit(0);
  } catch (error: any) {
    console.error();
    console.error("❌ Connection failed!");
    console.error(`   Error: ${error.message}`);
    console.error();
    console.error("Possible issues:");
    console.error("   1. Database URL incorrect");
    console.error("   2. Password incorrect");
    console.error("   3. Database not accessible");
    console.error("   4. Network/firewall issue");
    console.error();
    console.error("Please verify:");
    console.error("   - Database URL in Supabase dashboard");
    console.error("   - Password is correct");
    console.error("   - Database is running");
    console.error("   - Network access is available");

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

