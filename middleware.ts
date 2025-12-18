import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { generateCsrfToken } from "@/lib/csrf";
import { UserRole } from "@prisma/client";

/**
 * Check if role can access Our Team module
 * Inline function to avoid Edge Runtime import issues
 */
function canAccessTeamModule(role: UserRole): boolean {
  const teamRoles: UserRole[] = [
    UserRole.ADMIN,
    UserRole.HR,
    UserRole.OPERATIONS_MANAGER,
    UserRole.SUPERVISOR,
    UserRole.TECHNICIAN,
    UserRole.ACCOUNTANT, // Accountant can access team module for attendance management
  ];
  return teamRoles.includes(role);
}

export async function middleware(request: NextRequest) {
  // Security Headers - Applied to all routes
  const response = NextResponse.next();

  // Enhanced Security Headers (Helmet.js equivalent)
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Allow geolocation for attendance check-in/out
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  
  // Additional Helmet.js headers
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("X-Download-Options", "noopen");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  response.headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  // Content Security Policy
  // Note: Next.js 15 requires 'unsafe-eval' for development, but we minimize it
  const isDev = process.env.NODE_ENV === "development";
  const csp = [
    "default-src 'self'",
    // Scripts: Allow self, and only unsafe-eval in development (Next.js requirement)
    // In production, Next.js should work without unsafe-eval
    isDev
      ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline'", // Production: only unsafe-inline for Next.js
    // Styles: Tailwind requires unsafe-inline, but we keep it minimal
    "style-src 'self' 'unsafe-inline'",
    // Images: Allow self, data URIs, and HTTPS images (for Cloudinary, etc.)
    "img-src 'self' data: https:",
    // Fonts: Allow self and data URIs
    "font-src 'self' data:",
    // Connections: Only to self (API calls)
    "connect-src 'self'",
    // No frame embedding
    "frame-ancestors 'none'",
    // Prevent base tag injection
    "base-uri 'self'",
    // Form actions: only to self
    "form-action 'self'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  // HSTS - Only in production with HTTPS
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  // Check if route requires authentication
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/dashboard")) {
    const session = await auth();
    if (!session) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protect Our Team module routes - only allow users with team module access
  if (pathname.startsWith("/team")) {
    const session = await auth();
    if (!session) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    
    // Check if user has access to team module
    if (!canAccessTeamModule(session.user.role)) {
      // Don't redirect to /dashboard if user is technician/supervisor (they can't access it)
      // Instead, show access denied or redirect to home
      if (session.user.role === UserRole.TECHNICIAN || session.user.role === UserRole.SUPERVISOR) {
        // This shouldn't happen, but if it does, redirect to team anyway
        // (they should have access, but if there's a bug, at least don't redirect to dashboard)
        return NextResponse.next();
      }
      // For other roles without team access, redirect to dashboard
      const url = new URL("/dashboard", request.url);
      return NextResponse.redirect(url);
    }
  }
  
  // Protect Dashboard routes - redirect technicians, supervisors, and HR to /team
  if (pathname.startsWith("/dashboard")) {
    const session = await auth();
    if (session && session.user) {
      // Redirect team members to their dashboard (HR should only access Our Team section)
      if (session.user.role === UserRole.TECHNICIAN || session.user.role === UserRole.SUPERVISOR || session.user.role === UserRole.HR) {
        const url = new URL("/team", request.url);
        return NextResponse.redirect(url);
      }
    }
  }

  // Add CSRF token to response for authenticated users
  // Skip for API routes that don't need CSRF (public endpoints)
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/team")) {
    const session = await auth();
    if (session) {
      // Use request.cookies directly in middleware (cookies() doesn't work here)
      let token = request.cookies.get("csrf-token")?.value;
      if (!token) {
        token = generateCsrfToken();
        // Set cookie in response (middleware compatible)
        response.cookies.set("csrf-token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 60 * 60 * 24, // 24 hours
          path: "/",
        });
      }
      response.headers.set("X-CSRF-Token", token);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

