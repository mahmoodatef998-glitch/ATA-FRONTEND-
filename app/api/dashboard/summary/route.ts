import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/error-handler";
import { getCached } from "@/lib/cache";

export const dynamic = 'force-dynamic';
export const revalidate = 120; // 2 minutes

/**
 * ✅ Performance: Aggregated Dashboard Summary Endpoint
 * 
 * Fetches ALL dashboard data in a single request to eliminate:
 * - Multiple API calls per page load
 * - RSC storms
 * - Repeated HEAD/GET requests
 * 
 * Returns:
 * - Stats (orders, revenue, etc.)
 * - Recent orders
 * - Top clients
 * - Action required orders
 * - Pending clients
 */
export async function GET(request: NextRequest) {
  // Build-time probe safe response
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const session = await requireAuth();
    const companyId = session.user.companyId;

    // ✅ Performance: Single cache key for all dashboard data
    const cacheKey = `dashboard:summary:${companyId}`;

    const result = await getCached(
      cacheKey,
      async () => {
        // ✅ Performance: Fetch all data in parallel using Promise.all
        const [
          totalOrders,
          pendingOrders,
          completedOrders,
          totalRevenue,
          monthRevenue,
          recentOrders,
          topClients,
          actionRequiredOrders,
          pendingClients,
        ] = await Promise.all([
          // Total orders
          prisma.orders.count({ where: { companyId } }),
          
          // Processing orders
          prisma.orders.count({
            where: { 
              companyId, 
              status: { notIn: ["COMPLETED", "CANCELLED"] } 
            },
          }),
          
          // Completed orders
          prisma.orders.count({
            where: { companyId, status: "COMPLETED" },
          }),
          
          // Total revenue
          prisma.orders.aggregate({
            where: { companyId, status: "COMPLETED", totalAmount: { not: null } },
            _sum: { totalAmount: true },
          }),
          
          // Month revenue
          (async () => {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            return prisma.orders.aggregate({
              where: {
                companyId,
                status: "COMPLETED",
                totalAmount: { not: null },
                updatedAt: { gte: startOfMonth },
              },
              _sum: { totalAmount: true },
            });
          })(),
          
          // Recent orders (last 5)
          prisma.orders.findMany({
            where: { companyId },
            select: {
              id: true,
              status: true,
              totalAmount: true,
              createdAt: true,
              clients: {
                select: { name: true, phone: true },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          }),
          
          // Top clients by order count
          prisma.orders.groupBy({
            by: ["clientId"],
            where: { companyId, clientId: { not: null } },
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
            take: 5,
          }),
          
          // Action required orders
          prisma.orders.findMany({
            where: {
              companyId,
              OR: [
                { status: "PENDING", stage: "RECEIVED" },
                { 
                  quotations: { some: { accepted: true } },
                  purchase_orders: { none: {} }
                },
                { depositPaid: true, stage: "AWAITING_DEPOSIT" },
                { finalPaymentReceived: true, status: { not: "COMPLETED" } },
              ]
            },
            select: {
              id: true,
              status: true,
              stage: true,
              depositPaid: true,
              finalPaymentReceived: true,
              createdAt: true,
              clients: {
                select: { name: true, phone: true },
              },
              quotations: {
                select: { id: true, accepted: true },
              },
              purchase_orders: {
                select: { id: true },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          }),

          // Pending clients
          prisma.clients.count({
            where: {
              hasAccount: true,
              accountStatus: "PENDING",
            },
          }),
        ]);

        // Get client names for top clients
        const clientIds = topClients.map(c => c.clientId!).filter(Boolean);
        const clientsData = clientIds.length > 0 
          ? await prisma.clients.findMany({
              where: { id: { in: clientIds } },
              select: { id: true, name: true, phone: true },
            })
          : [];
        
        const clientsMap = new Map(clientsData.map(c => [c.id, c]));
        const topClientsWithNames = topClients.map(client => {
          const clientData = clientsMap.get(client.clientId!);
          return {
            name: clientData?.name || 'Unknown',
            phone: clientData?.phone || '',
            orderCount: client._count.id,
          };
        });

        return {
          success: true,
          data: {
            stats: {
              totalOrders,
              pendingOrders,
              completedOrders,
              totalRevenue: totalRevenue._sum.totalAmount || 0,
              monthRevenue: monthRevenue._sum.totalAmount || 0,
            },
            recentOrders: recentOrders.map(order => ({
              id: order.id,
              status: order.status,
              totalAmount: order.totalAmount,
              createdAt: order.createdAt.toISOString(),
              clientName: order.clients?.name || "Unknown Client",
              clientPhone: order.clients?.phone || "",
            })),
            topClients: topClientsWithNames,
            actionRequiredOrders: actionRequiredOrders.map(order => ({
              id: order.id,
              status: order.status,
              stage: order.stage,
              depositPaid: order.depositPaid,
              finalPaymentReceived: order.finalPaymentReceived,
              createdAt: order.createdAt.toISOString(),
              clientName: order.clients?.name || "Unknown",
              clientPhone: order.clients?.phone || "",
              needsPO: order.quotations.some(q => q.accepted === true) && order.purchase_orders.length === 0,
            })),
            pendingClients,
          },
        };
      },
      120 // 2 minutes cache TTL
    );

    const response = NextResponse.json(result);
    
    // ✅ Performance: Add cache headers for better performance
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=120, stale-while-revalidate=240'
    );
    
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

