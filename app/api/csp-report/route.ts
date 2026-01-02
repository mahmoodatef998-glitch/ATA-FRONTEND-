import { NextRequest, NextResponse } from "next/server";

/**
 * CSP Report Endpoint
 * 
 * Silently handles Content Security Policy violation reports
 * This helps identify issues without blocking functionality
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log CSP violations in development only
    if (process.env.NODE_ENV === "development") {
      console.debug("CSP Violation:", body);
    }
    
    // Ignore Pusher errors (likely from browser extensions)
    const blockedUri = body["csp-report"]?.blockedUri || "";
    if (blockedUri.includes("pusher")) {
      // Silently ignore - this is from browser extensions, not our code
      return NextResponse.json({ success: true }, { status: 204 });
    }
    
    // Return 204 No Content for CSP reports
    return NextResponse.json({ success: true }, { status: 204 });
  } catch (error) {
    // Silently fail - CSP reports are not critical
    return NextResponse.json({ success: true }, { status: 204 });
  }
}

