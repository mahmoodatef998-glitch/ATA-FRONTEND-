import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

async function getClientFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get("client-token")?.value;
    
    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "secret");
    const { payload } = await jwtVerify(token, secret);

    if (payload.type !== "client" || !payload.clientId) {
      return null;
    }

    return payload.clientId as number;
  } catch (error) {
    return null;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clientId = await getClientFromToken(request);
    
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const notificationId = parseInt(id);

    if (isNaN(notificationId)) {
      return NextResponse.json(
        { success: false, error: "Invalid notification ID" },
        { status: 400 }
      );
    }

    // Get notification and verify it belongs to this client
    const notification = await prisma.notifications.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    // Verify this notification is for this client's orders
    const clientOrderIds = await prisma.orders.findMany({
      where: { clientId: clientId },
      select: { id: true },
    });
    const orderIds = clientOrderIds.map(o => o.id);
    const meta = notification.meta as any;

    if (meta?.orderId && !orderIds.includes(meta.orderId)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Access denied" },
        { status: 403 }
      );
    }

    // Mark as read
    const updated = await prisma.notifications.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { success: false, error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}

