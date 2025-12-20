import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeAny } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { startOfMonth, subMonths, format } from "date-fns";
import { handleApiError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  // Build-time probe safe response
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    // Allow access with either LEAD_READ or OVERVIEW_VIEW permission
    const { userId, companyId } = await authorizeAny([
      PermissionAction.LEAD_READ,
      PermissionAction.OVERVIEW_VIEW,
    ]);

    // Get last 3 months data
    const now = new Date();
    const threeMonthsAgo = subMonths(now, 3);
    
    // Revenue by month (last 3 months)
    const revenueByMonth = await Promise.all(
      [2, 1, 0].map(async (monthsBack) => {
        const monthStart = startOfMonth(subMonths(now, monthsBack));
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        
        const revenue = await prisma.orders.aggregate({
          where: {
            companyId,
            status: "COMPLETED",
            totalAmount: { not: null },
            updatedAt: {
              gte: monthStart,
              lt: monthEnd,
            },
          },
          _sum: { totalAmount: true },
        });
        
        return {
          month: format(monthStart, "MMM yyyy"),
          revenue: revenue._sum.totalAmount || 0,
        };
      })
    );

    // Orders by status (last 3 months)
    const ordersByStatus = await prisma.orders.groupBy({
      by: ["status"],
      where: {
        companyId,
        createdAt: { gte: threeMonthsAgo },
      },
      _count: { id: true },
    });

    const ordersData = ordersByStatus.map((item) => ({
      status: item.status.replace(/_/g, " "),
      count: item._count.id,
    }));

    // Top clients (last 3 months) - Optimized query to avoid N+1 problem
    // First, get top clients by order count
    const topClientsByOrders = await prisma.orders.groupBy({
      by: ["clientId"],
      where: {
        companyId,
        clientId: { not: null },
        createdAt: { gte: threeMonthsAgo },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    // Get all client IDs
    const clientIds = topClientsByOrders.map(c => c.clientId!).filter(Boolean);

    // Fetch all client data in one query
    const clientsData = await prisma.clients.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, name: true },
    });

    // Create a map for quick lookup
    const clientsMap = new Map(clientsData.map(c => [c.id, c.name]));

    // Get revenue for all clients in one query per client (optimized)
    const topClients = await Promise.all(
      topClientsByOrders.map(async (client) => {
        // Get revenue for this client
        const clientRevenue = await prisma.orders.aggregate({
          where: {
            companyId,
            clientId: client.clientId!,
            status: "COMPLETED",
            totalAmount: { not: null },
            createdAt: { gte: threeMonthsAgo },
          },
          _sum: { totalAmount: true },
        });

        return {
          name: clientsMap.get(client.clientId!) || "Unknown",
          orders: client._count.id,
          revenue: clientRevenue._sum.totalAmount || 0,
        };
      })
    );

    // Conversion rate (last 3 months)
    const totalOrders = await prisma.orders.count({
      where: {
        companyId,
        createdAt: { gte: threeMonthsAgo },
      },
    });

    const completedOrders = await prisma.orders.count({
      where: {
        companyId,
        status: "COMPLETED",
        createdAt: { gte: threeMonthsAgo },
      },
    });

    const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        revenueData: revenueByMonth,
        ordersData,
        topClients,
        conversionRate,
      },
    });
  } catch (error: any) {
    logger.error("Analytics API error", error, "analytics");
    return handleApiError(error);
  }
}

