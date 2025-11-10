import nodemailer from "nodemailer";

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter configuration
export async function verifyEmailConfig() {
  try {
    await transporter.verify();
    console.log("✅ Email service is ready");
    return true;
  } catch (error) {
    console.error("❌ Email service error:", error);
    return false;
  }
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Send email
export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    // Skip if email not configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log("⚠️ Email not configured. Skipping email to:", to);
      return { success: false, message: "Email not configured" };
    }

    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "ATA CRM"}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
      html,
    });

    console.log("✅ Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    return { success: false, error };
  }
}

// Email Templates

interface OrderConfirmationData {
  clientName: string;
  orderNumber: number;
  trackingUrl: string;
  companyName: string;
}

export function getOrderConfirmationEmail(data: OrderConfirmationData) {
  return {
    subject: `Order Confirmation - #${data.orderNumber}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Order Confirmed! 🎉</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333; margin: 0 0 20px;">Hi ${data.clientName},</p>
              
              <p style="font-size: 16px; color: #333; margin: 0 0 20px;">
                Thank you for your quotation request! We've received it and our team will review it shortly.
              </p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #666;">Order Number:</p>
                <p style="margin: 0; font-size: 24px; font-weight: bold; color: #667eea;">#${data.orderNumber}</p>
              </div>
              
              <p style="font-size: 16px; color: #333; margin: 20px 0;">
                You can track your order status anytime using the link below:
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${data.trackingUrl}" 
                       style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                      Track Your Order
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 14px; color: #666; margin: 20px 0 0;">
                If you have any questions, feel free to reply to this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                ${data.companyName}<br>
                This is an automated message, please do not reply directly to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

interface QuotationSentData {
  clientName: string;
  orderNumber: number;
  quotationAmount: number;
  currency: string;
  reviewUrl: string;
  companyName: string;
}

export function getQuotationSentEmail(data: QuotationSentData) {
  return {
    subject: `Quotation Ready - Order #${data.orderNumber}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quotation Ready</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Quotation Ready! 📋</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333; margin: 0 0 20px;">Hi ${data.clientName},</p>
              
              <p style="font-size: 16px; color: #333; margin: 0 0 20px;">
                Great news! Your quotation is ready for review.
              </p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #666;">Order Number:</p>
                <p style="margin: 0 0 15px; font-size: 20px; font-weight: bold; color: #667eea;">#${data.orderNumber}</p>
                
                <p style="margin: 0 0 10px; font-size: 14px; color: #666;">Quotation Amount:</p>
                <p style="margin: 0; font-size: 28px; font-weight: bold; color: #28a745;">${data.quotationAmount.toLocaleString()} ${data.currency}</p>
              </div>
              
              <p style="font-size: 16px; color: #333; margin: 20px 0;">
                Please review the quotation and let us know if you accept or if you have any questions.
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${data.reviewUrl}" 
                       style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                      Review Quotation
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 14px; color: #666; margin: 20px 0 0; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                ⏰ Please review and respond within 7 days to proceed with your order.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                ${data.companyName}<br>
                This is an automated message, please do not reply directly to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

interface QuotationResponseData {
  adminName: string;
  clientName: string;
  orderNumber: number;
  accepted: boolean;
  comment?: string;
  rejectionReason?: string;
  orderUrl: string;
  companyName: string;
}

export function getQuotationResponseEmail(data: QuotationResponseData) {
  const status = data.accepted ? "Accepted ✅" : "Rejected ❌";
  const statusColor = data.accepted ? "#28a745" : "#dc3545";
  
  return {
    subject: `Quotation ${data.accepted ? "Accepted" : "Rejected"} - Order #${data.orderNumber}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quotation Response</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${statusColor}; padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Quotation ${status}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333; margin: 0 0 20px;">Hi ${data.adminName},</p>
              
              <p style="font-size: 16px; color: #333; margin: 0 0 20px;">
                <strong>${data.clientName}</strong> has ${data.accepted ? "accepted" : "rejected"} the quotation for Order #${data.orderNumber}.
              </p>
              
              ${data.comment ? `
              <div style="background-color: #e7f3ff; border-left: 4px solid #2196F3; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #666; font-weight: bold;">Client Comment:</p>
                <p style="margin: 0; font-size: 16px; color: #333;">${data.comment}</p>
              </div>
              ` : ''}
              
              ${data.rejectionReason ? `
              <div style="background-color: #ffebee; border-left: 4px solid #f44336; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #666; font-weight: bold;">Rejection Reason:</p>
                <p style="margin: 0; font-size: 16px; color: #333;">${data.rejectionReason}</p>
              </div>
              ` : ''}
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${data.orderUrl}" 
                       style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                      View Order Details
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                ${data.companyName}<br>
                This is an automated message, please do not reply directly to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}

interface OrderStatusUpdateData {
  clientName: string;
  orderNumber: number;
  oldStatus: string;
  newStatus: string;
  trackingUrl: string;
  companyName: string;
}

export function getOrderStatusUpdateEmail(data: OrderStatusUpdateData) {
  const statusMessages: Record<string, { title: string; message: string; color: string }> = {
    APPROVED: {
      title: "Order Approved! ✅",
      message: "Your order has been approved and will be processed shortly.",
      color: "#28a745",
    },
    IN_PROGRESS: {
      title: "Order In Progress 🔄",
      message: "Your order is now being processed. We'll notify you once it's completed.",
      color: "#17a2b8",
    },
    COMPLETED: {
      title: "Order Completed! 🎉",
      message: "Your order has been completed successfully. Thank you for your business!",
      color: "#28a745",
    },
    CANCELLED: {
      title: "Order Cancelled ❌",
      message: "Your order has been cancelled. If you have any questions, please contact us.",
      color: "#dc3545",
    },
  };

  const statusInfo = statusMessages[data.newStatus] || {
    title: `Order Status Updated`,
    message: `Your order status has been updated to: ${data.newStatus}`,
    color: "#667eea",
  };

  return {
    subject: `${statusInfo.title} - Order #${data.orderNumber}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Status Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${statusInfo.color}; padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">${statusInfo.title}</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333; margin: 0 0 20px;">Hi ${data.clientName},</p>
              
              <p style="font-size: 16px; color: #333; margin: 0 0 20px;">
                ${statusInfo.message}
              </p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid ${statusInfo.color}; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #666;">Order Number:</p>
                <p style="margin: 0 0 15px; font-size: 20px; font-weight: bold; color: ${statusInfo.color};">#${data.orderNumber}</p>
                
                <p style="margin: 0 0 10px; font-size: 14px; color: #666;">Status:</p>
                <p style="margin: 0; font-size: 18px; font-weight: bold; color: ${statusInfo.color};">${data.newStatus.replace(/_/g, " ")}</p>
              </div>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${data.trackingUrl}" 
                       style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                      Track Your Order
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                ${data.companyName}<br>
                This is an automated message, please do not reply directly to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };
}


