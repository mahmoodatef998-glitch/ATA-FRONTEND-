import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getDubaiStartOfDay, getDubaiEndOfDay, formatDubaiDate } from "@/lib/cron-timezone-utils";

/**
 * Daily Report Cron Job
 * Runs daily at 8:00 PM Dubai time
 * Sends daily summary report to admin/manager
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

    console.log('📊 Daily Report Cron Job started...');
    console.log(`📅 Dubai Date: ${formatDubaiDate(new Date())}`);

    // Get today's date range in Dubai timezone
    const today = getDubaiStartOfDay();
    const tomorrow = getDubaiEndOfDay();

    // Get all companies (in case multiple companies)
    const companies = await prisma.companies.findMany();

    const reports = [];

    for (const company of companies) {
      // Get today's statistics
      const [
        newOrders,
        quotationsSent,
        quotationsAccepted,
        posCreated,
        paymentsReceived,
        deliveriesCompleted,
        totalPayments,
        pendingOrders,
        overduePayments,
      ] = await Promise.all([
        // New orders today
        prisma.orders.count({
          where: {
            companyId: company.id,
            createdAt: { gte: today, lt: tomorrow }
          }
        }),
        
        // Quotations sent today
        prisma.quotations.count({
          where: {
            orders: { companyId: company.id },
            createdAt: { gte: today, lt: tomorrow },
            file: { not: null }
          }
        }),
        
        // Quotations accepted today
        prisma.quotations.count({
          where: {
            orders: { companyId: company.id },
            reviewedAt: { gte: today, lt: tomorrow },
            accepted: true
          }
        }),
        
        // POs created today
        prisma.purchase_orders.count({
          where: {
            orders: { companyId: company.id },
            createdAt: { gte: today, lt: tomorrow }
          }
        }),
        
        // Payments received today
        prisma.payments.count({
          where: {
            orders: { companyId: company.id },
            paidAt: { gte: today, lt: tomorrow }
          }
        }),
        
        // Deliveries completed today
        prisma.delivery_notes.count({
          where: {
            orders: { companyId: company.id },
            createdAt: { gte: today, lt: tomorrow }
          }
        }),
        
        // Total payments amount today
        prisma.payments.aggregate({
          where: {
            orders: { companyId: company.id },
            paidAt: { gte: today, lt: tomorrow }
          },
          _sum: { amount: true }
        }),
        
        // Pending orders count
        prisma.orders.count({
          where: {
            companyId: company.id,
            status: { in: ['PENDING', 'APPROVED'] }
          }
        }),
        
        // Overdue payments
        prisma.orders.count({
          where: {
            companyId: company.id,
            stage: 'AWAITING_DEPOSIT',
            depositPaid: false,
            updatedAt: {
              lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            }
          }
        }),
      ]);

      // Get company admins
      const admins = await prisma.users.findMany({
        where: {
          companyId: company.id,
          role: 'ADMIN'
        },
        select: {
          email: true,
          name: true
        }
      });

      if (admins.length === 0) {
        console.log(`⚠️ No admins found for ${company.name}`);
        continue;
      }

      // Prepare report data
      const reportData = {
        companyName: company.name,
        date: today.toLocaleDateString('en-GB', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        stats: {
          newOrders,
          quotationsSent,
          quotationsAccepted,
          posCreated,
          paymentsReceived,
          deliveriesCompleted,
          totalPayments: totalPayments._sum.amount || 0,
          pendingOrders,
          overduePayments,
        }
      };

      // Send email to all admins
      for (const admin of admins) {
        try {
          await sendEmail({
            to: admin.email,
            subject: `📊 Daily Report - ${today.toLocaleDateString('en-GB')} - ${company.name}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f3f4f6; }
                  .container { max-width: 650px; margin: 20px auto; }
                  .header { background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: white; padding: 30px; }
                  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
                  .stat-card { background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #e5e7eb; }
                  .stat-number { font-size: 32px; font-weight: bold; margin: 10px 0; }
                  .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
                  .revenue-box { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 25px; border-radius: 10px; text-align: center; margin: 20px 0; }
                  .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
                  .footer { background: #111827; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
                  .icon { display: inline-block; margin-right: 8px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1 style="margin: 0;">📊 Daily Business Report</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">${reportData.date}</p>
                  </div>
                  
                  <div class="content">
                    <p>Good evening, <strong>${admin.name}</strong>!</p>
                    
                    <p>Here's your daily summary for <strong>${company.name}</strong>:</p>
                    
                    ${reportData.stats.totalPayments > 0 ? `
                      <div class="revenue-box">
                        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">💰 Revenue Today</div>
                        <div style="font-size: 36px; font-weight: bold;">${reportData.stats.totalPayments.toLocaleString()} AED</div>
                        <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">From ${reportData.stats.paymentsReceived} payment(s)</div>
                      </div>
                    ` : ''}
                    
                    <h3 style="margin-top: 30px; color: #1e40af;">Today's Activity</h3>
                    
                    <div class="stats-grid">
                      <div class="stat-card" style="border-color: #3b82f6;">
                        <div class="stat-label">📦 New Orders</div>
                        <div class="stat-number" style="color: #3b82f6;">${reportData.stats.newOrders}</div>
                      </div>
                      
                      <div class="stat-card" style="border-color: #8b5cf6;">
                        <div class="stat-label">📋 Quotations Sent</div>
                        <div class="stat-number" style="color: #8b5cf6;">${reportData.stats.quotationsSent}</div>
                      </div>
                      
                      <div class="stat-card" style="border-color: #10b981;">
                        <div class="stat-label">✅ Quotes Accepted</div>
                        <div class="stat-number" style="color: #10b981;">${reportData.stats.quotationsAccepted}</div>
                      </div>
                      
                      <div class="stat-card" style="border-color: #0ea5e9;">
                        <div class="stat-label">📄 POs Created</div>
                        <div class="stat-number" style="color: #0ea5e9;">${reportData.stats.posCreated}</div>
                      </div>
                      
                      <div class="stat-card" style="border-color: #f59e0b;">
                        <div class="stat-label">💰 Payments</div>
                        <div class="stat-number" style="color: #f59e0b;">${reportData.stats.paymentsReceived}</div>
                      </div>
                      
                      <div class="stat-card" style="border-color: #14b8a6;">
                        <div class="stat-label">🚚 Deliveries</div>
                        <div class="stat-number" style="color: #14b8a6;">${reportData.stats.deliveriesCompleted}</div>
                      </div>
                    </div>
                    
                    <h3 style="margin-top: 30px; color: #1e40af;">Current Status</h3>
                    
                    <div class="stats-grid" style="grid-template-columns: repeat(2, 1fr);">
                      <div class="stat-card">
                        <div class="stat-label">⏳ Pending Orders</div>
                        <div class="stat-number" style="color: #f59e0b;">${reportData.stats.pendingOrders}</div>
                      </div>
                      
                      ${reportData.stats.overduePayments > 0 ? `
                        <div class="stat-card" style="border-color: #dc2626;">
                          <div class="stat-label">⚠️ Overdue Payments</div>
                          <div class="stat-number" style="color: #dc2626;">${reportData.stats.overduePayments}</div>
                        </div>
                      ` : `
                        <div class="stat-card" style="border-color: #10b981;">
                          <div class="stat-label">✅ All Up to Date</div>
                          <div class="stat-number" style="color: #10b981;">0</div>
                        </div>
                      `}
                    </div>
                    
                    ${reportData.stats.overduePayments > 0 ? `
                      <div class="alert-box">
                        <p style="margin: 0; font-weight: bold;">⚠️ Attention Required</p>
                        <p style="margin: 5px 0 0 0;">${reportData.stats.overduePayments} order(s) have overdue deposit payments. Please follow up.</p>
                      </div>
                    ` : ''}
                    
                    <p style="margin-top: 30px; padding: 20px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
                      <strong>💡 Quick Tip:</strong> ${
                        reportData.stats.newOrders > 0 ? 
                        `You have ${reportData.stats.newOrders} new order(s) to review.` :
                        reportData.stats.pendingOrders > 0 ?
                        `Keep the workflow moving - ${reportData.stats.pendingOrders} orders in progress.` :
                        'Great job! All orders are progressing smoothly.'
                      }
                    </p>
                    
                    <center style="margin-top: 30px;">
                      <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Open Dashboard →
                      </a>
                    </center>
                    
                    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                      Have a productive day tomorrow!
                    </p>
                  </div>
                  
                  <div class="footer">
                    <p style="margin: 0 0 10px 0;"><strong>${company.name} - CRM System</strong></p>
                    <p style="margin: 0;">Automated Daily Report • ${new Date().toLocaleTimeString('en-GB')}</p>
                  </div>
                </div>
              </body>
              </html>
            `
          });

          console.log(`✅ Report sent to ${admin.email}`);

        } catch (error) {
          console.error(`❌ Failed to send report to ${admin.email}:`, error);
        }
      }

      reports.push({
        company: company.name,
        adminCount: admins.length,
        stats: reportData.stats
      });
    }

    console.log(`✅ Daily Report completed`);

    return NextResponse.json({
      success: true,
      message: 'Daily reports sent',
      data: {
        reports: reports,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('💥 Daily Report Cron Job failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send reports',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

