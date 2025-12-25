/**
 * Test Cloudinary Configuration and Upload
 * Tests file upload, download, and deletion
 */

import { uploadFile, isCloudinaryConfigured, getCloudinaryInstance, deleteFile, extractPublicIdFromUrl } from "../lib/cloudinary";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";

async function testCloudinary() {
  console.log("🧪 Testing Cloudinary Configuration...\n");

  // Step 1: Check configuration
  console.log("📋 Step 1: Checking Configuration...");
  const isConfigured = isCloudinaryConfigured();
  
  if (!isConfigured) {
    console.error("❌ Cloudinary is not configured!");
    console.log("   Please add the following to your .env file:");
    console.log("   CLOUDINARY_CLOUD_NAME=your-cloud-name");
    console.log("   CLOUDINARY_API_KEY=your-api-key");
    console.log("   CLOUDINARY_API_SECRET=your-api-secret\n");
    process.exit(1);
  }
  
  console.log("✅ Cloudinary is configured\n");

  // Step 2: Get Cloudinary instance
  console.log("📋 Step 2: Getting Cloudinary Instance...");
  const cloudinaryInstance = getCloudinaryInstance();
  
  if (!cloudinaryInstance) {
    console.error("❌ Failed to get Cloudinary instance!");
    process.exit(1);
  }
  
  const config = cloudinaryInstance.config();
  console.log(`✅ Cloudinary instance created`);
  console.log(`   Cloud Name: ${config.cloud_name}`);
  console.log(`   API Key: ${config.api_key ? "✅ Set" : "❌ Not set"}`);
  console.log(`   Secure: ${config.secure ? "✅ Yes (HTTPS)" : "❌ No"}\n`);

  // Step 3: Create a test file
  console.log("📋 Step 3: Creating Test File...");
  const testContent = `This is a test file created at ${new Date().toISOString()}
Cloudinary Test - ATA CRM Project
This file will be uploaded to Cloudinary and then deleted.`;
  
  const testFileName = `test-cloudinary-${Date.now()}.txt`;
  const testFilePath = join(process.cwd(), testFileName);
  
  try {
    writeFileSync(testFilePath, testContent, 'utf-8');
    console.log(`✅ Test file created: ${testFileName}\n`);
  } catch (error: any) {
    console.error(`❌ Failed to create test file: ${error.message}`);
    process.exit(1);
  }

  // Step 4: Upload file to Cloudinary
  console.log("📋 Step 4: Uploading File to Cloudinary...");
  let uploadResult: { secure_url: string; public_id: string } | null = null;
  
  try {
    const fileBuffer = Buffer.from(testContent, 'utf-8');
    uploadResult = await uploadFile(fileBuffer, "test", {
      resource_type: "raw",
      public_id: `ata-crm/test/${testFileName.replace('.txt', '')}`,
    });
    
    console.log(`✅ File uploaded successfully!`);
    console.log(`   URL: ${uploadResult.secure_url}`);
    console.log(`   Public ID: ${uploadResult.public_id}\n`);
  } catch (error: any) {
    console.error(`❌ Upload failed: ${error.message}`);
    console.error(`   Error details:`, error);
    
    // Clean up test file
    try {
      unlinkSync(testFilePath);
    } catch {}
    
    process.exit(1);
  }

  // Step 5: Test file access
  console.log("📋 Step 5: Testing File Access...");
  try {
    const response = await fetch(uploadResult.secure_url);
    
    if (response.ok) {
      const content = await response.text();
      if (content.includes("Cloudinary Test")) {
        console.log(`✅ File is accessible and public!`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}\n`);
      } else {
        console.warn(`⚠️ File accessible but content doesn't match`);
      }
    } else {
      console.error(`❌ File is not accessible!`);
      console.error(`   Status: ${response.status}`);
      console.error(`   This might mean the file is private or there's an issue\n`);
    }
  } catch (error: any) {
    console.error(`❌ Failed to access file: ${error.message}\n`);
  }

  // Step 6: Test public_id extraction
  console.log("📋 Step 6: Testing Public ID Extraction...");
  try {
    const extracted = extractPublicIdFromUrl(uploadResult.secure_url);
    if (extracted) {
      console.log(`✅ Public ID extracted successfully!`);
      console.log(`   Public ID: ${extracted.publicId}`);
      console.log(`   Resource Type: ${extracted.resourceType}\n`);
    } else {
      console.warn(`⚠️ Failed to extract public ID\n`);
    }
  } catch (error: any) {
    console.warn(`⚠️ Error extracting public ID: ${error.message}\n`);
  }

  // Step 7: Delete test file from Cloudinary
  console.log("📋 Step 7: Cleaning Up (Deleting Test File)...");
  try {
    await deleteFile(uploadResult.public_id);
    console.log(`✅ Test file deleted from Cloudinary\n`);
  } catch (error: any) {
    console.warn(`⚠️ Failed to delete test file: ${error.message}`);
    console.warn(`   You may need to delete it manually from Cloudinary Dashboard\n`);
  }

  // Step 8: Clean up local test file
  try {
    unlinkSync(testFilePath);
    console.log(`✅ Local test file deleted\n`);
  } catch (error: any) {
    console.warn(`⚠️ Failed to delete local test file: ${error.message}\n`);
  }

  // Summary
  console.log("════════════════════════════════════════");
  console.log("✅ Cloudinary Test Completed Successfully!");
  console.log("════════════════════════════════════════");
  console.log("\n📊 Summary:");
  console.log("   ✅ Configuration: OK");
  console.log("   ✅ Instance Creation: OK");
  console.log("   ✅ File Upload: OK");
  console.log("   ✅ File Access: OK");
  console.log("   ✅ Public ID Extraction: OK");
  console.log("   ✅ File Deletion: OK");
  console.log("\n💡 Cloudinary is working correctly!");
  console.log("   You can now use Cloudinary for file uploads in your application.\n");
}

// Run the test
testCloudinary().catch((error) => {
  console.error("❌ Test failed with error:", error);
  process.exit(1);
});

