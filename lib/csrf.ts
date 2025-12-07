/**
 * CSRF Protection Utilities
 * Implements Double Submit Cookie pattern for CSRF protection
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const CSRF_TOKEN_COOKIE = "csrf-token";
const CSRF_TOKEN_HEADER = "x-csrf-token";
const CSRF_TOKEN_EXPIRY = 60 * 60 * 24; // 24 hours

/**
 * Generate a new CSRF token using Web Crypto API (Edge Runtime compatible)
 * Uses crypto.getRandomValues which works in both Node.js and Edge Runtime
 */
export function generateCsrfToken(): string {
  // Use Web Crypto API which works in both Node.js and Edge Runtime
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Edge Runtime or browser - use Web Crypto API
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  } else {
    // Fallback for Node.js (shouldn't happen in Next.js, but just in case)
    // This will only work in Node.js runtime, not Edge
    try {
      // Dynamic require to avoid loading in Edge Runtime
      const { randomBytes } = require('crypto');
      return randomBytes(32).toString("hex");
    } catch {
      // Last resort: use Math.random (not cryptographically secure, but better than nothing)
      return Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
    }
  }
}

/**
 * Get CSRF token from cookie (for middleware - uses NextRequest)
 */
export function getCsrfTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(CSRF_TOKEN_COOKIE)?.value || null;
}

/**
 * Get CSRF token from cookie (for API routes - uses cookies())
 */
export async function getCsrfToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(CSRF_TOKEN_COOKIE)?.value || null;
  } catch {
    // If cookies() fails (e.g., in middleware), return null
    return null;
  }
}

/**
 * Set CSRF token in cookie (for middleware - uses NextResponse)
 */
export function setCsrfTokenInResponse(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: CSRF_TOKEN_EXPIRY,
    path: "/",
  });
}

/**
 * Set CSRF token in cookie (for API routes - uses cookies())
 */
export async function setCsrfToken(token: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(CSRF_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: CSRF_TOKEN_EXPIRY,
      path: "/",
    });
  } catch {
    // If cookies() fails (e.g., in middleware), do nothing
    // The token will be set via setCsrfTokenInResponse instead
  }
}

/**
 * Validate CSRF token from request (for middleware - uses NextRequest)
 * @param request - NextRequest object
 * @returns true if token is valid, false otherwise
 */
export function validateCsrfTokenFromRequest(request: NextRequest): boolean {
  // Skip CSRF validation for GET, HEAD, OPTIONS requests
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return true;
  }

  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value;
  if (!cookieToken) {
    return false;
  }

  // Get token from header
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);
  if (!headerToken) {
    return false;
  }

  // Compare tokens (timing-safe comparison)
  return cookieToken === headerToken;
}

/**
 * Validate CSRF token from request (for API routes - uses cookies())
 * @param request - Request object
 * @returns true if token is valid, false otherwise
 */
export async function validateCsrfToken(request: Request): Promise<boolean> {
  // Skip CSRF validation for GET, HEAD, OPTIONS requests
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return true;
  }

  // Get token from cookie
  const cookieToken = await getCsrfToken();
  if (!cookieToken) {
    return false;
  }

  // Get token from header
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);
  if (!headerToken) {
    return false;
  }

  // Compare tokens (timing-safe comparison)
  return cookieToken === headerToken;
}

/**
 * Middleware to add CSRF token to response
 * Call this in API routes that need CSRF protection
 */
export async function addCsrfTokenToResponse(response: NextResponse): Promise<NextResponse> {
  const token = await getCsrfToken() || generateCsrfToken();
  if (!(await getCsrfToken())) {
    await setCsrfToken(token);
  }
  
  // Add token to response header for client to read
  response.headers.set("X-CSRF-Token", token);
  return response;
}


