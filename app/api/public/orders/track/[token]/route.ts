import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token required" },
        { status: 400 }
      );
    }

    // Find order by public token with all related data
    const order = await prisma.orders.findUnique({
      where: { publicToken: token },
      include: {
        clients: {
          select: {
            name: true,
            phone: true,
            email: true,
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
            accepted: true,
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
        companies: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Return sanitized order data (safe for public viewing)
    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        status: order.status,
        stage: order.stage,
        details: order.details,
        items: order.items,
        totalAmount: order.totalAmount,
        currency: order.currency,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        client: {
          name: order.clients?.name,
          phone: order.clients?.phone,
        },
        company: {
          name: order.companies.name,
        },
        quotations: order.quotations,
        purchase_orders: order.purchase_orders,
        delivery_notes: order.delivery_notes,
        history: order.order_histories,
      },
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while fetching the order" },
      { status: 500 }
    );
  }
}

