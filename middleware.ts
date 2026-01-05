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
  const url = request.nextUrl.toString();
  const searchParams = request.nextUrl.searchParams;
  
  // ✅ CRITICAL: Check RSC in URL FIRST (before any other checks)
  // This must be the FIRST check to catch all RSC requests immediately
  // Next.js sends RSC requests with ?_rsc=xxx in the URL
  if (url.includes('_rsc=') || url.includes('?_rsc') || searchParams.has('_rsc')) {
    return new NextResponse(null, { 
      status: 204,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-RSC-Blocked': 'url-check',
      }
    });
  }
  
  // ✅ Performance: Early return for static files and API routes (skip RSC checks)
  // This improves performance by skipping unnecessary checks
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/.well-known')
  ) {
    return NextResponse.next();
  }
  
  // ✅ CRITICAL: Check ALL possible RSC headers (comprehensive blocking)
  // Check headers AFTER URL check but BEFORE other logic
  const isRscPrefetch = 
    request.headers.get('next-router-prefetch') === '1' ||
    request.headers.get('next-router-segment-prefetch') !== null ||
    request.headers.get('next-router-segment-prefetch') !== undefined;
  const isRscRequest = 
    request.headers.get('rsc') === '1' ||
    request.headers.get('next-router-state-tree') !== null ||
    request.headers.get('next-router-state-tree') !== undefined;
  
  // ✅ Block ALL RSC requests immediately (headers check)
  if (isRscPrefetch || isRscRequest) {
    return new NextResponse(null, { 
      status: 204,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-RSC-Blocked': 'header-check',
      }
    });
  }
  
  // ✅ CRITICAL: Block HEAD requests ONLY for prefetch checks (not for Vercel health checks)
  // Allow HEAD requests for:
  // - Vercel health checks (x-vercel-draft-status header)
  // - Root path (/) for initial page load
  // Block HEAD requests for:
  // - Prefetch checks (without x-vercel-draft-status)
  // - Internal navigation prefetch
  if (method === 'HEAD') {
    // ✅ Allow Vercel health checks and root path
    const isVercelHealthCheck = request.headers.get('x-vercel-draft-status') !== null;
    const isRootPath = pathname === '/';
    
    // Allow Vercel health checks and root path HEAD requests
    if (isVercelHealthCheck || isRootPath) {
      return NextResponse.next();
    }
    
    // Block other HEAD requests (prefetch checks)
    return new NextResponse(null, { 
      status: 204,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-HEAD-Blocked': 'prefetch-check',
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
// ✅ FIX: Simplified matcher pattern to avoid conflicts and ensure comprehensive coverage
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - image files (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
