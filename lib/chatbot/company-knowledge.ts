/**
 * Company Knowledge Base for Chatbot
 * Fetches company information and client order history for chatbot context
 */

import { prisma } from "@/lib/prisma";

export interface CompanyKnowledge {
  name: string;
  description?: string;
  products?: string;
  services?: string;
  contactInfo?: string;
  businessHours?: string;
  specialties?: string;
}

export interface ClientOrderHistory {
  totalOrders: number;
  recentOrders: Array<{
    id: number;
    status: string;
    stage: string;
    totalAmount?: number;
    currency: string;
    createdAt: Date;
    depositPaid?: boolean;
    finalPaymentReceived?: boolean;
    hasQuotation?: boolean;
    quotationAccepted?: boolean;
  }>;
  pendingOrders: number;
  completedOrders: number;
}

/**
 * Get company knowledge base information
 */
export async function getCompanyKnowledge(companyId: number): Promise<CompanyKnowledge | null> {
  try {
    const company = await prisma.companies.findUnique({
      where: { id: companyId },
      select: {
        name: true,
        products: true,
        services: true,
        contactInfo: true,
        businessHours: true,
        specialties: true,
      },
    });

    return company as CompanyKnowledge | null;
  } catch (error) {
    console.error("Error fetching company knowledge:", error);
    return null;
  }
}

/**
 * Get client order history for chatbot context
 * This helps the chatbot answer questions about client's orders
 */
