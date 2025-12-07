import { NextRequest, NextResponse } from "next/server";
import { isCloudinaryConfigured } from "@/lib/cloudinary";

/**
 * API Route to verify if a Cloudinary file URL is accessible
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

    // Check if it's a Cloudinary URL
    if (!url.includes('cloudinary.com')) {
      return NextResponse.json({
        success: true,
        isCloudinary: false,
        accessible: true, // Assume non-Cloudinary URLs are accessible
        url,
      });
    }

    // Try to fetch the file to check if it's accessible
    try {
      const response = await fetch(url, {
        method: 'HEAD', // Only check headers, don't download the file
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });

      const isAccessible = response.ok; // 200-299 status codes
      const statusCode = response.status;
      const statusText = response.statusText;

      return NextResponse.json({
        success: true,
        isCloudinary: true,
        accessible: isAccessible,
        statusCode,
        statusText,
        url,
        headers: {
          'content-type': response.headers.get('content-type'),
          'content-length': response.headers.get('content-length'),
        },
      });
    } catch (fetchError: any) {
      return NextResponse.json({
        success: false,
        isCloudinary: true,
        accessible: false,
        error: fetchError.message || 'Failed to fetch file',
        url,
      });
    }
  } catch (error: any) {
    console.error("Error verifying file:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify file" },
      { status: 500 }
    );
  }
}

