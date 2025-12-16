import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getDubaiDaysAgo, formatDubaiDate } from "@/lib/cron-timezone-utils";

/**
 * Payment Reminders Cron Job
 * Runs daily at 9:00 AM Dubai time
 * Sends reminders for overdue deposit payments
 * 
 * Setup:
 * - Vercel: Add to vercel.json crons
 * - VPS: Add to crontab
 * - Security: Requires CRON_SECRET
 */
export async function GET(request: Request) {
  try {
    // Security check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔔 Payment Reminders Cron Job started...');
    console.log(`📅 Dubai Date: ${formatDubaiDate(new Date())}`);

    // Calculate date threshold (3 days ago in Dubai timezone)
    const threeDaysAgo = getDubaiDaysAgo(3);

    // Find orders with overdue deposits
    const overdueOrders = await prisma.orders.findMany({
      where: {
        stage: 'AWAITING_DEPOSIT',
        depositPaid: false,
        quotations: {
          some: {
            depositRequired: true,
          }
        },
        updatedAt: {
          lte: threeDaysAgo
        }
      },
      include: {
        clients: true,
        purchase_orders: true,
        quotations: true,
        companies: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📊 Found ${overdueOrders.length} overdue deposits`);

    let reminded = 0;
    const results = [];

    // Send reminders
    for (const order of overdueOrders) {
      const po = order.purchase_orders[0];
      
      if (!order.clients?.email) {
        console.log(`⚠️ Order #${order.id}: No email available`);
        continue;
      }

      try {
        // Calculate days overdue
        const daysOverdue = Math.floor(
          (Date.now() - new Date(order.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Send email reminder
        await sendEmail({
          to: order.clients.email,
          subject: `Payment Reminder - Order #${order.id} - ${order.companies.name}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
                .highlight { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
                .amount { font-size: 24px; font-weight: bold; color: #dc2626; }
                .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
                .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
                .info-row { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">💰 Payment Reminder</h1>
                  <p style="margin: 10px 0 0 0; opacity: 0.9;">Deposit Payment Due</p>
                </div>
                
                <div class="content">
                  <p>Dear <strong>${order.clients.name}</strong>,</p>
                  
                  <p>This is a friendly reminder regarding the deposit payment for your order.</p>
                  
                  <div class="highlight">
                    <p style="margin: 0; font-weight: bold;">⚠️ Action Required</p>
                    <p style="margin: 5px 0 0 0;">The deposit payment for Order #${order.id} is pending for <strong>${daysOverdue} days</strong>.</p>
                  </div>
                  
                  <div class="info-row">
                    <strong>Order Details:</strong><br>
                    Order Number: #${order.id}<br>
                    Purchase Order: ${po.poNumber}<br>
                    Created: ${new Date(order.createdAt).toLocaleDateString('en-GB')}
                  </div>
                  
                  <div class="info-row">
                    <strong>Payment Required:</strong><br>
                    Deposit Percentage: ${po.depositPercent}%<br>
                    Deposit Amount: <span class="amount">${po.depositAmount?.toLocaleString()} AED</span>
                  </div>
                  
                  ${po.notes ? `
                    <div class="info-row">
                      <strong>Notes:</strong><br>
                      ${po.notes}
                    </div>
                  ` : ''}
                  
                  <p>Please arrange the deposit payment to proceed with your order. Once payment is received, we will immediately start the manufacturing/procurement process.</p>
                  
                  <center>
                    <a href="${process.env.NEXTAUTH_URL}/client/portal" class="button">
                      View Order Details →
                    </a>
                  </center>
                  
                  <p style="margin-top: 30px;">If you have any questions or need assistance, please don't hesitate to contact us.</p>
                  
                  <p>Best regards,<br>
                  <strong>${order.companies.name}</strong></p>
                </div>
                
                <div class="footer">
                  <p style="margin: 0 0 10px 0;"><strong>${order.companies.name}</strong></p>
                  <p style="margin: 0;">Professional Power Solutions Provider</p>
                  <p style="margin: 10px 0 0 0;">This is an automated reminder. Please do not reply to this email.</p>
                </div>
              </div>
            </body>
            </html>
          `
        });

        reminded++;
        results.push({
          orderId: order.id,
          client: order.clients.name,
          email: order.clients.email,
          amount: po.depositAmount,
          daysOverdue: daysOverdue,
          status: 'sent'
        });

        console.log(`✅ Reminder sent: Order #${order.id} to ${order.clients.email}`);

        // Small delay to avoid overwhelming email server
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Failed to send reminder for Order #${order.id}:`, error);
        results.push({
          orderId: order.id,
          client: order.clients.name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`✅ Payment Reminders completed: ${reminded} sent`);

    return NextResponse.json({
      success: true,
      message: `Sent ${reminded} payment reminders`,
      data: {
        reminded: reminded,
        total: overdueOrders.length,
        results: results
      }
    });

  } catch (error) {
    console.error('💥 Payment Reminders Cron Job failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send reminders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