export async function getClientOrderHistory(clientId: number): Promise<ClientOrderHistory | null> {
  try {
    const [orders, stats, allOrdersCount] = await Promise.all([
      prisma.orders.findMany({
        where: { clientId },
        select: {
          id: true,
          status: true,
          stage: true,
          totalAmount: true,
          currency: true,
          createdAt: true,
          depositPaid: true,
          finalPaymentReceived: true,
          quotations: {
            select: {
              id: true,
              accepted: true,
              total: true,
            },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10, // Last 10 orders
      }),
      prisma.orders.groupBy({
        by: ["status"],
        where: { clientId },
        _count: true,
      }),
      prisma.orders.count({
        where: { clientId },
      }),
    ]);

    const pendingOrders = stats.find((s) => s.status === "PENDING")?._count || 0;
    const completedOrders = stats.find((s) => s.status === "COMPLETED")?._count || 0;
    const quotationSent = stats.find((s) => s.status === "QUOTATION_SENT")?._count || 0;

    return {
      totalOrders: allOrdersCount,
      recentOrders: orders.map((order) => ({
        id: order.id,
        status: order.status,
        stage: order.stage,
        totalAmount: order.totalAmount || undefined,
        currency: order.currency,
        createdAt: order.createdAt,
        depositPaid: order.depositPaid,
        finalPaymentReceived: order.finalPaymentReceived,
        hasQuotation: order.quotations.length > 0,
        quotationAccepted: order.quotations[0]?.accepted || false,
      })),
      pendingOrders,
      completedOrders,
    };
  } catch (error) {
    console.error("Error fetching client order history:", error);
    return null;
  }
}

/**
 * Format company knowledge as a string for chatbot prompt
 */
export function formatCompanyKnowledge(knowledge: CompanyKnowledge | null): string {
  if (!knowledge) {
    return "";
  }

  let context = `\n\n=== Company Information ===\n`;
  context += `Company Name (Arabic): الطاقة الملونة للمولدات وحلول الطاقة\n`;
  context += `Company Name (English): ATA GENERATORS AND SWITCHGEAR SOLUTIONS\n`;
  context += `Company Name in Database: ${knowledge.name}\n`;
  context += `Note: This CRM system is used by the company to manage orders. The company itself is NOT called "CRM".\n`;

  if (knowledge.description) {
    context += `Description: ${knowledge.description}\n`;
  }

  if (knowledge.products) {
    context += `Products & Services: ${knowledge.products}\n`;
  }

  if (knowledge.services) {
    context += `Services: ${knowledge.services}\n`;
  }

  if (knowledge.specialties) {
    context += `Specialties: ${knowledge.specialties}\n`;
  }

  if (knowledge.contactInfo) {
    context += `Contact Information: ${knowledge.contactInfo}\n`;
  }

  if (knowledge.businessHours) {
    context += `Business Hours: ${knowledge.businessHours}\n`;
  }

  return context;
}

/**
 * Format client order history as a string for chatbot prompt
 */
export function formatClientOrderHistory(history: ClientOrderHistory | null): string {
  if (!history || history.totalOrders === 0) {
    return "";
  }

  let context = `\n\n=== Client Order History ===\n`;
  context += `Total Orders: ${history.totalOrders}\n`;
  context += `Pending Orders: ${history.pendingOrders}\n`;
  context += `Completed Orders: ${history.completedOrders}\n`;

  if (history.recentOrders.length > 0) {
    context += `\nRecent Orders (Last 5):\n`;
    history.recentOrders.slice(0, 5).forEach((order) => {
      context += `- Order #${order.id}: Status: ${order.status}, Stage: ${order.stage}`;
      if (order.totalAmount) {
        context += `, Amount: ${order.totalAmount} ${order.currency}`;
      }
      if (order.hasQuotation) {
        context += `, Quotation: ${order.quotationAccepted ? 'Accepted' : 'Pending Review'}`;
      }
      if (order.depositPaid) {
        context += `, Deposit: Paid`;
      }
      if (order.finalPaymentReceived) {
        context += `, Final Payment: Paid`;
      }
      context += `, Created: ${order.createdAt.toLocaleDateString()}\n`;
    });
  }

  // Add actionable insights
  context += `\nIMPORTANT NOTES FOR CLIENT:\n`;
  context += `- Check your portal for detailed order information\n`;
  context += `- Review quotations promptly to avoid delays\n`;
  context += `- Complete payments on time to ensure smooth processing\n`;
  context += `- Contact support if you have questions about any order\n`;

  return context;
}

/**
 * Get order workflow information for chatbot context
 */
export function getOrderWorkflowInfo(): string {
  return `
=== Order Workflow & Stages ===

Order Stages (in sequence):
1. RECEIVED - Order request received and logged
2. UNDER_REVIEW - Company is reviewing requirements
3. QUOTATION_PREPARATION - Preparing quotation document
4. QUOTATION_SENT - Quotation sent to client for review
5. QUOTATION_ACCEPTED - Client approved the quotation
6. PO_PREPARED - Purchase order prepared
7. AWAITING_DEPOSIT - Waiting for deposit payment from client
8. DEPOSIT_RECEIVED - Deposit payment received
9. IN_MANUFACTURING - Product is being manufactured
10. MANUFACTURING_COMPLETE - Manufacturing finished
11. READY_FOR_DELIVERY - Product ready to be delivered
12. DELIVERY_NOTE_SENT - Delivery note issued
13. AWAITING_FINAL_PAYMENT - Waiting for final payment
14. FINAL_PAYMENT_RECEIVED - Final payment received
15. COMPLETED_DELIVERED - Order completed and delivered

Order Statuses:
- PENDING: Order is pending approval
- APPROVED: Order has been approved
- REJECTED: Order was rejected
- QUOTATION_SENT: Quotation has been sent
- COMPLETED: Order is completed
- CANCELLED: Order was cancelled
`;
}

/**
 * Get how-to guide for placing orders
 */
export function getOrderPlacementGuide(): string {
  return `
=== How to Place an Order ===

Step-by-step guide for clients:

1. REGISTRATION:
   - Go to the client registration page
   - Fill in your details (name, phone, email - required)
   - Submit registration
   - Wait for admin approval

2. LOGIN:
   - Use your phone number and password
   - Access your client portal

3. CREATE ORDER:
   - Click "Create New Order" or "New Order"
   - Fill in order details:
     * Product specifications
     * Quantity
     * Any special requirements
     * Upload images if needed
   - Submit the order

4. TRACK ORDER:
   - View all your orders in the portal
   - Check order status and stage
   - View quotations when sent
   - Accept/reject quotations
   - Track payment status
   - Monitor manufacturing progress

5. QUOTATION PROCESS:
   - Company reviews your order
   - Quotation is prepared and sent
   - You receive notification
   - Review quotation PDF
   - Accept or reject
   - If accepted, proceed to payment

6. PAYMENT:
   - Deposit payment (usually required)
   - Final payment before delivery
   - Payment methods: As specified by company

7. DELIVERY:
   - Track manufacturing progress
   - Receive delivery note
   - Complete final payment
   - Receive your order
`;
}

/**
 * Get troubleshooting guide for common issues
 */
export function getTroubleshootingGuide(): string {
  return `
=== Troubleshooting Common Issues ===

1. CAN'T LOGIN:
   - Check if account is approved (contact admin if pending)
   - Verify phone number and password
   - If rejected, check rejection reason
   - Contact support if issues persist

2. ORDER NOT SHOWING:
   - Refresh the page
   - Check if order was successfully submitted
   - Verify you're logged in with correct account
   - Check order status (might be pending approval)

3. QUOTATION NOT RECEIVED:
   - Check order status (should be QUOTATION_SENT)
   - Check notifications in portal
   - Verify email if provided
   - Contact company if quotation is delayed

4. CAN'T OPEN QUOTATION FILE:
   - Check if file is available
   - Try downloading instead of opening
   - Check browser permissions
   - Contact support if file is corrupted

5. PAYMENT ISSUES:
   - Verify payment amount
   - Check payment method accepted
   - Contact company for payment details
   - Verify deposit percentage required

6. ORDER STATUS NOT UPDATING:
   - Status updates may take time
   - Refresh the page
   - Check notifications
   - Contact company for latest status

7. FORGOT PASSWORD:
   - Contact admin to reset password
   - Provide account verification details

8. ACCOUNT REJECTED:
   - Check rejection reason
   - Contact admin to understand why
   - Re-register with correct information if needed

GENERAL TIPS:
- Always check notifications in the portal
- Keep your contact information updated
- Respond promptly to quotation requests
- Contact support for urgent matters
- Use the chatbot for quick answers
`;
}

