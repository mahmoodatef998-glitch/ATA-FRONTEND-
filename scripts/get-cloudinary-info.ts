/**
 * Get Cloudinary Account Info
 * This will help identify the correct Cloud Name
 */

const cloudinary = require('cloudinary').v2;

// Try to get account info using API
async function getAccountInfo() {
  console.log("🔍 Attempting to get Cloudinary account information...\n");
  
  // We need to test with different Cloud Names
  // But first, let's try to understand the structure
  
  console.log("📋 Instructions:");
  console.log("1. Go to https://cloudinary.com/console");
  console.log("2. After logging in, look at the TOP of the page");
  console.log("3. You should see your Cloud Name next to your account name");
  console.log("4. It's usually displayed as: 'Cloud Name: xxxxx'");
  console.log("\nOR:");
  console.log("1. Go to Settings → Account Details");
  console.log("2. Look for 'Cloud Name' field (NOT 'Key Name')");
  console.log("3. Copy it exactly\n");
  
  console.log("💡 Common Cloud Name formats:");
  console.log("   - Lowercase: 'mycloudname'");
  console.log("   - With numbers: 'mycloud123'");
  console.log("   - With dashes: 'my-cloud-name'");
  console.log("   - With underscores: 'my_cloud_name'");
  console.log("   - Usually 6-20 characters\n");
  
  console.log("⚠️ Important:");
  console.log("   - Cloud Name is DIFFERENT from Key Name");
  console.log("   - Key Name: 'test' (this is NOT Cloud Name)");
  console.log("   - Cloud Name: Usually lowercase, no spaces\n");
}

getAccountInfo();

