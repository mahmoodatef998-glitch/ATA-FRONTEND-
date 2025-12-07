/**
 * Get Current User with Permissions
 * Returns user info including permissions and roles
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getUserPermissions, getUserRoles } from "@/lib/rbac/permission-service";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
    const companyId = typeof session.user.companyId === "string" ? parseInt(session.user.companyId) : session.user.companyId;

    // Get permissions and roles
    const [permissions, roles] = await Promise.all([
      getUserPermissions(userId, companyId),
      getUserRoles(userId),
    ]);

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
    console.error("Error fetching user info:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch user info" },
      { status: error.status || 500 }
    );
  }
}


