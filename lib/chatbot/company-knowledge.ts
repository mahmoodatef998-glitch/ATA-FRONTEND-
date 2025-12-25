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
        description: true,
        products: true,
        services: true,
        contactInfo: true,
        businessHours: true,
        specialties: true,
      },
    });

    return company;
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
    const [orders, stats] = await Promise.all([
      prisma.orders.findMany({
        where: { clientId },
        select: {
          id: true,
          status: true,
          stage: true,
          totalAmount: true,
          currency: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10, // Last 10 orders
      }),
      prisma.orders.groupBy({
        by: ["status"],
        where: { clientId },
        _count: true,
      }),
    ]);

    const pendingOrders = stats.find((s) => s.status === "PENDING")?._count || 0;
    const completedOrders = stats.find((s) => s.status === "COMPLETED")?._count || 0;

    return {
      totalOrders: orders.length,
      recentOrders: orders.map((order) => ({
        id: order.id,
        status: order.status,
        stage: order.stage,
        totalAmount: order.totalAmount || undefined,
        currency: order.currency,
        createdAt: order.createdAt,
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
  context += `Company Name: ${knowledge.name}\n`;

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
    context += `\nRecent Orders:\n`;
    history.recentOrders.slice(0, 5).forEach((order) => {
      context += `- Order #${order.id}: ${order.status} (${order.stage})`;
      if (order.totalAmount) {
        context += ` - ${order.totalAmount} ${order.currency}`;
      }
      context += `\n`;
    });
  }

  return context;
}

