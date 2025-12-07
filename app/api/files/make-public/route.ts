import { NextRequest, NextResponse } from "next/server";
import { makeFilePublic, extractPublicIdFromUrl, isCloudinaryUrl } from "@/lib/cloudinary";

/**
 * API Route to make a Cloudinary file public
 * This helps fix 401 errors for old files that were uploaded as private
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      );
    }

    // Only process Cloudinary URLs
    if (!isCloudinaryUrl(url)) {
      return NextResponse.json(
        { success: false, error: "Not a Cloudinary URL" },
        { status: 400 }
      );
    }

    // Extract public_id from URL
    const extracted = extractPublicIdFromUrl(url);
    if (!extracted) {
      return NextResponse.json(
        { success: false, error: "Could not extract public_id from URL" },
        { status: 400 }
      );
    }

    const { publicId, resourceType } = extracted;
    console.log(`🔧 Making file public: ${publicId} (${resourceType})`);
    console.log(`🔍 Original URL: ${url}`);
    console.log(`🔍 Extracted public_id: ${publicId}`);
    console.log(`🔍 Extracted resource_type: ${resourceType}`);

    // Make file public
    try {
      const success = await makeFilePublic(publicId, resourceType);

      if (success) {
        return NextResponse.json({
          success: true,
          message: "File is now public",
          publicId,
          resourceType,
        });
      } else {
        return NextResponse.json(
          { 
            success: false, 
            error: "Failed to make file public",
            details: {
              publicId,
              resourceType,
              url,
            }
          },
          { status: 500 }
        );
      }
    } catch (error: any) {
      console.error("❌ Error in makeFilePublic:", error);
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || "Failed to make file public",
          details: {
            publicId,
            resourceType,
            url,
            stack: error.stack,
          }
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error making file public:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to make file public" },
      { status: 500 }
    );
  }
}

