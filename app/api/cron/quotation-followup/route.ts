import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getDubaiDaysAgo, formatDubaiDate } from "@/lib/cron-timezone-utils";

/**
 * Quotation Follow-up Cron Job
 * Runs daily at 10:00 AM Dubai time
 * Sends follow-up emails for pending quotations (> 7 days)
 */
export async function GET(request: Request) {
  // Build-time probe safe response
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    // Security check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📋 Quotation Follow-up Cron Job started...');
    console.log(`📅 Dubai Date: ${formatDubaiDate(new Date())}`);

    // Calculate date threshold (7 days ago in Dubai timezone)
    const sevenDaysAgo = getDubaiDaysAgo(7);

    // Find quotations without response
    const pendingQuotations = await prisma.quotations.findMany({
      where: {
        accepted: null,  // No response yet
        file: { not: null },  // File was sent
        createdAt: {
          lte: sevenDaysAgo  // More than 7 days ago
        }
      },
      include: {
        orders: {
          include: {
            clients: true,
            companies: true,
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📊 Found ${pendingQuotations.length} pending quotations`);

    let followed = 0;
    const results = [];

    // Send follow-ups
    for (const quotation of pendingQuotations) {
      const order = quotation.orders;
      
      if (!order.clients?.email) {
        console.log(`⚠️ Quotation #${quotation.id}: No email available`);
        continue;
      }

      try {
        // Calculate days pending
        const daysPending = Math.floor(
          (Date.now() - new Date(quotation.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Send follow-up email
        await sendEmail({
          to: order.clients.email,
          subject: `Quotation Review - Order #${order.id} - ${order.companies.name}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
                .highlight { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
                .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
                .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
                .info-box { background: white; padding: 15px; margin: 15px 0; border-radius: 6px; border: 1px solid #e5e7eb; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">📋 Quotation Review Reminder</h1>
                  <p style="margin: 10px 0 0 0; opacity: 0.9;">Your quotation is awaiting review</p>
                </div>
                
                <div class="content">
                  <p>Dear <strong>${order.clients.name}</strong>,</p>
                  
                  <p>We hope this email finds you well.</p>
                  
                  <p>We sent you a quotation for Order #${order.id} on <strong>${new Date(quotation.createdAt).toLocaleDateString('en-GB')}</strong> (${daysPending} days ago).</p>
                  
                  <div class="highlight">
                    <p style="margin: 0; font-weight: bold;">📄 Quotation Details</p>
                    <p style="margin: 5px 0 0 0;">We haven't received your response yet. We wanted to follow up and see if you need any clarification or have questions.</p>
                  </div>
                  
                  <div class="info-box">
                    <strong>Order Information:</strong><br>
                    Order Number: #${order.id}<br>
                    Quotation Number: #${quotation.id}<br>
                    Total Amount: <strong style="color: #7c3aed; font-size: 20px;">${quotation.total.toLocaleString()} ${quotation.currency}</strong><br>
                    Date Sent: ${new Date(quotation.createdAt).toLocaleDateString('en-GB')}
                  </div>
                  
                  ${quotation.notes ? `
                    <div class="info-box">
                      <strong>Our Notes:</strong><br>
                      ${quotation.notes}
                    </div>
                  ` : ''}
                  
                  <p><strong>We're here to help:</strong></p>
                  <ul>
                    <li>Do you need any clarifications on the quotation?</li>
                    <li>Would you like to discuss pricing or terms?</li>
                    <li>Do you need technical specifications?</li>
                    <li>Can we schedule a call to discuss?</li>
                  </ul>
                  
                  <center>
                    <a href="${process.env.NEXTAUTH_URL}/client/quotation/${quotation.id}/review" class="button">
                      Review Quotation Now →
                    </a>
                  </center>
                  
                  <p style="margin-top: 30px;">We look forward to serving you and would be happy to answer any questions you may have.</p>
                  
                  <p>Best regards,<br>
                  <strong>${order.companies.name}</strong><br>
                  Professional Power Solutions</p>
                </div>
                
                <div class="footer">
                  <p style="margin: 0 0 10px 0;"><strong>${order.companies.name}</strong></p>
                  <p style="margin: 0;">Leading Generator & Power Solutions Provider in UAE</p>
                  <p style="margin: 15px 0 0 0;">This is an automated follow-up email.</p>
                </div>
              </div>
            </body>
            </html>
          `
        });

        followed++;
        results.push({
          quotationId: quotation.id,
          orderId: order.id,
          client: order.clients.name,
          email: order.clients.email,
          daysPending: daysPending,
          amount: quotation.total,
          status: 'sent'
        });

        console.log(`✅ Follow-up sent: Quotation #${quotation.id} to ${order.clients.email}`);

        // Delay between emails
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Failed to send follow-up for Quotation #${quotation.id}:`, error);
        results.push({
          quotationId: quotation.id,
          orderId: order.id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`✅ Quotation Follow-up completed: ${followed} sent`);

    return NextResponse.json({
      success: true,
      message: `Sent ${followed} quotation follow-ups`,
      data: {
        followed: followed,
        total: pendingQuotations.length,
        results: results
      }
    });

  } catch (error) {
    console.error('💥 Quotation Follow-up Cron Job failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send follow-ups',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

