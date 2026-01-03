"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Package, FileDown, Loader2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Link } from "@/components/ui/link";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

// Dynamic imports for heavy components (code splitting)
const OrderDetailsTabs = dynamic(() => import("@/components/dashboard/order-details-tabs").then(mod => ({ default: mod.OrderDetailsTabs })), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-800 h-64 rounded-lg" />,
  ssr: false,
});

const UpdateStage = dynamic(() => import("@/components/dashboard/update-stage").then(mod => ({ default: mod.UpdateStage })), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-800 h-32 rounded-lg" />,
  ssr: false,
});

const OrderActions = dynamic(() => import("@/components/dashboard/order-actions").then(mod => ({ default: mod.OrderActions })), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-800 h-16 rounded-lg" />,
  ssr: false,
});

/**
 * ✅ Performance: Client Component for Order Details
 * 
 * Prevents Server Component re-execution on navigation
 * Uses React Query for caching and deduplication
 */
export function OrderDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const orderId = params?.id as string;

  // ✅ Performance: Use React Query for automatic caching and deduplication
  const { data: order, isLoading, error } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push("/login");
          throw new Error("UNAUTHORIZED");
        }
        if (response.status === 404) {
          throw new Error("NOT_FOUND");
        }
        throw new Error("Failed to fetch order");
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch order");
      }
      return result.data;
    },
    enabled: !!orderId && sessionStatus === "authenticated",
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [sessionStatus, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return (
        <div className="container mx-auto px-4 py-8">
          <Card className="border-red-200 dark:border-red-900">
            <CardContent className="pt-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
              <p className="text-sm text-muted-foreground mb-4">The order you are looking for does not exist.</p>
              <Link href="/dashboard/orders" prefetch={false}>
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Orders
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      );
    }
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="pt-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Error loading order</h3>
            <p className="text-sm text-muted-foreground mb-4">{error instanceof Error ? error.message : "Unknown error"}</p>
            <Link href="/dashboard/orders" prefetch={false}>
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Orders
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/orders" prefetch={false}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Order #{order.id}</h1>
            <p className="text-muted-foreground">
              Created on {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              order.status === "PENDING" ? "secondary" :
              order.status === "APPROVED" ? "default" :
              order.status === "REJECTED" ? "destructive" :
              order.status === "QUOTATION_SENT" ? "outline" :
              order.status === "COMPLETED" ? "default" :
              "secondary"
            }
            className={
              order.status === "COMPLETED" ? "bg-green-600 text-white" :
              order.status === "PENDING" ? "bg-amber-500 text-white" :
              order.status === "APPROVED" ? "bg-blue-600 text-white" :
              order.status === "QUOTATION_SENT" ? "bg-purple-600 text-white" :
              ""
            }
          >
            {order.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      {/* Main Layout: Tabs (3/4) + Sidebar (1/4) */}
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <OrderDetailsTabs order={order} />
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Update Stage */}
          <UpdateStage orderId={order.id} currentStage={order.stage || "RECEIVED"} />
          
          {/* Quick Actions */}
          <Card className="border-2">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <OrderActions 
                orderId={order.id} 
                currentStatus={order.status}
                publicToken={order.publicToken}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

