import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { updateOrderStatusSchema } from "@/lib/validators/order";
import { UserRole } from "@prisma/client";
import { sendEmail, getOrderStatusUpdateEmail } from "@/lib/email";

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

    // Parse and validate request body
    const body = await request.json();
    const validation = updateOrderStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { status, note } = validation.data;

    // Check if order exists and user has access
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: { clients: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Authorization: Check company access
    if (order.companyId !== session.user.companyId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Access denied" },
        { status: 403 }
      );
    }

    // Update order and create history entry in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Map status to stage
      let stage = order.stage;
      if (status === "PENDING") stage = "RECEIVED";
      else if (status === "APPROVED") stage = "QUOTATION_ACCEPTED";
      else if (status === "QUOTATION_SENT") stage = "QUOTATION_SENT";
      else if (status === "COMPLETED") stage = "COMPLETED_DELIVERED";
      else if (status === "REJECTED" || status === "CANCELLED") stage = order.stage;

      // Update order status and stage
      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: { 
          status,
          stage,
          updatedAt: new Date(),
        },
      });

      // Create history entry
      await tx.order_histories.create({
        data: {
          orderId,
          actorId: typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id,
          actorName: session.user.name,
          action: `status_changed_to_${status.toLowerCase()}`,
          payload: {
            previousStatus: order.status,
            newStatus: status,
            note: note || null,
          },
        },
      });

      // Create notification for other admins
      const companyUsers = await tx.users.findMany({
        where: {
          companyId: order.companyId,
          role: UserRole.ADMIN,
          id: { not: typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id },
        },
      });

      await Promise.all(
        companyUsers.map((user) =>
          tx.notifications.create({
            data: {
              companyId: order.companyId,
              userId: user.id,
              title: `Order #${orderId} status updated`,
              body: `${session.user.name} changed status to ${status}`,
              meta: {
                orderId,
                status,
                actorId: session.user.id,
              },
              read: false,
            },
          })
        )
      );

      return updatedOrder;
    });

    // TODO: Emit Socket.io event for real-time updates
    // socketIo.to(`company_${order.companyId}`).emit("order_updated", { orderId });

    // Send email notification to client
    if (order.clients?.email) {
      const trackingUrl = `${process.env.NEXTAUTH_URL}/order/track/${order.publicToken}`;
      const company = await prisma.companies.findUnique({
        where: { id: order.companyId },
        select: { name: true },
      });

      sendEmail({
        to: order.clients.email,
        ...getOrderStatusUpdateEmail({
          clientName: order.clients.name,
          orderNumber: orderId,
          oldStatus: order.status,
          newStatus: status,
          trackingUrl,
          companyName: company?.name || "ATA CRM",
        }),
      }).catch((error) => {
        console.error("Failed to send status update email:", error);
        // Don't fail the request if email fails
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    
    if ((error as Error).message === "Unauthorized: Insufficient permissions") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    // Better error message in development
    const errorMessage = error instanceof Error ? error.message : "An error occurred while updating order status";
    console.error("Full error details:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? {
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined
        } : undefined
      },
      { status: 500 }
    );
  }
}

