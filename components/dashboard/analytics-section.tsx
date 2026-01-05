"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsCharts } from "./analytics-charts";
import { Loader2 } from "lucide-react";
import { deduplicateRequest } from "@/lib/utils/request-deduplication";
import { useSession } from "next-auth/react";

interface AnalyticsData {
  revenueData: Array<{ month: string; revenue: number }>;
  ordersData: Array<{ status: string; count: number }>;
  topClients: Array<{ name: string; orders: number; revenue: number }>;
  conversionRate: number;
}

export function AnalyticsSection() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: session } = useSession();

  // ✅ Performance: Memoize fetchAnalytics and add deduplication
  const fetchAnalytics = useCallback(async () => {
    if (!session?.user) return;
    
    // ✅ Performance: Deduplicate requests within 2 seconds window
    const userId = session.user.id || 0;
    const deduplicationKey = `analytics:${userId}`;
    
    return deduplicateRequest(
      deduplicationKey,
      async () => {
        try {
          setLoading(true);
          const response = await fetch("/api/dashboard/analytics", {
            credentials: "include", // ✅ Critical: Include credentials for authentication
          });
          const result = await response.json();

          if (result.success) {
            setData(result.data);
          } else {
            setError(result.error || "Failed to load analytics");
          }
          return result;
        } catch (err) {
          setError("Failed to load analytics");
          console.error("Error fetching analytics:", err);
          return { success: false, error: "Failed to load analytics" };
        } finally {
          setLoading(false);
        }
      },
      2000 // ✅ Deduplication window: 2 seconds
    );
  }, [session?.user]);

  useEffect(() => {
    if (session?.user) {
      fetchAnalytics();
    }
  }, [fetchAnalytics, session?.user]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center py-12">
            {error || "Unable to load analytics data"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-purple-200 dark:border-purple-900">
      <CardHeader>
        <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          📊 Analytics Dashboard (Last 3 Months)
        </CardTitle>
        <CardDescription>
          Comprehensive analytics and insights for your business
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AnalyticsCharts
          revenueData={data.revenueData}
          ordersData={data.ordersData}
          topClients={data.topClients}
          conversionRate={data.conversionRate}
        />
      </CardContent>
    </Card>
  );
}

