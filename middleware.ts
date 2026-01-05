/**
 * Middleware - Lightweight authentication check
 * Auto-redirects unauthenticated users from /dashboard to /login
 * 
 * Size: < 100 KB (Vercel Free Plan limit: 1 MB)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // ✅ Performance: Block RSC prefetch requests to prevent RSC storms
  // More aggressive blocking - block ANY RSC request (not just prefetch)
  const isRscPrefetch = request.headers.get('next-router-prefetch') === '1';
  const isRscRequest = request.headers.get('rsc') === '1';
  const hasNextUrl = request.headers.get('next-url');
  const hasRouterStateTree = request.headers.get('next-router-state-tree');
  const pathname = request.nextUrl.pathname;
  const method = request.method;
  
  // ✅ Fix: Block ALL RSC prefetch requests and unnecessary HEAD requests
  // Block if:
  // 1. It's a prefetch request (next-router-prefetch)
  // 2. It's an RSC request with next-url (navigation prefetch)
  // 3. It's an RSC request with next-router-state-tree (navigation prefetch)
  // 4. It's an RSC request to root or common paths (likely prefetch)
  // 5. It's a HEAD request to page routes (likely prefetch check) - except API routes
  const isPrefetchRequest = 
    isRscPrefetch || 
    (isRscRequest && hasNextUrl) || 
    (isRscRequest && hasRouterStateTree) ||
    (isRscRequest && (
      pathname === '/' || 
      pathname.startsWith('/team') || 
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/login')
    ));
  
  const isUnnecessaryHeadRequest = 
    method === 'HEAD' && 
    !pathname.startsWith('/api') && 
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/images') &&
    (pathname.startsWith('/team') || 
     pathname.startsWith('/dashboard') || 
     pathname.startsWith('/login') ||
     pathname === '/');
  
  if (isPrefetchRequest || isUnnecessaryHeadRequest) {
    // Block prefetch requests to prevent RSC storms
    return new NextResponse(null, { status: 204 }); // No Content
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
