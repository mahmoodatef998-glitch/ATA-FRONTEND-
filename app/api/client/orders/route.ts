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
  try {
    const clientId = await getClientFromToken(request);

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch orders for this client (newest first)
    const orders = await prisma.orders.findMany({
      where: { clientId },
      include: {
        companies: {
          select: {
            name: true,
          },
        },
        quotations: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            items: true,
            total: true,
            currency: true,
            notes: true,
            file: true,
            fileName: true,
            accepted: true,
            reviewedAt: true,
            rejectedReason: true,
            clientComment: true,
            createdAt: true,
          },
        },
        purchase_orders: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            poNumber: true,
            poFile: true,
            depositRequired: true,
            depositPercent: true,
            depositAmount: true,
            notes: true,
            createdAt: true,
          },
        },
        delivery_notes: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            dnNumber: true,
            dnFile: true,
            items: true,
            deliveredAt: true,
            notes: true,
            createdAt: true,
          },
        },
        order_histories: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            actorName: true,
            action: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" }, // Newest orders first
    });

    return NextResponse.json({
      success: true,
      data: { orders },
    });
  } catch (error) {
    console.error("Error fetching client orders:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred" },
      { status: 500 }
    );
  }
}





