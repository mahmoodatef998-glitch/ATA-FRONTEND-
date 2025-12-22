/**
 * Simplified Public Orders API
 * Temporary version without problematic dependencies
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Temporary disabled - will be enabled after successful deployment
    return NextResponse.json(
      {
        success: false,
        error: "Public order creation is temporarily disabled. Please contact support.",
        message: "This feature will be available soon."
      },
      { status: 503 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Service temporarily unavailable" },
      { status: 503 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Public Orders API - Temporarily disabled during deployment"
  });
}

