/**
 * Audit Logs API
 * Admin-only endpoint for viewing audit logs
 */

import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/rbac/authorize";
import { getAuditLogs, AuditAction, AuditResource } from "@/lib/rbac/audit-logger";
import { PermissionAction } from "@/lib/permissions/role-permissions";

/**
 * GET - Get audit logs with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { userId: authUserId, companyId } = await authorize(PermissionAction.AUDIT_READ);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId")
      ? parseInt(searchParams.get("userId")!)
      : undefined;
    const action = searchParams.get("action") as AuditAction | undefined;
    const resource = searchParams.get("resource") as AuditResource | undefined;
    const resourceId = searchParams.get("resourceId")
      ? parseInt(searchParams.get("resourceId")!)
      : undefined;
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined;
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 50;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!)
      : 0;

    const result = await getAuditLogs({
      companyId: companyId,
      userId,
      action,
      resource,
      resourceId,
      startDate,
      endDate,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch audit logs" },
      { status: error.status || 500 }
    );
  }
}

