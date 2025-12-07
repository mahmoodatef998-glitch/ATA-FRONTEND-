import { sendEmail } from "./email";

/**
 * Email Templates for Client Notifications
 * جميع الـ Email notifications للعميل
 */

interface OrderEmailData {
  clientName: string;
  clientEmail: string;
  orderId: number;
  companyName: string;
  totalAmount?: number;
  currency?: string;
}

interface QuotationEmailData extends OrderEmailData {
  quotationId: number;
  quotationTotal: number;
  quotationFile?: string;
}

interface POEmailData extends OrderEmailData {
  poNumber: string;
  poFile?: string;
  depositAmount?: number;
  depositPercent?: number;
  depositRequired: boolean;
}

interface PaymentEmailData extends OrderEmailData {
  paymentType: "DEPOSIT" | "FINAL" | "PARTIAL";
  amount: number;
  paymentDate: Date;
}

interface CompletionEmailData extends OrderEmailData {
  deliveryNoteNumber?: string;
}

// ═══════════════════════════════════════════════════════════
// 1. Quotation Sent Email
// ═══════════════════════════════════════════════════════════
export async function sendQuotationEmail(data: QuotationEmailData) {
  try {
    await sendEmail({
      to: data.clientEmail,
      subject: `📋 Quotation Ready - Order #${data.orderId} - ${data.companyName}`,
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
            .amount { font-size: 28px; font-weight: bold; color: #7c3aed; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">📋 Quotation Ready!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your quotation is ready for review</p>
            </div>
            
            <div class="content">
              <p>Dear <strong>${data.clientName}</strong>,</p>
              
              <p>Great news! We've prepared a quotation for your order.</p>
              
              <div class="highlight">
                <p style="margin: 0; font-weight: bold;">📄 Quotation Details</p>
                <p style="margin: 5px 0 0 0;">Order #${data.orderId} - Quotation #${data.quotationId}</p>
              </div>
              
              <div style="text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #6b7280;">Total Amount</p>
                <p class="amount">${data.quotationTotal.toLocaleString()} ${data.currency || 'AED'}</p>
              </div>
              
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Review the quotation carefully</li>
                <li>Accept or request modifications</li>
                <li>We'll proceed once you approve</li>
              </ul>
              
              <center>
                <a href="${process.env.NEXTAUTH_URL}/client/quotation/${data.quotationId}/review" class="button">
                  Review Quotation Now →
                </a>
              </center>
              
              <p style="margin-top: 30px;">If you have any questions, feel free to contact us.</p>
              
              <p>Best regards,<br>
              <strong>${data.companyName}</strong></p>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>${data.companyName}</strong></p>
              <p style="margin: 0;">Professional Power Solutions Provider</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    
    console.log(`✅ Quotation email sent to ${data.clientEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send quotation email:', error);
    return { success: false, error };
  }
}

// ═══════════════════════════════════════════════════════════
// 2. Quotation Accepted Email
// ═══════════════════════════════════════════════════════════
export async function sendQuotationAcceptedEmail(data: QuotationEmailData) {
  try {
    await sendEmail({
      to: data.clientEmail,
      subject: `✅ Quotation Accepted - Order #${data.orderId} - ${data.companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">✅ Thank You!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Quotation accepted successfully</p>
            </div>
            
            <div class="content">
              <p>Dear <strong>${data.clientName}</strong>,</p>
              
              <p>Thank you for accepting our quotation!</p>
              
              <div class="success-box">
                <p style="margin: 0; font-weight: bold;">✅ Quotation Accepted</p>
                <p style="margin: 5px 0 0 0;">Order #${data.orderId} - Quotation #${data.quotationId}</p>
              </div>
              
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>We'll prepare your Purchase Order (PO)</li>
                <li>You'll receive the PO with payment details</li>
                <li>After deposit payment, we'll start production</li>
              </ul>
              
              <p>We're excited to move forward with your order!</p>
              
              <center>
                <a href="${process.env.NEXTAUTH_URL}/client/portal" class="button">
                  View My Orders →
                </a>
              </center>
              
              <p>Best regards,<br>
              <strong>${data.companyName}</strong></p>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>${data.companyName}</strong></p>
              <p style="margin: 0;">We appreciate your business!</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    
    console.log(`✅ Quotation accepted email sent to ${data.clientEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send quotation accepted email:', error);
    return { success: false, error };
  }
}

// ═══════════════════════════════════════════════════════════
// 3. Quotation Rejected Email
// ═══════════════════════════════════════════════════════════
export async function sendQuotationRejectedEmail(data: QuotationEmailData) {
  try {
    await sendEmail({
      to: data.clientEmail,
      subject: `Quotation Feedback - Order #${data.orderId} - ${data.companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Thank You for Your Feedback</h1>
            </div>
            
            <div class="content">
              <p>Dear <strong>${data.clientName}</strong>,</p>
              
              <p>We received your feedback on quotation #${data.quotationId} for order #${data.orderId}.</p>
              
              <div class="info-box">
                <p style="margin: 0; font-weight: bold;">We're here to help!</p>
                <p style="margin: 5px 0 0 0;">Our team will review your feedback and get back to you soon.</p>
              </div>
              
              <p><strong>What we'll do:</strong></p>
              <ul>
                <li>Review your concerns and requirements</li>
                <li>Prepare a revised quotation if needed</li>
                <li>Contact you to discuss any questions</li>
              </ul>
              
              <p>We value your business and want to ensure you're completely satisfied.</p>
              
              <p>Best regards,<br>
              <strong>${data.companyName}</strong></p>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>${data.companyName}</strong></p>
              <p style="margin: 0;">Customer satisfaction is our priority</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    
    console.log(`✅ Quotation rejected email sent to ${data.clientEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send quotation rejected email:', error);
    return { success: false, error };
  }
}

// ═══════════════════════════════════════════════════════════
// 4. PO Created Email
// ═══════════════════════════════════════════════════════════
export async function sendPOCreatedEmail(data: POEmailData) {
  try {
    await sendEmail({
      to: data.clientEmail,
      subject: `📋 Purchase Order Ready - ${data.poNumber} - ${data.companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .highlight { background: #e0f2fe; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
            .deposit-box { background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .amount { font-size: 24px; font-weight: bold; color: #dc2626; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">📋 Purchase Order Ready!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">${data.poNumber}</p>
            </div>
            
            <div class="content">
              <p>Dear <strong>${data.clientName}</strong>,</p>
              
              <p>Your Purchase Order is ready! We're excited to move forward with your order.</p>
              
              <div class="highlight">
                <p style="margin: 0; font-weight: bold;">📄 Purchase Order Details</p>
                <p style="margin: 5px 0 0 0;">PO Number: <strong>${data.poNumber}</strong></p>
                <p style="margin: 5px 0 0 0;">Order: #${data.orderId}</p>
              </div>
              
              ${data.depositRequired ? `
                <div class="deposit-box">
                  <p style="margin: 0; font-weight: bold; color: #d97706;">💰 Deposit Payment Required</p>
                  <p style="margin: 10px 0 5px 0;">Deposit Amount: <span class="amount">${data.depositAmount?.toLocaleString()} ${data.currency || 'AED'}</span></p>
                  <p style="margin: 5px 0 0 0; font-size: 14px; color: #78716c;">Deposit: ${data.depositPercent}% of total amount</p>
                  <p style="margin: 10px 0 0 0; font-size: 14px;">Please arrange the deposit payment to start production.</p>
                </div>
              ` : ''}
              
              <p><strong>Next Steps:</strong></p>
              <ul>
                ${data.depositRequired ? '<li>Review the Purchase Order</li>' : ''}
                ${data.depositRequired ? `<li>Arrange deposit payment (${data.depositPercent}%)</li>` : ''}
                <li>We'll begin production after payment confirmation</li>
                <li>You'll receive updates throughout the process</li>
              </ul>
              
              <center>
                <a href="${process.env.NEXTAUTH_URL}/client/portal" class="button">
                  View Purchase Order →
                </a>
              </center>
              
              <p style="margin-top: 30px;">Thank you for your business!</p>
              
              <p>Best regards,<br>
              <strong>${data.companyName}</strong></p>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>${data.companyName}</strong></p>
              <p style="margin: 0;">Professional Power Solutions Provider</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    
    console.log(`✅ PO created email sent to ${data.clientEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send PO created email:', error);
    return { success: false, error };
  }
}

// ═══════════════════════════════════════════════════════════
// 5. Payment Received Email
// ═══════════════════════════════════════════════════════════
export async function sendPaymentReceivedEmail(data: PaymentEmailData) {
  try {
    const paymentTypeText = {
      DEPOSIT: 'Deposit Payment',
      FINAL: 'Final Payment',
      PARTIAL: 'Partial Payment'
    };
    
    await sendEmail({
      to: data.clientEmail,
      subject: `✅ Payment Received - Order #${data.orderId} - ${data.companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px; text-align: center; }
            .amount { font-size: 32px; font-weight: bold; color: #059669; margin: 10px 0; }
            .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">✅ Payment Received!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for your payment</p>
            </div>
            
            <div class="content">
              <p>Dear <strong>${data.clientName}</strong>,</p>
              
              <p>We've received your payment. Thank you!</p>
              
              <div class="success-box">
                <p style="margin: 0; font-size: 16px; color: #059669; font-weight: bold;">
                  💰 ${paymentTypeText[data.paymentType]}
                </p>
                <p class="amount">${data.amount.toLocaleString()} ${data.currency || 'AED'}</p>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">
                  Received on ${new Date(data.paymentDate).toLocaleDateString('en-GB')}
                </p>
              </div>
              
              <p><strong>Order Details:</strong></p>
              <ul>
                <li>Order Number: #${data.orderId}</li>
                <li>Payment Type: ${paymentTypeText[data.paymentType]}</li>
                <li>Amount: ${data.amount.toLocaleString()} ${data.currency || 'AED'}</li>
              </ul>
              
              ${data.paymentType === 'DEPOSIT' ? `
                <p><strong>What's next?</strong></p>
                <ul>
                  <li>We'll start production/procurement immediately</li>
                  <li>You'll receive regular updates</li>
                  <li>We'll notify you when ready for delivery</li>
                </ul>
              ` : data.paymentType === 'FINAL' ? `
                <p><strong>What's next?</strong></p>
                <ul>
                  <li>Your order is complete</li>
                  <li>We'll arrange delivery/pickup</li>
                  <li>Thank you for your business!</li>
                </ul>
              ` : ''}
              
              <p style="margin-top: 30px;">If you have any questions, please don't hesitate to contact us.</p>
              
              <p>Best regards,<br>
              <strong>${data.companyName}</strong></p>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>${data.companyName}</strong></p>
              <p style="margin: 0;">Thank you for your trust!</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    
    console.log(`✅ Payment received email sent to ${data.clientEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send payment received email:', error);
    return { success: false, error };
  }
}

// ═══════════════════════════════════════════════════════════
// 6. Order Completed Email
// ═══════════════════════════════════════════════════════════
export async function sendOrderCompletedEmail(data: CompletionEmailData) {
  try {
    await sendEmail({
      to: data.clientEmail,
      subject: `🎉 Order Completed - Order #${data.orderId} - ${data.companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .celebration-box { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #fbbf24; padding: 25px; border-radius: 10px; margin: 20px 0; text-align: center; }
            .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 36px;">🎉 Congratulations!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 18px;">Your order is complete</p>
            </div>
            
            <div class="content">
              <p>Dear <strong>${data.clientName}</strong>,</p>
              
              <div class="celebration-box">
                <p style="margin: 0; font-size: 20px; font-weight: bold; color: #d97706;">
                  ✅ Order #${data.orderId} Completed!
                </p>
                ${data.deliveryNoteNumber ? `
                  <p style="margin: 10px 0 0 0; font-size: 16px; color: #78716c;">
                    Delivery Note: ${data.deliveryNoteNumber}
                  </p>
                ` : ''}
              </div>
              
              <p>We're delighted to inform you that your order has been successfully completed!</p>
              
              <p><strong>Thank you for choosing ${data.companyName}!</strong></p>
              
              <p>We hope you're satisfied with our service. Your feedback is valuable to us.</p>
              
              <p><strong>Need anything else?</strong></p>
              <ul>
                <li>Create a new order anytime</li>
                <li>Contact us for support or questions</li>
                <li>We're always here to help!</li>
              </ul>
              
              <p style="margin-top: 30px; padding: 20px; background: #e0e7ff; border-radius: 8px; border-left: 4px solid #6366f1;">
                <strong>💡 We appreciate your business!</strong><br>
                <span style="font-size: 14px;">Thank you for trusting ${data.companyName} with your power solution needs.</span>
              </p>
              
              <p>Best regards,<br>
              <strong>${data.companyName} Team</strong></p>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>${data.companyName}</strong></p>
              <p style="margin: 0;">Professional Power Solutions Provider</p>
              <p style="margin: 10px 0 0 0;">🌟 Thank you for your business! 🌟</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
    
    console.log(`✅ Order completed email sent to ${data.clientEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send order completed email:', error);
    return { success: false, error };
  }
}

