import { NextRequest, NextResponse } from "next/server";
import { getCloudinaryInstance } from "@/lib/cloudinary";

/**
 * API Route to make all files in a Cloudinary folder public
 * This helps fix 401 errors for old files that were uploaded as private
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { folder } = body;

    if (!folder || typeof folder !== 'string') {
      return NextResponse.json(
        { success: false, error: "Folder path is required (e.g., 'ata-crm/po')" },
        { status: 400 }
      );
    }

    const cloudinaryInstance = getCloudinaryInstance();
    
    if (!cloudinaryInstance) {
      return NextResponse.json(
        { success: false, error: "Cloudinary is not configured" },
        { status: 500 }
      );
    }

    try {
      // List all resources in the folder
      const listResult = await cloudinaryInstance.api.resources({
        type: 'upload',
        prefix: folder,
        max_results: 500, // Adjust based on your needs
      });

      const resources = listResult.resources || [];
      console.log(`📋 Found ${resources.length} files in folder: ${folder}`);

      const results = {
        total: resources.length,
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      // Update each file to public
      for (const resource of resources) {
        try {
          await cloudinaryInstance.uploader.update(resource.public_id, {
            resource_type: resource.resource_type || 'raw',
            access_mode: 'public',
          });
          
          results.success++;
          console.log(`✅ Made public: ${resource.public_id}`);
        } catch (error: any) {
          results.failed++;
          const errorMsg = `Failed to make ${resource.public_id} public: ${error.message}`;
          results.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Processed ${results.total} files`,
        results: {
          total: results.total,
          success: results.success,
          failed: results.failed,
          errors: results.errors.slice(0, 10), // Return first 10 errors
        },
      });
    } catch (error: any) {
      console.error("Error listing/updating resources:", error);
      return NextResponse.json(
        { success: false, error: error.message || "Failed to process folder" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in bulk make-public:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}

