import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl, isCloudinaryUrl } from "@/lib/cloudinary";

/**
 * API Route to generate signed URLs for Cloudinary files
 * This helps access private files that return 401 Unauthorized
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
        { success: true, signedUrl: url }, // Return original URL if not Cloudinary
      );
    }

    // Generate signed URL
    const signedUrl = getSignedUrl(url);

    return NextResponse.json({
      success: true,
      signedUrl,
      originalUrl: url,
    });
  } catch (error: any) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate signed URL" },
      { status: 500 }
    );
  }
}

