import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, DollarSign, Clock, CheckCircle, TrendingUp, Users, ArrowRight, UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AnalyticsSection } from "@/components/dashboard/analytics-section";
import { UserRole } from "@prisma/client";
import { getCached } from "@/lib/cache";

async function getDashboardStats() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return null;
    }

    const companyId = session.user.companyId;

    // Cache key for dashboard stats (cache for 30 seconds)
    const cacheKey = `dashboard:stats:${companyId}`;

    // Get orders statistics with caching
    return await getCached(
      cacheKey,
      async () => {
        return await fetchDashboardStats(companyId);
      },
      30 // 30 seconds cache
    );
  } catch (error) {
    const logger = await import("@/lib/logger").then(m => m.logger);
    logger.error("Error fetching dashboard stats", error, "dashboard");
    return null;
  }
}

async function fetchDashboardStats(companyId: number) {
  try {
    // Get orders statistics
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      recentOrders,
      topClients,
      actionRequiredOrders,
      pendingClients,
    ] = await Promise.all([
      // Total orders
      prisma.orders.count({ where: { companyId } }),
      
      // Processing orders - all orders that are not completed or cancelled (in development)
      prisma.orders.count({
        where: { 
          companyId, 
          status: { 
            notIn: ["COMPLETED", "CANCELLED"] 
          } 
        },
      }),
      
      // Completed orders
      prisma.orders.count({
        where: { companyId, status: "COMPLETED" },
      }),
      
      // Total revenue (from completed orders)
      prisma.orders.aggregate({
        where: { companyId, status: "COMPLETED", totalAmount: { not: null } },
        _sum: { totalAmount: true },
      }),
      
      // Recent orders (last 5)
      prisma.orders.findMany({
        where: { companyId },
        include: {
          clients: { select: { name: true, phone: true } },
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
      
      // Orders that need admin action
      prisma.orders.findMany({
        where: {
          companyId,
          OR: [
            // New orders pending review
            { status: "PENDING", stage: "RECEIVED" },
            // Quotations accepted by client (need PO)
            { 
              quotations: {
                some: {
                  accepted: true,
                }
              },
              purchase_orders: {
                none: {}
              }
            },
            // Deposit received (need to update stage)
            {
              depositPaid: true,
              stage: "AWAITING_DEPOSIT"
            },
            // Final payment received (need to close order)
            {
              finalPaymentReceived: true,
              status: { not: "COMPLETED" }
            },
          ]
        },
        include: {
          clients: { select: { name: true, phone: true } },
          quotations: true,
          purchase_orders: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // Pending client approvals
      prisma.clients.count({
        where: {
          hasAccount: true,
          accountStatus: "PENDING",
        },
      }),
    ]);

    // Get client names for top clients
    const topClientsWithNames = await Promise.all(
      topClients.map(async (client) => {
        const clientData = await prisma.clients.findUnique({
          where: { id: client.clientId! },
          select: { name: true, phone: true },
        });
        return {
          ...clientData,
          orderCount: client._count.id,
        };
      })
    );

    // This month's revenue
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthRevenue = await prisma.orders.aggregate({
      where: {
        companyId,
        status: "COMPLETED",
        totalAmount: { not: null },
        updatedAt: { gte: startOfMonth },
      },
      _sum: { totalAmount: true },
    });

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      monthRevenue: monthRevenue._sum.totalAmount || 0,
      recentOrders,
      topClients: topClientsWithNames,
      actionRequiredOrders,
      pendingClients,
    };
  } catch (error) {
    const logger = await import("@/lib/logger").then(m => m.logger);
    logger.error("Error in fetchDashboardStats", error, "dashboard");
    throw error; // Re-throw to be handled by outer catch
  }
}

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session || !session.user) {
    redirect("/login");
  }

  // Redirect team members to their dashboard
  if (session.user.role === UserRole.TECHNICIAN || session.user.role === UserRole.SUPERVISOR) {
    redirect("/team");
  }

  const stats = await getDashboardStats();

  if (!stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session.user.name}!
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Unable to load dashboard data.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back, <span className="font-semibold">{session.user.name}</span>!
        </p>
      </div>

      {/* Action Required Alert */}
      {stats.actionRequiredOrders.length > 0 && (
        <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Clock className="h-6 w-6 text-white animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-amber-900 dark:text-amber-100 mb-1">
                  ⚠️ Action Required ({stats.actionRequiredOrders.length})
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  These orders need your attention
                </p>
              </div>
            </div>
            
            {/* List of orders needing action */}
            <div className="space-y-2">
              {stats.actionRequiredOrders.map((order) => {
                // Determine what action is needed
                const isNewOrder = order.status === "PENDING" && order.stage === "RECEIVED";
                const needsPO = order.quotations.some((q: any) => q.accepted === true) && 
                               order.purchase_orders.length === 0;
                const depositReceived = order.depositPaid && order.stage === "AWAITING_DEPOSIT";
                const finalPaymentReceived = order.finalPaymentReceived && order.status !== "COMPLETED";
                
                let actionText = "";
                let actionButton = "";
                let actionHref = "";
                
                if (isNewOrder) {
                  actionText = "📋 New order - needs review and quotation";
                  actionButton = "Review Order";
                  actionHref = `/dashboard/orders/${order.id}`;
                } else if (needsPO) {
                  actionText = "✅ Quotation accepted - create Purchase Order";
                  actionButton = "Create PO";
                  actionHref = `/dashboard/orders/${order.id}`;
                } else if (depositReceived) {
                  actionText = "💰 Deposit received - update to manufacturing";
                  actionButton = "Update Status";
                  actionHref = `/dashboard/orders/${order.id}`;
                } else if (finalPaymentReceived) {
                  actionText = "✅ Final payment received - close order";
                  actionButton = "Complete Order";
                  actionHref = `/dashboard/orders/${order.id}`;
                }
                
                return (
                  <div 
                    key={order.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-amber-200 dark:border-amber-800 hover:shadow-md transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-amber-900 dark:text-amber-100">
                          Order #{order.id}
                        </p>
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          • {order.clients?.name}
                        </span>
                      </div>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        {actionText}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created: {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={actionHref}>
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-md"
                        >
                          {actionButton}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Quick Stats */}
            <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2 bg-white/60 dark:bg-gray-800/60 rounded">
                  <div className="text-lg font-bold text-amber-900 dark:text-amber-100">
                    {stats.actionRequiredOrders.filter(o => o.status === "PENDING").length}
                  </div>
                  <div className="text-xs text-amber-700 dark:text-amber-300">New Orders</div>
                </div>
                <div className="p-2 bg-white/60 dark:bg-gray-800/60 rounded">
                  <div className="text-lg font-bold text-amber-900 dark:text-amber-100">
                    {stats.actionRequiredOrders.filter(o => 
                      o.quotations.some((q: any) => q.accepted === true) && o.purchase_orders.length === 0
                    ).length}
                  </div>
                  <div className="text-xs text-amber-700 dark:text-amber-300">Need PO</div>
                </div>
                <div className="p-2 bg-white/60 dark:bg-gray-800/60 rounded">
                  <div className="text-lg font-bold text-amber-900 dark:text-amber-100">
                    {stats.actionRequiredOrders.filter(o => o.depositPaid && o.stage === "AWAITING_DEPOSIT").length}
                  </div>
                  <div className="text-xs text-amber-700 dark:text-amber-300">Deposits Paid</div>
                </div>
                <div className="p-2 bg-white/60 dark:bg-gray-800/60 rounded">
                  <div className="text-lg font-bold text-amber-900 dark:text-amber-100">
                    {stats.actionRequiredOrders.filter(o => o.finalPaymentReceived && o.status !== "COMPLETED").length}
                  </div>
                  <div className="text-xs text-amber-700 dark:text-amber-300">To Close</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Clients Alert - Admin Only */}
      {session.user.role === UserRole.ADMIN && stats.pendingClients > 0 && (
        <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <UserPlus className="h-6 w-6 text-white animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-blue-900 dark:text-blue-100 mb-1">
                  🔔 Pending Client Approvals ({stats.pendingClients})
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  New client accounts are waiting for your approval
                </p>
              </div>
            </div>
            
            <Link href="/dashboard/clients">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md">
                <Users className="mr-2 h-4 w-4" />
                Review Client Approvals
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Orders */}
        <Card className="border-2 border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
              {stats.totalOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All time orders
            </p>
          </CardContent>
        </Card>

        {/* Processing Orders */}
        <Card className="border-2 border-amber-200 dark:border-amber-900 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700 dark:text-amber-300">
              {stats.pendingOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              In development
            </p>
          </CardContent>
        </Card>

        {/* Completed Orders */}
        <Card className="border-2 border-green-200 dark:border-green-900 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-300">
              {stats.completedOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully delivered
            </p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="border-2 border-purple-200 dark:border-purple-900 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              AED {stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From completed orders
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Orders */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest 5 orders</CardDescription>
              </div>
              <Link href="/dashboard/orders">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No orders yet
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/dashboard/orders/${order.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          Order #{order.id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.clients?.name || "Unknown Client"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {order.totalAmount ? `AED ${order.totalAmount.toLocaleString()}` : "-"}
                        </p>
                        <p className={`text-xs ${
                          order.status === "COMPLETED" ? "text-green-600" :
                          order.status === "PENDING" ? "text-amber-600" :
                          "text-blue-600"
                        }`}>
                          {order.status}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Clients */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Top Clients</CardTitle>
            <CardDescription>By number of orders</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topClients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No client data yet
              </p>
            ) : (
              <div className="space-y-3">
                {stats.topClients.map((client, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {client.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{client.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{client.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {client.orderCount}
                      </p>
                      <p className="text-xs text-muted-foreground">orders</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Dashboard */}
      <AnalyticsSection />

      {/* This Month Performance */}
      <Card className="border-2 border-indigo-200 dark:border-indigo-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <CardTitle>This Month&apos;s Performance</CardTitle>
          </div>
          <CardDescription>Revenue and activity for current month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                AED {stats.monthRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Monthly Revenue</p>
            </div>
            <div className="h-16 w-px bg-border"></div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.completedOrders}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Orders Completed</p>
            </div>
            <div className="h-16 w-px bg-border"></div>
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {stats.pendingOrders}
              </p>
              <p className="text-sm text-muted-foreground mt-1">In Progress</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Link href="/dashboard/orders">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Package className="h-6 w-6" />
                View All Orders
              </Button>
            </Link>
            <Link href="/dashboard/notifications">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <Clock className="h-6 w-6" />
                Notifications
              </Button>
            </Link>
            <Link href="/dashboard/orders?processing=true">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <TrendingUp className="h-6 w-6" />
                Processing Orders
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
