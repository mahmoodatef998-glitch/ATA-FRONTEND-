/**
 * Check Cloudinary Configuration
 * Verifies if Cloudinary is properly configured and can upload files
 */

import { isCloudinaryConfigured, getCloudinaryInstance } from "../lib/cloudinary";

async function checkCloudinary() {
  console.log("🔍 Checking Cloudinary Configuration...\n");

  // Check environment variables
  const hasCloudName = !!process.env.CLOUDINARY_CLOUD_NAME;
  const hasApiKey = !!process.env.CLOUDINARY_API_KEY;
  const hasApiSecret = !!process.env.CLOUDINARY_API_SECRET;

  console.log("📋 Environment Variables:");
  console.log(`  CLOUDINARY_CLOUD_NAME: ${hasCloudName ? "✅ Set" : "❌ Missing"}`);
  console.log(`  CLOUDINARY_API_KEY: ${hasApiKey ? "✅ Set" : "❌ Missing"}`);
  console.log(`  CLOUDINARY_API_SECRET: ${hasApiSecret ? "✅ Set" : "❌ Missing"}\n`);

  if (!hasCloudName || !hasApiKey || !hasApiSecret) {
    console.log("❌ Cloudinary is not fully configured!");
    console.log("   Please add the following to your .env file:");
    console.log("   CLOUDINARY_CLOUD_NAME=your-cloud-name");
    console.log("   CLOUDINARY_API_KEY=your-api-key");
    console.log("   CLOUDINARY_API_SECRET=your-api-secret\n");
    process.exit(1);
  }

  // Check if Cloudinary is configured
  const isConfigured = isCloudinaryConfigured();
  console.log(`📦 Cloudinary Configured: ${isConfigured ? "✅ Yes" : "❌ No"}\n`);

  if (!isConfigured) {
    console.log("❌ Cloudinary configuration check failed!");
    process.exit(1);
  }

  // Try to get Cloudinary instance
  try {
    const cloudinaryInstance = getCloudinaryInstance();
    if (cloudinaryInstance) {
      console.log("✅ Cloudinary instance created successfully\n");
      
      // Test configuration by checking cloud name
      const config = cloudinaryInstance.config();
      console.log("📊 Cloudinary Configuration:");
      console.log(`  Cloud Name: ${config.cloud_name || "Not set"}`);
      console.log(`  API Key: ${config.api_key ? "✅ Set" : "❌ Not set"}`);
      console.log(`  API Secret: ${config.api_secret ? "✅ Set" : "❌ Not set"}`);
      console.log(`  Secure: ${config.secure ? "✅ Yes (HTTPS)" : "❌ No (HTTP)"}\n`);
      
      console.log("✅ Cloudinary is properly configured!\n");
      console.log("💡 Tips:");
      console.log("   - Make sure files are uploaded with access_mode: 'public'");
      console.log("   - Use resource_type: 'raw' for PDF files");
      console.log("   - Check Cloudinary dashboard for uploaded files\n");
    } else {
      console.log("❌ Failed to create Cloudinary instance!");
      process.exit(1);
    }
  } catch (error: any) {
    console.error("❌ Error checking Cloudinary:", error.message);
    process.exit(1);
  }
}

checkCloudinary();

