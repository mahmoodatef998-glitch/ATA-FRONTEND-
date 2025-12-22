/**
 * Middleware - Temporarily disabled for Vercel deployment
 * Authentication will be handled by individual pages
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Minimal middleware - just pass through
  // Authentication handled by pages themselves
  return NextResponse.next();
}

// Restrict matcher to minimum paths to reduce bundle size
export const config = {
  matcher: [],
};
