/**
 * Test Cloudinary Credentials Directly
 */

const cloudinary = require('cloudinary').v2;

// Test with provided credentials
const cloudName = "test";
const apiKey = "525278541637313";
const apiSecret = "5OIaSSiMQExL8GPBkasDCcVnjC0";

console.log("🧪 Testing Cloudinary Credentials...\n");
console.log(`Cloud Name: ${cloudName}`);
console.log(`API Key: ${apiKey}`);
console.log(`API Secret: ${apiSecret.substring(0, 10)}...\n`);

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

// Test ping
cloudinary.api.ping((error: any, result: any) => {
  if (error) {
    console.error("❌ Error:", error.message);
    console.error("   HTTP Code:", error.http_code);
    console.error("   Error Name:", error.name);
    
    if (error.message.includes("cloud_name")) {
      console.log("\n💡 Cloud Name is incorrect!");
      console.log("   Please check Cloudinary Dashboard for the correct Cloud Name.");
    } else if (error.http_code === 401) {
      console.log("\n💡 Authentication failed!");
      console.log("   Please verify:");
      console.log("   - Cloud Name is correct");
      console.log("   - API Key is correct");
      console.log("   - API Secret is correct");
      console.log("   - All credentials are from the same account");
    }
    process.exit(1);
  } else {
    console.log("✅ Success! Cloudinary is working!");
    console.log("   Status:", result.status);
    console.log("\n🎉 Credentials are correct!");
    console.log(`\nAdd to .env:`);
    console.log(`CLOUDINARY_CLOUD_NAME="${cloudName}"`);
    console.log(`CLOUDINARY_API_KEY="${apiKey}"`);
    console.log(`CLOUDINARY_API_SECRET="${apiSecret}"\n`);
    process.exit(0);
  }
});

