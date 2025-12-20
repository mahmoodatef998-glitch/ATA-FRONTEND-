import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
    const session = await auth();
    if (!session || !session.user) {
      // Return 0 count instead of error for better UX
      return NextResponse.json({
        success: true,
        data: { count: 0 },
      });
    }

    // Convert userId to integer if it's a string
    const userId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;

    // Count unread notifications for user
    const count = await prisma.notifications.count({
      where: {
        companyId: session.user.companyId,
        OR: [
          { userId: userId },
          { userId: null }, // Company-level notifications
        ],
        read: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error("Error counting unread notifications:", error);
    // Return 0 instead of error for better UX
    return NextResponse.json({
      success: true,
      data: { count: 0 },
    });
  }
}

