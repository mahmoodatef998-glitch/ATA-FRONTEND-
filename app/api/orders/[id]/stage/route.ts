import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole, OrderStage } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require ADMIN role
    const session = await requireRole([UserRole.ADMIN]);

    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { success: false, error: "Invalid order ID" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { stage } = body;

    if (!stage || !Object.values(OrderStage).includes(stage)) {
      return NextResponse.json(
        { success: false, error: "Invalid stage" },
        { status: 400 }
      );
    }

    // Check if order exists
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Update order stage
    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: {
        stage,
        updatedAt: new Date(),
      },
    });

    // Create history entry
    await prisma.order_histories.create({
      data: {
        orderId,
        actorId: session.user.id,
        actorName: session.user.name,
        action: `stage_changed_to_${stage.toLowerCase()}`,
        payload: {
          previousStage: order.stage,
          newStage: stage,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: "Order stage updated successfully",
    });
  } catch (error) {
    console.error("Error updating order stage:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order stage" },
      { status: 500 }
    );
  }
}






