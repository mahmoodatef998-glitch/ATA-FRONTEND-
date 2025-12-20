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

export async function GET(request: NextRequest) {
  // Build-time probe safe response
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    // Get client from token
    const clientId = await getClientFromToken(request);
    
    if (!clientId) {
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

    // Get client's companyId from their orders
    const client = await prisma.clients.findUnique({
      where: { id: clientId },
      include: {
        orders: {
          take: 1,
          select: {
            companyId: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }

    // Get companyId from first order (or use a default if no orders)
    const companyId = client.orders[0]?.companyId;
    
    if (!companyId) {
      return NextResponse.json({
        success: true,
        data: {
          notifications: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        },
      });
    }

    // Build where clause - Get notifications for this client
    // We'll use meta field to store clientId for now (since schema doesn't have clientId yet)
    // Or we can filter by order's clientId
    const where: any = {
      companyId: companyId,
      // Filter notifications that are related to this client's orders
      // We'll check meta.orderId and match it with client's orders
    };

    if (unreadOnly) {
      where.read = false;
    }

    // Get all notifications for the company, then filter by client's orders
    const allNotifications = await prisma.notifications.findMany({
      where: {
        companyId: companyId,
        ...(unreadOnly && { read: false }),
      },
      orderBy: { createdAt: "desc" },
    });

    // Get client's order IDs
    const clientOrderIds = await prisma.orders.findMany({
      where: { clientId: clientId },
      select: { id: true },
    });
    const orderIds = clientOrderIds.map(o => o.id);

    // Filter notifications that are related to this client's orders
    const clientNotifications = allNotifications.filter((notif: any) => {
      const meta = notif.meta as any;
      if (meta?.orderId && orderIds.includes(meta.orderId)) {
        return true;
      }
      // Also include notifications where meta has clientId matching this client
      if (meta?.clientId === clientId) {
        return true;
      }
      return false;
    });

    // Apply pagination
    const total = clientNotifications.length;
    const paginatedNotifications = clientNotifications.slice(skip, skip + limit);

    console.log("🔔 [Client Notifications API] Found notifications:", {
      count: paginatedNotifications.length,
      total,
      clientId,
      companyId,
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications: paginatedNotifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching client notifications:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while fetching notifications" },
      { status: 500 }
    );
  }
}

