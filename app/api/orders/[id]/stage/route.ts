import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeAny } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { UserRole, OrderStage } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // السماح لمشرف المصنع (FACTORY_SUPERVISOR) والمدير (ADMIN) بتحديث المراحل
    // خاصة مراحل التصنيع
    const { userId, companyId } = await authorizeAny([
      PermissionAction.LEAD_MOVE_STAGE,
      PermissionAction.LEAD_UPDATE, // للمديرين
    ]);

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
      include: {
        clients: true,
        companies: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Company check
    if (order.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Access denied" },
        { status: 403 }
      );
    }

    // Get stage display name
    const stageNames: Record<string, string> = {
      RECEIVED: "Order Received",
      UNDER_REVIEW: "Under Review",
      QUOTATION_PREPARATION: "Quotation Preparation",
      QUOTATION_SENT: "Quotation Sent",
      QUOTATION_ACCEPTED: "Quotation Accepted",
      PO_PREPARED: "PO Prepared",
      AWAITING_DEPOSIT: "Awaiting Deposit",
      DEPOSIT_RECEIVED: "Deposit Received",
      IN_MANUFACTURING: "In Manufacturing",
      MANUFACTURING_COMPLETE: "Manufacturing Complete",
      READY_FOR_DELIVERY: "Ready for Delivery",
      DELIVERY_NOTE_SENT: "Delivery Note Sent",
      AWAITING_FINAL_PAYMENT: "Awaiting Final Payment",
      FINAL_PAYMENT_RECEIVED: "Final Payment Received",
      COMPLETED_DELIVERED: "Completed & Delivered",
    };

    const stageDisplayName = stageNames[stage] || stage;

    // Get current user for notifications
    const currentUser = await prisma.users.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // Update order stage in transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: {
          stage,
          updatedAt: new Date(),
        },
      });

      // Create history entry
      await tx.order_histories.create({
        data: {
          orderId,
          actorId: userId,
          actorName: currentUser?.name || "User",
          action: `stage_changed_to_${stage.toLowerCase()}`,
          payload: {
            previousStage: order.stage,
            newStage: stage,
          },
        },
      });

      // Create notifications for all company admins
      const companyUsers = await tx.users.findMany({
        where: {
          companyId: order.companyId,
          role: UserRole.ADMIN,
        },
      });

      await Promise.all(
        companyUsers.map((user) =>
          tx.notifications.create({
            data: {
              companyId: order.companyId,
              userId: user.id,
              title: `Stage Updated - Order #${orderId}`,
              body: `${currentUser?.name || "User"} updated order stage to: ${stageDisplayName}`,
              meta: {
                orderId,
                previousStage: order.stage,
                newStage: stage,
                action: "stage_updated",
              },
              read: user.id === userId,
            },
          })
        )
      );

      return updatedOrder;
    });

    // Emit Socket.io event for real-time notification
    if (global.io) {
      global.io.to(`company_${order.companyId}`).emit("new_notification", {
        orderId,
        title: `Stage Updated`,
        body: `Order #${orderId} stage changed to ${stageDisplayName}`,
        type: "stage_updated",
      });
      console.log(`🔌 Emitted stage_updated notification to company_${order.companyId}`);
    }

    // Send email notification to client if stage requires action
    const actionRequiredStages = [
      "QUOTATION_SENT",
      "DELIVERY_NOTE_SENT",
      "AWAITING_DEPOSIT",
      "AWAITING_FINAL_PAYMENT",
    ];

    if (actionRequiredStages.includes(stage) && order.clients?.email) {
      const company = await prisma.companies.findUnique({
        where: { id: order.companyId },
      });

      // You can add email templates for stage updates here
      // For now, we'll just log it
      console.log(`📧 Stage update email should be sent to ${order.clients.email} for Order #${orderId}`);
    }

    return NextResponse.json({
      success: true,
      data: result,
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













