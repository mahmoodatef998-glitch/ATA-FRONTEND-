/**
 * Middleware - Lightweight authentication check
 * Auto-redirects unauthenticated users from /dashboard to /login
 * 
 * Size: < 100 KB (Vercel Free Plan limit: 1 MB)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;
  
  // ✅ Performance: PRIORITY 1 - Block ALL RSC requests immediately (before any other logic)
  // This is the most critical optimization for sub-1.5s page loads
  // ✅ FIX: Simplified blocking - block ANY RSC request directly (no complex conditions)
  const isRscPrefetch = request.headers.get('next-router-prefetch') === '1';
  const isRscRequest = request.headers.get('rsc') === '1';
  
  // ✅ Block ALL RSC requests immediately (most aggressive blocking)
  // Block ANY RSC request - this prevents all RSC storms
  if (isRscPrefetch || isRscRequest) {
    return new NextResponse(null, { 
      status: 204, // No Content
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-RSC-Blocked': 'true', // Debug header
      }
    });
  }
  
  // ✅ Performance: PRIORITY 2 - Block ALL HEAD requests to page routes
  // HEAD requests are used for prefetch checks - blocking them speeds up navigation
  if (
    method === 'HEAD' && 
    !pathname.startsWith('/api') && 
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/images') &&
    !pathname.startsWith('/favicon')
  ) {
    return new NextResponse(null, { 
      status: 204,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });
  }

  // Only check authentication for dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // Check for NextAuth session token in cookies
    // In production, cookie name might be __Secure-next-auth.session-token
    const sessionToken = 
      request.cookies.get('next-auth.session-token')?.value ||
      request.cookies.get('__Secure-next-auth.session-token')?.value;

    // If no session token, redirect to login
    if (!sessionToken) {
      const loginUrl = new URL('/login', request.url);
      // Preserve the original URL for redirect after login
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // For client portal routes, check client token
  if (request.nextUrl.pathname.startsWith('/client/portal')) {
    const clientToken = request.cookies.get('client-token')?.value;

    if (!clientToken) {
      const loginUrl = new URL('/client/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow request to proceed
  return NextResponse.next();
}

// ✅ Performance: Run middleware on all routes to block RSC prefetch requests
// This ensures RSC prefetch blocking works across the entire application
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/client/portal/:path*',
    '/team/:path*',        // ✅ Add team routes
    '/login',              // ✅ Add login route
    '/client/login',       // ✅ Add client login route
    '/',                   // ✅ Add home page
    '/((?!api|_next/static|_next/image|favicon.ico).*)', // ✅ Match all routes except static files
  ],
};
