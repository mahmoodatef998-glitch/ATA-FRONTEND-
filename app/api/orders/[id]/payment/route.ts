import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { UserRole, PaymentType } from "@prisma/client";
import { sendEmail } from "@/lib/email";
import { sendPaymentReceivedEmail } from "@/lib/email-templates";

/**
 * GET - عرض جميع الدفعات لطلب معين
 * متاح فقط للمحاسبين والمديرين (Admin + Accountant)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Build-time probe safe response
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  try {
    // التحقق من صلاحية عرض الدفعات - فقط Admin و Accountant يمكنهم الوصول
    // استخدام PAYMENT_RECORD لأن Operations Manager لا يملكه
    const { userId, companyId } = await authorize(PermissionAction.PAYMENT_RECORD);
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { success: false, error: "Invalid order ID" },
        { status: 400 }
      );
    }

    // التحقق من وجود الطلب وأنه ينتمي لنفس الشركة
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      select: { id: true, companyId: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.companyId !== companyId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Access denied" },
        { status: 403 }
      );
    }

    // جلب جميع الدفعات للطلب
    const payments = await prisma.payments.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
      include: {
        orders: {
          select: {
            id: true,
            publicToken: true,
            totalAmount: true,
            currency: true,
            clients: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: { payments },
    });
  } catch (error: any) {
    console.error("Error fetching payments:", error);
    
    // إذا كان الخطأ متعلق بالصلاحيات
    if (error.message?.includes("Unauthorized") || error.message?.includes("Missing permission")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Insufficient permissions" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // السماح للمحاسب (ACCOUNTANT) والمدير (ADMIN) بتسجيل الدفعات
    const { userId, companyId } = await authorize(PermissionAction.PAYMENT_RECORD);
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
      select: {
        id: true,
        companyId: true,
        clientId: true,
        totalAmount: true,
        currency: true,
        depositPaid: true,
        depositAmount: true,
        finalPaymentReceived: true,
        status: true,
        stage: true,
        clients: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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

    const result = await prisma.$transaction(async (tx) => {
      // Get current user name
      const currentUser = await tx.users.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      const userName = currentUser?.name || "User";

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
          createdById: userId,
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
          actorId: userId,
          actorName: userName,
          action: `payment_received_${paymentType.toLowerCase()}`,
          payload: {
            paymentType,
            amount: parseFloat(amount),
            currency: order.currency,
            reference,
          },
        },
      });

      // Create notifications for all admins
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
              title: `💰 Payment Recorded - Order #${orderId}`,
              body: `${userName} recorded ${paymentType} payment of ${parseFloat(amount).toLocaleString()} ${order.currency}${reference ? ` (Ref: ${reference})` : ''}.`,
              meta: {
                orderId,
                paymentType,
                amount: parseFloat(amount),
                currency: order.currency,
                reference,
                actionRequired: false, // Just informational
              },
              read: user.id === userId, // Mark as read for creator
            },
          })
        )
      );

      // Create notification for client
      if (order.clientId) {
        await tx.notifications.create({
          data: {
            companyId: order.companyId,
            userId: null, // Client notifications don't have userId
            title: `💰 Payment Received - Order #${orderId}`,
            body: `Your ${paymentType} payment of ${parseFloat(amount).toLocaleString()} ${order.currency} has been received and recorded.${reference ? ` Reference: ${reference}` : ''}`,
            meta: {
              orderId,
              paymentType,
              amount: parseFloat(amount),
              currency: order.currency,
              clientId: order.clientId,
              action: "payment_received",
            },
            read: false,
          },
        });
      }

      return { payment, order: updatedOrder };
    });

    // Emit Socket.io event for real-time updates
    if (global.io) {
      global.io.to(`company_${order.companyId}`).emit("new_notification", {
        orderId,
        title: `Payment Received`,
        body: `${paymentType} payment of ${order.currency} ${amount} received for Order #${orderId}`,
        type: "payment_received",
      });
      console.log(`🔌 Emitted notification to company_${order.companyId}`);
    }

    // Send professional confirmation email to client
    if (order.clients?.email) {
      const company = await prisma.companies.findUnique({
        where: { id: order.companyId }
      });
      
      sendPaymentReceivedEmail({
        clientName: order.clients.name,
        clientEmail: order.clients.email,
        orderId: order.id,
        paymentType: paymentType as "DEPOSIT" | "FINAL" | "PARTIAL",
        amount: parseFloat(amount),
        paymentDate: new Date(),
        currency: order.currency,
        companyName: company?.name || "ATA CRM",
      }).catch((err) => console.error("Payment email error:", err));
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




