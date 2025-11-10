import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions, or external cron service)
// Recommended: Run once per day at 9:00 AM

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended for security)
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // 1. Reminder: Deposit Payment Overdue (> 3 days)
    const overdueDeposits = await prisma.orders.findMany({
      where: {
        stage: "AWAITING_DEPOSIT",
        depositPaid: false,
        createdAt: {
          lt: threeDaysFromNow,
        },
      },
      include: {
        clients: true,
        companies: true,
        purchase_orders: {
          where: { depositRequired: true },
          take: 1,
        },
      },
    });

    // 2. Reminder: Final Payment Overdue
    const overdueFinalPayments = await prisma.orders.findMany({
      where: {
        stage: "AWAITING_FINAL_PAYMENT",
        finalPaymentReceived: false,
        delivery_notes: {
          some: {
            deliveredAt: {
              lt: threeDaysFromNow,
            },
          },
        },
      },
      include: {
        clients: true,
        companies: true,
      },
    });

    // 3. Reminder: Orders stuck in manufacturing for > 7 days
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const stuckOrders = await prisma.orders.findMany({
      where: {
        stage: "IN_MANUFACTURING",
        updatedAt: {
          lt: sevenDaysAgo,
        },
      },
      include: {
        clients: true,
        companies: true,
      },
    });

    // Send reminders
    const reminders = [];

    // Deposit reminders
    for (const order of overdueDeposits) {
      if (order.clients?.email) {
        const po = order.purchase_orders[0];
        const daysOverdue = Math.floor((now.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24));

        sendEmail({
          to: order.clients.email,
          subject: `Reminder: Deposit Payment Required - Order #${order.id}`,
          html: `
            <h2>Payment Reminder</h2>
            <p>Dear ${order.clients.name},</p>
            <p>This is a friendly reminder that your deposit payment for Order #${order.id} is pending.</p>
            ${po ? `<p><strong>Deposit Amount:</strong> ${po.depositPercent}% = AED ${po.depositAmount}</p>` : ''}
            <p><strong>Days since order:</strong> ${daysOverdue} days</p>
            <p>Please complete the payment to proceed with manufacturing.</p>
            <p>If you have already made the payment, please contact us.</p>
            <p>Thank you!</p>
            <p>${order.companies.name}</p>
          `,
        }).catch((err) => console.error("Email error:", err));

        reminders.push({ type: "deposit", orderId: order.id, email: order.clients.email });
      }
    }

    // Final payment reminders
    for (const order of overdueFinalPayments) {
      if (order.clients?.email) {
        sendEmail({
          to: order.clients.email,
          subject: `Reminder: Final Payment Required - Order #${order.id}`,
          html: `
            <h2>Final Payment Reminder</h2>
            <p>Dear ${order.clients.name},</p>
            <p>Your order #${order.id} has been delivered successfully.</p>
            <p>This is a reminder that the final payment is now due.</p>
            ${order.totalAmount ? `<p><strong>Total Amount:</strong> AED ${order.totalAmount}</p>` : ''}
            <p>Please complete the payment at your earliest convenience.</p>
            <p>Thank you for your business!</p>
            <p>${order.companies.name}</p>
          `,
        }).catch((err) => console.error("Email error:", err));

        reminders.push({ type: "final_payment", orderId: order.id, email: order.clients.email });
      }
    }

    // Notify admins about stuck orders
    for (const order of stuckOrders) {
      const companyAdmins = await prisma.users.findMany({
        where: {
          companyId: order.companyId,
          role: "ADMIN",
        },
      });

      for (const admin of companyAdmins) {
        await prisma.notifications.create({
          data: {
            companyId: order.companyId,
            userId: admin.id,
            title: `Order #${order.id} stuck in manufacturing`,
            body: `Order has been in manufacturing for over 7 days. Please check status.`,
            meta: {
              orderId: order.id,
              stage: order.stage,
              daysStuck: Math.floor((now.getTime() - order.updatedAt.getTime()) / (1000 * 60 * 60 * 24)),
            },
            read: false,
          },
        });
      }

      reminders.push({ type: "stuck_order", orderId: order.id, recipientCount: companyAdmins.length });
    }

    return NextResponse.json({
      success: true,
      message: "Reminders sent successfully",
      data: {
        depositReminders: overdueDeposits.length,
        finalPaymentReminders: overdueFinalPayments.length,
        stuckOrderAlerts: stuckOrders.length,
        totalReminders: reminders.length,
        reminders,
      },
    });
  } catch (error) {
    console.error("Error sending reminders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send reminders" },
      { status: 500 }
    );
  }
}



