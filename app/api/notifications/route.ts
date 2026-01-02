import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helpers";
import { Prisma } from "@prisma/client";
import { handleApiError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  // Build-time probe safe response
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    // Require authentication
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Convert userId to integer if it's a string
    const userId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
    const companyId = typeof session.user.companyId === "string" ? parseInt(session.user.companyId) : session.user.companyId;

    logger.debug("Fetching notifications", {
      userId,
      companyId,
      unreadOnly,
      page,
      limit,
      context: "notifications"
    });

    // Build where clause - Get notifications for this user OR company-level notifications
    const where: Prisma.notificationsWhereInput = {
      companyId: companyId,
      OR: [
        { userId: userId },
        { userId: null }, // Company-level notifications (for all users in company)
      ],
    };

    if (unreadOnly) {
      where.read = false;
    }

    // ✅ Performance: Use select to fetch only needed fields
    const [notifications, total] = await Promise.all([
      prisma.notifications.findMany({
        where,
        select: {
          id: true,
          title: true,
          body: true,
          read: true,
          createdAt: true,
          // Don't fetch userId, companyId, meta, etc. - not needed for display
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notifications.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

