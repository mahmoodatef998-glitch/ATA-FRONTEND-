import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole, PaymentType } from "@prisma/client";
import { sendEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole([UserRole.ADMIN]);
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { success: false, error: "Invalid order ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { paymentType, amount, paymentMethod, reference, notes } = body;

    if (!paymentType || !amount) {
      return NextResponse.json(
        { success: false, error: "Payment type and amount required" },
        { status: 400 }
      );
    }

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

    const result = await prisma.$transaction(async (tx) => {
      // Record payment
      const payment = await tx.payments.create({
        data: {
          orderId,
          paymentType,
          amount: parseFloat(amount),
          currency: order.currency,
          paymentMethod: paymentMethod || null,
          reference: reference || null,
          notes: notes || null,
          createdById: session.user.id,
        },
      });

      // Update order based on payment type
      let updateData: any = {
        updatedAt: new Date(),
      };

      if (paymentType === "DEPOSIT") {
        updateData.depositPaid = true;
        updateData.depositPaidAt = new Date();
        updateData.stage = "DEPOSIT_RECEIVED";
      } else if (paymentType === "FINAL") {
        updateData.finalPaymentReceived = true;
        updateData.finalPaymentAt = new Date();
        updateData.stage = "FINAL_PAYMENT_RECEIVED";
        updateData.status = "COMPLETED";
      } else if (paymentType === "FULL") {
        updateData.depositPaid = true;
        updateData.finalPaymentReceived = true;
        updateData.depositPaidAt = new Date();
        updateData.finalPaymentAt = new Date();
        updateData.stage = "FINAL_PAYMENT_RECEIVED";
        updateData.status = "COMPLETED";
      }

      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: updateData,
      });

      // History
      await tx.order_histories.create({
        data: {
          orderId,
          actorId: session.user.id,
          actorName: session.user.name,
          action: `payment_received_${paymentType.toLowerCase()}`,
          payload: {
            paymentType,
            amount: parseFloat(amount),
            currency: order.currency,
            reference,
          },
        },
      });

      // Create notifications for other admins
      const companyUsers = await tx.users.findMany({
        where: {
          companyId: order.companyId,
          role: UserRole.ADMIN,
          id: { not: session.user.id },
        },
      });

      await Promise.all(
        companyUsers.map((user) =>
          tx.notifications.create({
            data: {
              companyId: order.companyId,
              userId: user.id,
              title: `Payment Received - Order #${orderId}`,
              body: `${session.user.name} recorded ${paymentType} payment of ${parseFloat(amount).toLocaleString()} ${order.currency}`,
              meta: {
                orderId,
                paymentType,
                amount: parseFloat(amount),
              },
              read: false,
            },
          })
        )
      );

      return { payment, order: updatedOrder };
    });

    // Send confirmation email
    if (order.clients?.email) {
      const emailContent = `
        <h2>Payment Received - Thank You!</h2>
        <p>Dear ${order.clients.name},</p>
        <p>We have received your payment for Order #${orderId}.</p>
        <p><strong>Payment Details:</strong></p>
        <ul>
          <li>Type: ${paymentType}</li>
          <li>Amount: ${parseFloat(amount).toLocaleString()} ${order.currency}</li>
          ${reference ? `<li>Reference: ${reference}</li>` : ''}
        </ul>
        ${paymentType === "DEPOSIT" ? '<p>Manufacturing will begin shortly!</p>' : ''}
        ${paymentType === "FINAL" ? '<p>Your order is now complete. Thank you for your business!</p>' : ''}
      `;

      sendEmail({
        to: order.clients.email,
        subject: `Payment Received - Order #${orderId}`,
        html: emailContent,
      }).catch((err) => console.error("Email error:", err));
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "Payment recorded successfully",
    });
  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record payment" },
      { status: 500 }
    );
  }
}




