import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Cancel Order - Client Only (Early Stage)
 * يسمح للعميل بإلغاء الطلب فقط في المراحل الأولى
 * Allowed stages: RECEIVED, UNDER_REVIEW, QUOTATION_PREPARATION
 * Not allowed after quotation is sent
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    // Check authentication (client must be logged in)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get order with client info
    const order = await prisma.orders.findUnique({
      where: { id: parseInt(id) },
      include: {
        clients: true,
        quotations: true,
        purchase_orders: true,
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Verify ownership (client can only cancel their own orders)
    if (order.clientId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized - This is not your order" },
        { status: 403 }
      );
    }

    // Check if order is already cancelled
    if (order.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Order is already cancelled" },
        { status: 400 }
      );
    }

    // Check stage - only allow cancellation in early stages
    const allowedStages = ["RECEIVED", "UNDER_REVIEW", "QUOTATION_PREPARATION"];
    if (!allowedStages.includes(order.stage)) {
      return NextResponse.json(
        {
          error: "Cannot cancel order at this stage",
          message: "Order cancellation is only allowed in the initial stages before quotation is sent",
          currentStage: order.stage,
        },
        { status: 400 }
      );
    }

    // Check if quotation was sent (additional safety)
    const hasQuotationSent = order.quotations.some(q => q.file !== null);
    if (hasQuotationSent) {
      return NextResponse.json(
        {
          error: "Cannot cancel order",
          message: "A quotation has already been sent. Please contact us to cancel.",
        },
        { status: 400 }
      );
    }

    // Check if PO was created
    if (order.purchase_orders.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot cancel order",
          message: "A purchase order has been created. Please contact us to cancel.",
        },
        { status: 400 }
      );
    }

    // Cancel the order
    const cancelledOrder = await prisma.orders.update({
      where: { id: parseInt(id) },
      data: {
        status: "CANCELLED",
        // Keep the current stage, status is enough to mark as cancelled
      }
    });

    // Create history record
    await prisma.order_histories.create({
      data: {
        orderId: order.id,
        actorId: session.user.id,
        actorName: order.clients?.name || "Client",
        action: "ORDER_CANCELLED_BY_CLIENT",
        payload: {
          reason: "Cancelled by client in early stage",
          previousStage: order.stage,
          previousStatus: order.status,
        }
      }
    });

    // Create notification for admin
    if (order.companyId) {
      await prisma.notifications.create({
        data: {
          companyId: order.companyId,
          title: `Order #${order.id} Cancelled`,
          body: `${order.clients?.name} cancelled their order`,
          meta: {
            orderId: order.id,
            clientName: order.clients?.name,
            type: "order_update",
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
      data: {
        orderId: cancelledOrder.id,
        status: cancelledOrder.status,
        stage: cancelledOrder.stage,
      }
    });

  } catch (error) {
    console.error("Cancel order error:", error);
    return NextResponse.json(
      {
        error: "Failed to cancel order",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

