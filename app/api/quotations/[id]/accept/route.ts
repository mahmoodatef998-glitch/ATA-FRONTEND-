import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { sendEmail, getQuotationResponseEmail } from "@/lib/email";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quotationId = parseInt(id);

    if (isNaN(quotationId)) {
      return NextResponse.json(
        { success: false, error: "Invalid quotation ID" },
        { status: 400 }
      );
    }

    // Parse body for optional rejection reason and comments
    const body = await request.json().catch(() => ({}));
    const { accepted, rejectionReason, clientComment } = body;

    // Check if quotation exists
    const quotation = await prisma.quotations.findUnique({
      where: { id: quotationId },
      include: {
        orders: {
          include: { 
            clients: true,
            companies: {
              select: { name: true }
            }
          },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: "Quotation not found" },
        { status: 404 }
      );
    }

    // Accept/Reject quotation and update order status in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update quotation
      const updatedQuotation = await tx.quotations.update({
        where: { id: quotationId },
        data: {
          accepted: accepted !== false, // true if accepted, false if explicitly rejected
          rejectedReason: accepted === false ? rejectionReason : null,
          clientComment: clientComment || null,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Update order status and stage
      const newStatus = accepted !== false ? OrderStatus.APPROVED : OrderStatus.QUOTATION_SENT;
      const newStage = accepted !== false ? "QUOTATION_ACCEPTED" : "QUOTATION_SENT";
      const updatedOrder = await tx.orders.update({
        where: { id: quotation.orderId },
        data: { 
          status: newStatus,
          stage: newStage,
          updatedAt: new Date(),
        },
      });

      // Create history entry
      await tx.order_histories.create({
        data: {
          orderId: quotation.orderId,
          actorName: quotation.orders.clients?.name || "Client",
          action: accepted !== false ? "quotation_accepted_by_client" : "quotation_rejected_by_client",
          payload: {
            quotationId,
            total: quotation.total,
            rejectionReason: accepted === false ? rejectionReason : null,
          },
        },
      });

      // Create notifications for admins
      const companyUsers = await tx.users.findMany({
        where: {
          companyId: quotation.orders.companyId,
          role: "ADMIN",
        },
      });

      await Promise.all(
        companyUsers.map((user) =>
          tx.notifications.create({
            data: {
              companyId: quotation.orders.companyId,
              userId: user.id,
              title: accepted !== false
                ? `Quotation Accepted - Order #${quotation.orderId}`
                : `Quotation Rejected - Order #${quotation.orderId}`,
              body: accepted !== false
                ? `Client accepted quotation worth ${quotation.total} ${quotation.currency}${clientComment ? `. Note: ${clientComment}` : ""}`
                : `Client rejected quotation. Reason: ${rejectionReason || "Not specified"}${clientComment ? `. Note: ${clientComment}` : ""}`,
              meta: {
                orderId: quotation.orderId,
                quotationId,
                accepted: accepted !== false,
              },
              read: false,
            },
          })
        )
      );

      return { quotation: updatedQuotation, order: updatedOrder };
    });

    // Send email notification to company admins
    const companyAdmins = await prisma.users.findMany({
      where: {
        companyId: quotation.orders.companyId,
        role: "ADMIN",
      },
      select: { email: true, name: true },
    });

    const orderUrl = `${process.env.NEXTAUTH_URL}/dashboard/orders/${quotation.orderId}`;

    // Send email to each admin
    companyAdmins.forEach((admin) => {
      if (admin.email) {
        sendEmail({
          to: admin.email,
          ...getQuotationResponseEmail({
            adminName: admin.name,
            clientName: quotation.orders.clients?.name || "Client",
            orderNumber: quotation.orderId,
            accepted: accepted !== false,
            comment: clientComment || undefined,
            rejectionReason: accepted === false ? rejectionReason : undefined,
            orderUrl,
            companyName: quotation.orders.companies?.name || "ATA CRM",
          }),
        }).catch((error) => {
          console.error(`Failed to send response email to ${admin.email}:`, error);
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: accepted !== false ? "Quotation accepted successfully" : "Quotation rejected",
    });
  } catch (error) {
    console.error("Error updating quotation:", error);

    return NextResponse.json(
      { success: false, error: "An error occurred while updating quotation" },
      { status: 500 }
    );
  }
}
