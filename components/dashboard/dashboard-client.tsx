"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, DollarSign, Clock, CheckCircle, TrendingUp, Users, ArrowRight, UserPlus, Building2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserRole } from "@prisma/client";
import { AnalyticsSection } from "@/components/dashboard/analytics-section";
import { useQuery } from "@tanstack/react-query";
import { DashboardSkeleton } from "@/components/loading-skeletons/dashboard-skeleton";

interface DashboardSummary {
  stats: {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
    monthRevenue: number;
  };
  recentOrders: Array<{
    id: number;
    status: string;
    totalAmount: number | null;
    createdAt: string;
    clientName: string;
    clientPhone: string;
  }>;
  topClients: Array<{
    name: string;
    phone: string;
    orderCount: number;
  }>;
  actionRequiredOrders: Array<{
    id: number;
    status: string;
    stage: string;
    depositPaid: boolean;
    finalPaymentReceived: boolean;
    createdAt: string;
    clientName: string;
    clientPhone: string;
    needsPO: boolean;
  }>;
  pendingClients: number;
}

/**
 * ✅ Performance: Client Component for Dashboard
 * 
 * Benefits:
 * - No Server Component re-execution on navigation
 * - Single API call via aggregated endpoint
 * - Client-side state management
 * - React Query caching
 */
export function DashboardClient() {
  const { data: session, status } = useSession();
  const [translations, setTranslations] = useState<Record<string, string>>({});

  // ✅ Performance: Single aggregated API call
  const { data, isLoading, error } = useQuery<{ success: boolean; data: DashboardSummary }>({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/summary", {
        // ✅ Performance: Explicit cache control
        cache: "force-cache",
        next: { revalidate: 120 }, // 2 minutes
        credentials: "include", // ✅ Critical: Include credentials for authentication
      });
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: status === "authenticated",
  });

  // Load translations once
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const lang = localStorage.getItem("ata-crm-language") || "en";
        const translationsModule = await import(`@/lib/i18n/translations/${lang}.json`);
        // Flatten nested translations object
        const flatten = (obj: any, prefix = ""): Record<string, string> => {
          const result: Record<string, string> = {};
          for (const key in obj) {
            const value = obj[key];
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (typeof value === "object" && value !== null) {
              Object.assign(result, flatten(value, newKey));
            } else {
              result[newKey] = value;
            }
          }
          return result;
        };
        setTranslations(flatten(translationsModule.default));
      } catch (e) {
        // Fallback to English
        const translationsModule = await import(`@/lib/i18n/translations/en.json`);
        const flatten = (obj: any, prefix = ""): Record<string, string> => {
          const result: Record<string, string> = {};
          for (const key in obj) {
            const value = obj[key];
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (typeof value === "object" && value !== null) {
              Object.assign(result, flatten(value, newKey));
            } else {
              result[newKey] = value;
            }
          }
          return result;
        };
        setTranslations(flatten(translationsModule.default));
      }
    };
    loadTranslations();
  }, []);

  if (status === "loading" || isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !data?.success || !data?.data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session?.user?.name}!
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

  const stats = data.data.stats;
  const t = (key: string) => translations[key] || key;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {t("dashboard.title") || "Dashboard"}
        </h1>
        <p className="text-muted-foreground">
          {t("dashboard.welcomeBack") || "Welcome back"}, <span className="font-semibold">{session?.user?.name}</span>!
        </p>
      </div>

      {/* Action Required Alert */}
      {data.data.actionRequiredOrders.length > 0 && (
        <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Clock className="h-6 w-6 text-white animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-amber-900 dark:text-amber-100 mb-1">
                  ⚠️ {t("dashboard.actionRequired") || "Action Required"} ({data.data.actionRequiredOrders.length})
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {t("dashboard.theseOrdersNeedAttention") || "These orders need your attention"}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              {data.data.actionRequiredOrders.map((order) => {
                const isNewOrder = order.status === "PENDING" && order.stage === "RECEIVED";
                const needsPO = order.needsPO;
                const depositReceived = order.depositPaid && order.stage === "AWAITING_DEPOSIT";
                const finalPaymentReceived = order.finalPaymentReceived && order.status !== "COMPLETED";
                
                let actionText = "";
                let actionButton = "";
                
                if (isNewOrder) {
                  actionText = `📋 ${t("dashboard.newOrder") || "New Order"}`;
                  actionButton = t("dashboard.reviewOrder") || "Review Order";
                } else if (needsPO) {
                  actionText = `✅ ${t("dashboard.quotationAccepted") || "Quotation Accepted"}`;
                  actionButton = t("dashboard.createPO") || "Create PO";
                } else if (depositReceived) {
                  actionText = `💰 ${t("dashboard.depositReceived") || "Deposit Received"}`;
                  actionButton = t("dashboard.updateStage") || "Update Stage";
                } else if (finalPaymentReceived) {
                  actionText = `✅ ${t("dashboard.finalPaymentReceived") || "Final Payment Received"}`;
                  actionButton = t("dashboard.completeOrder") || "Complete Order";
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
                          • {order.clientName}
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
                      <Link href={`/dashboard/orders/${order.id}`}>
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
          </CardContent>
        </Card>
      )}

      {/* Pending Clients Alert */}
      {session?.user?.role === UserRole.ADMIN && data.data.pendingClients > 0 && (
        <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <UserPlus className="h-6 w-6 text-white animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-blue-900 dark:text-blue-100 mb-1">
                  🔔 Pending Client Approvals ({data.data.pendingClients})
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
        <Card className="border-2 border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.totalOrders") || "Total Orders"}</CardTitle>
            <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
              {stats.totalOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time orders</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200 dark:border-amber-900 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.pendingOrders") || "Pending Orders"}</CardTitle>
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700 dark:text-amber-300">
              {stats.pendingOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">In development</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 dark:border-green-900 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.completedOrders") || "Completed Orders"}</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-300">
              {stats.completedOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Successfully delivered</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 dark:border-purple-900 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.totalRevenue") || "Total Revenue"}</CardTitle>
            <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              AED {stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From completed orders</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Orders */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("dashboard.recentOrders") || "Recent Orders"}</CardTitle>
                <CardDescription>Latest 5 orders</CardDescription>
              </div>
              <Link href="/dashboard/orders">
                <Button variant="ghost" size="sm">{t("dashboard.viewAll") || "View All"}</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.data.recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {data.data.recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/dashboard/orders/${order.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-sm">Order #{order.id}</p>
                        <p className="text-xs text-muted-foreground">{order.clientName}</p>
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
            <CardTitle>{t("dashboard.topClients") || "Top Clients"}</CardTitle>
            <CardDescription>By number of orders</CardDescription>
          </CardHeader>
          <CardContent>
            {data.data.topClients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No client data yet</p>
            ) : (
              <div className="space-y-3">
                {data.data.topClients.map((client, index) => (
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
      <Suspense fallback={<div className="h-64 animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg" />}>
        <AnalyticsSection />
      </Suspense>

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
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
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
            {session?.user?.role === "ADMIN" && (
              <Link href="/dashboard/company-knowledge">
                <Button variant="outline" className="w-full h-20 flex-col gap-2">
                  <Building2 className="h-6 w-6" />
                  Company Knowledge
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

