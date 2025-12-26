/**
 * Get Current User with Permissions
 * Returns user info including permissions and roles
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getUserPermissions, getUserRoles } from "@/lib/rbac/permission-service";

// Configure for Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Build-time probe safe response
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    // Get session
    const session = await requireAuth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse user ID and company ID
    const userId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
    const companyId = typeof session.user.companyId === "string" ? parseInt(session.user.companyId) : session.user.companyId;

    // Validate IDs
    if (!userId || isNaN(userId) || !companyId || isNaN(companyId)) {
      console.error("Invalid user ID or company ID:", { userId, companyId, session: session.user });
      return NextResponse.json(
        { success: false, error: "Invalid user data" },
        { status: 400 }
      );
    }

    // Get permissions and roles with error handling
    let permissions: string[] = [];
    let roles: any[] = [];

    try {
      [permissions, roles] = await Promise.all([
        getUserPermissions(userId, companyId),
        getUserRoles(userId),
      ]);
    } catch (permError: any) {
      console.error("Error fetching permissions/roles:", permError);
      // Continue with empty arrays if permissions fail (graceful degradation)
      permissions = [];
      roles = [];
    }

    return NextResponse.json({
      success: true,
      data: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        companyId: session.user.companyId,
        permissions,
        roles: roles.map(r => ({
          name: r.name,
          id: r.id,
          isDefault: r.isDefault,
        })),
      },
    });
  } catch (error: any) {
    console.error("Error in /api/auth/me:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    // Return appropriate status code
    const status = error.status || error.statusCode || 500;
    const message = process.env.NODE_ENV === "production" 
      ? "Failed to fetch user info" 
      : error.message || "Failed to fetch user info";

    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}


