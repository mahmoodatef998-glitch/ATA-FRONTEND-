import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Simple authentication check for protected routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/team")) {
    const session = await auth();
    
    if (!session) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    
    // Redirect technicians/supervisors/HR from dashboard to team
    if (pathname.startsWith("/dashboard")) {
      const role = session.user?.role;
      if (role === "TECHNICIAN" || role === "SUPERVISOR" || role === "HR") {
        return NextResponse.redirect(new URL("/team", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
