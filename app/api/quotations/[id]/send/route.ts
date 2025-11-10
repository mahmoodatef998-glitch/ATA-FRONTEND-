import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { OrderStatus, UserRole } from "@prisma/client";
import { sendEmail, getQuotationSentEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require ADMIN role
    const session = await requireRole([UserRole.ADMIN]);

    const { id } = await params;
    const quotationId = parseInt(id);

    if (isNaN(quotationId)) {
      return NextResponse.json(
        { success: false, error: "Invalid quotation ID" },
        { status: 400 }
      );
    }

    // Check if quotation exists
    const quotation = await prisma.quotations.findUnique({
      where: { id: quotationId },
      include: {
        orders: {
          include: {
            clients: true,
            companies: true,
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

    // Check if file is uploaded
    if (!quotation.file) {
      return NextResponse.json(
        { success: false, error: "Please upload quotation file first" },
        { status: 400 }
      );
    }

    // Authorization check
    if (quotation.orders.companyId !== session.user.companyId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Access denied" },
        { status: 403 }
      );
    }

    // Update order status to QUOTATION_SENT and create history + notification
    const result = await prisma.$transaction(async (tx) => {
      // Update order status and stage
      const updatedOrder = await tx.orders.update({
        where: { id: quotation.orderId },
        data: {
          status: OrderStatus.QUOTATION_SENT,
          stage: "QUOTATION_SENT",
          updatedAt: new Date(),
        },
      });

      // Create history entry
      await tx.order_histories.create({
        data: {
          orderId: quotation.orderId,
          actorId: typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id,
          actorName: session.user.name,
          action: "quotation_sent_to_client",
          payload: {
            quotationId,
            total: quotation.total,
            currency: quotation.currency,
          },
        },
      });

      // Create notification for other admins
      const companyUsers = await tx.users.findMany({
        where: {
          companyId: quotation.orders.companyId,
          role: UserRole.ADMIN,
          id: { not: typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id },
        },
      });

      await Promise.all(
        companyUsers.map((user) =>
          tx.notifications.create({
            data: {
              companyId: quotation.orders.companyId,
              userId: user.id,
              title: `Quotation Sent - Order #${quotation.orderId}`,
              body: `${session.user.name} sent quotation worth ${quotation.total} ${quotation.currency} to ${quotation.orders.clients?.name}`,
              meta: {
                orderId: quotation.orderId,
                quotationId,
                action: "quotation_sent",
              },
              read: false,
            },
          })
        )
      );

      return { quotation, order: updatedOrder };
    });

    // Send email notification to client
    const clientEmail = quotation.orders.clients?.email;
    if (clientEmail && quotation.orders.clients) {
      const reviewUrl = quotation.orders.clients.hasAccount
        ? `${process.env.NEXTAUTH_URL}/client/quotation/${quotationId}/review`
        : `${process.env.NEXTAUTH_URL}/order/track/${quotation.orders.publicToken}`;

      sendEmail({
        to: clientEmail,
        ...getQuotationSentEmail({
          clientName: quotation.orders.clients.name,
          orderNumber: quotation.orderId,
          quotationAmount: quotation.total,
          currency: quotation.currency,
          reviewUrl,
          companyName: quotation.orders.companies.name,
        }),
      }).catch((error) => {
        console.error("Failed to send quotation email:", error);
        // Don't fail the request if email fails
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "Quotation sent to client successfully. Client will be notified.",
    });
  } catch (error) {
    console.error("Error sending quotation:", error);

    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    
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

