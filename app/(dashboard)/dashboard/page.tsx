import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, DollarSign, Clock, CheckCircle, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

async function getDashboardStats() {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return null;
    }

    const companyId = session.user.companyId;

    // Get orders statistics
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      recentOrders,
      topClients,
    ] = await Promise.all([
      // Total orders
      prisma.orders.count({ where: { companyId } }),
      
      // Pending orders
      prisma.orders.count({
        where: { companyId, status: { in: ["PENDING", "APPROVED"] } },
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
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return null;
  }
}

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session || !session.user) {
    redirect("/login");
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

        {/* Pending Orders */}
        <Card className="border-2 border-amber-200 dark:border-amber-900 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700 dark:text-amber-300">
              {stats.pendingOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting action
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
            <Link href="/dashboard/orders?status=PENDING">
              <Button variant="outline" className="w-full h-20 flex-col gap-2">
                <TrendingUp className="h-6 w-6" />
                Pending Orders
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
