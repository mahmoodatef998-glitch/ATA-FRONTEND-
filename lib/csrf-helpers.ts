/**
 * CSRF Protection Helper for API Routes
 * Use this in API routes that modify data (POST, PUT, PATCH, DELETE)
 */

import { NextRequest, NextResponse } from "next/server";
import { validateCsrfToken } from "./csrf";
import { ForbiddenError } from "./error-handler";

/**
 * Validate CSRF token in API route
 * Throws ForbiddenError if token is invalid
 * 
 * Usage:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   await validateCsrfInApiRoute(request);
 *   // ... rest of handler
 * }
 * ```
 */
export async function validateCsrfInApiRoute(request: NextRequest): Promise<void> {
  const isValid = await validateCsrfToken(request);
  if (!isValid) {
    throw new ForbiddenError("Invalid or missing CSRF token");
  }
}

/**
 * Skip CSRF validation for specific routes (e.g., public APIs)
 * Use this sparingly and only for routes that truly don't need CSRF protection
 */
export const CSRF_SKIP_ROUTES = [
  "/api/public/",
  "/api/client/login",
  "/api/client/register",
];

/**
 * Check if route should skip CSRF validation
 */
export function shouldSkipCsrf(pathname: string): boolean {
  return CSRF_SKIP_ROUTES.some(route => pathname.startsWith(route));
}

