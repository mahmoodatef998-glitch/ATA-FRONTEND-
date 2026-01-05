import { NextResponse } from 'next/server';

/**
 * API Route to block RSC prefetch requests
 * 
 * This route is used by next.config.ts rewrites to intercept
 * and block RSC prefetch requests before they reach the server.
 * 
 * Returns 204 No Content to prevent unnecessary processing.
 */
export async function GET() {
  return new NextResponse(null, {
    status: 204, // No Content
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-RSC-Blocked': 'true',
    },
  });
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-RSC-Blocked': 'true',
    },
  });
}

