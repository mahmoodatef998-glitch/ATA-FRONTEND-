/**
 * Verify Cloudinary Credentials
 * Tests API credentials directly with Cloudinary API
 */

const API_KEY = "438135271847632";
const API_SECRET = "pFK3kvryO_4vwxW-uLEUom380IA";

async function verifyCredentials(cloudName: string) {
  try {
    const cloudinary = require('cloudinary').v2;
    
    cloudinary.config({
      cloud_name: cloudName,
      api_key: API_KEY,
      api_secret: API_SECRET,
      secure: true,
    });

    console.log(`\n🔍 Testing Cloud Name: "${cloudName}"`);
    console.log(`   API Key: ${API_KEY}`);
    console.log(`   API Secret: ${API_SECRET.substring(0, 10)}...`);

    // Test 1: Ping API
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      cloudinary.api.ping((error: any, result: any) => {
        if (error) {
          console.log(`   ❌ Ping failed: ${error.message}`);
          if (error.http_code === 401) {
            console.log(`   ⚠️  Error 401: Invalid credentials or Cloud Name`);
          }
          resolve({ success: false, error: error.message });
        } else {
          console.log(`   ✅ Ping successful!`);
          console.log(`   📊 Status: ${result.status}`);
          resolve({ success: true });
        }
      });
    });
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log("════════════════════════════════════════");
  console.log("   Cloudinary Credentials Verification");
  console.log("════════════════════════════════════════");

  // Test common variations
  const variations = [
    "atacrm",
    "ATACRM",
    "ata-crm",
    "ATA-CRM",
    "ata_crm",
    "ATA_CRM",
  ];

  console.log(`\n📋 Testing ${variations.length} Cloud Name variations...\n`);

  for (const name of variations) {
    const result = await verifyCredentials(name);
    if (result.success) {
      console.log(`\n🎉 SUCCESS! Correct Cloud Name: "${name}"\n`);
      console.log("✅ Add this to your .env file:");
      console.log(`CLOUDINARY_CLOUD_NAME="${name}"\n`);
      process.exit(0);
    }
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("\n❌ None of the variations worked!");
  console.log("\n📋 Please check:");
  console.log("   1. Cloud Name in Cloudinary Dashboard");
  console.log("   2. API Key is correct");
  console.log("   3. API Secret is correct");
  console.log("   4. Account is active\n");
  
  console.log("💡 To find your Cloud Name:");
  console.log("   1. Go to https://cloudinary.com/console");
  console.log("   2. Settings → Account Details");
  console.log("   3. Copy the Cloud Name exactly as shown\n");
  
  process.exit(1);
}

main();

