/**
 * Find Correct Cloudinary Cloud Name
 * Tests different variations of Cloud Name
 */

const API_KEY = "438135271847632";
const API_SECRET = "pFK3kvryO_4vwxW-uLEUom380IA";

// Possible Cloud Name variations
const possibleNames = [
  "atacrm",
  "ata-crm",
  "ata_crm",
  "ATA-CRM",
  "ATA_CRM",
  "ATACRM",
  "ata-crm-name",
  "ata_crm_name",
  "ATA-CRM-NAME",
];

async function testCloudName(cloudName: string): Promise<boolean> {
  try {
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: cloudName,
      api_key: API_KEY,
      api_secret: API_SECRET,
      secure: true,
    });

    // Try to get account details (simple API call to verify credentials)
    return new Promise((resolve) => {
      cloudinary.api.ping((error: any, result: any) => {
        if (error) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  } catch (error) {
    return false;
  }
}

async function findCloudName() {
  console.log("🔍 Searching for correct Cloudinary Cloud Name...\n");
  console.log(`API Key: ${API_KEY}`);
  console.log(`Testing ${possibleNames.length} possible variations...\n`);

  for (const name of possibleNames) {
    process.stdout.write(`Testing "${name}"... `);
    const isValid = await testCloudName(name);
    
    if (isValid) {
      console.log("✅ VALID!");
      console.log(`\n🎉 Found correct Cloud Name: "${name}"\n`);
      console.log("Add this to your .env file:");
      console.log(`CLOUDINARY_CLOUD_NAME="${name}"\n`);
      process.exit(0);
    } else {
      console.log("❌ Invalid");
    }
  }

  console.log("\n❌ None of the tested variations worked!");
  console.log("\n📋 Please check your Cloudinary Dashboard:");
  console.log("   1. Go to https://cloudinary.com/console");
  console.log("   2. Settings → Account Details");
  console.log("   3. Copy the exact Cloud Name (usually lowercase, no spaces)");
  console.log("   4. Update .env file with the correct name\n");
  process.exit(1);
}

findCloudName();

