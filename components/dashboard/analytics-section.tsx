"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsCharts } from "./analytics-charts";
import { Loader2 } from "lucide-react";

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

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard/analytics");
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || "Failed to load analytics");
      }
    } catch (err) {
      setError("Failed to load analytics");
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

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

