"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, ArrowRight, TrendingUp, User, FileDown, Package, Clock, CheckCircle, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { OrderFilters } from "@/components/dashboard/order-filters";
import { useQuery } from "@tanstack/react-query";
import { OrdersSkeleton } from "@/components/loading-skeletons/orders-skeleton";
import { useSession } from "next-auth/react";

interface Order {
  id: number;
  status: string;
  stage: string;
  totalAmount: number | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
  clients: {
    name: string;
    phone: string;
    email: string;
  };
  _count: {
    quotations: number;
    purchase_orders: number;
    delivery_notes: number;
  };
}

interface OrdersResponse {
  success: boolean;
  data: {
    orders: Order[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * ✅ Performance: Client Component for Orders Page
 * 
 * Benefits:
 * - No Server Component re-execution on navigation
 * - Single API call via /api/orders
 * - React Query caching
 * - Client-side filtering and pagination
 */
export function OrdersClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  
  // Get filters from URL
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status") || undefined;
  const processing = searchParams.get("processing") || undefined;
  const search = searchParams.get("search") || undefined;

  // ✅ Performance: Single API call with React Query caching
  const { data, isLoading, error, refetch, isFetching } = useQuery<OrdersResponse>({
    queryKey: ["orders", { page, limit, status, processing, search }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (page > 1) params.set("page", page.toString());
      if (limit !== 20) params.set("limit", limit.toString());
      if (status) params.set("status", status);
      if (processing) params.set("processing", processing);
      if (search) params.set("search", search);

      const response = await fetch(`/api/orders?${params.toString()}`, {
        // ✅ Performance: Explicit cache control
        cache: "force-cache",
        next: { revalidate: 120 }, // 2 minutes
        credentials: "include", // ✅ Critical: Include credentials for authentication
      });
      
      if (!response.ok) {
        // ✅ Better error handling with status codes
        let errorData: any = {};
        try {
          const text = await response.text();
          errorData = text ? JSON.parse(text) : {};
        } catch {
          // If JSON parsing fails, use default error
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        const errorMessage = errorData.error || `Failed to fetch orders (${response.status})`;
        
        // If unauthorized, redirect to login
        if (response.status === 401 || response.status === 403) {
          // Clear any cached data
          if (typeof window !== "undefined") {
            sessionStorage.clear();
          }
          window.location.href = "/login";
          throw new Error("Session expired. Redirecting to login...");
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      // ✅ Validate response structure
      if (!result || typeof result !== "object") {
        throw new Error("Invalid response format: Expected JSON object");
      }
      
      if (!result.success) {
        throw new Error(result.error || "Request failed");
      }
      
      if (!result.data) {
        throw new Error("Invalid response: Missing data field");
      }
      
      return result;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // ✅ Don't retry on authentication errors
      if (error instanceof Error && error.message.includes("Session expired")) {
        return false;
      }
      // ✅ Retry up to 3 times for other errors (increased from 2)
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Exponential backoff
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: true, // ✅ Refetch when connection is restored
    // ✅ Fix: Only fetch when authenticated AND session is ready (not loading)
    enabled: sessionStatus === "authenticated" && !!session?.user,
    // ✅ Fix: Retry when session becomes available
    refetchOnMount: true, // Refetch when component mounts (if session is ready)
  });

  // ✅ Fix: Auto-retry when session becomes authenticated
  useEffect(() => {
    // Only retry if:
    // 1. Session is authenticated
    // 2. Session user exists
    // 3. Query is not currently loading/fetching
    // 4. Either there's an error OR no data and query is not enabled
    if (
      sessionStatus === "authenticated" && 
      session?.user && 
      !isLoading && 
      !isFetching &&
      (error || (!data && !isLoading))
    ) {
      // Session is ready but query failed or hasn't run - retry after small delay
      const timer = setTimeout(() => {
        refetch();
      }, 200); // Small delay to ensure session is fully ready
      return () => clearTimeout(timer);
    }
  }, [sessionStatus, session?.user, error, data, isLoading, isFetching, refetch]);

  // Memoize stats calculations
  const stats = useMemo(() => {
    if (!data?.data?.orders) return null;
    
    const orders = data.data.orders;
    return {
      total: orders.length,
      pending: orders.filter((o: Order) => o.status === "PENDING").length,
      approved: orders.filter((o: Order) => o.status === "APPROVED").length,
      quotationSent: orders.filter((o: Order) => o.status === "QUOTATION_SENT").length,
      completed: orders.filter((o: Order) => o.status === "COMPLETED").length,
    };
  }, [data?.data?.orders]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PENDING":
        return "secondary";
      case "APPROVED":
        return "default";
      case "REJECTED":
        return "destructive";
      case "QUOTATION_SENT":
        return "outline";
      case "COMPLETED":
        return "default";
      case "CANCELLED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // ✅ Fix: Handle unauthenticated state with useEffect (must be at top level)
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      // Small delay to avoid race condition
      const timer = setTimeout(() => {
        router.push("/login");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [sessionStatus, router]);

  // ✅ Fix: Show loading if session is loading or query is loading/fetching
  if (sessionStatus === "loading" || isLoading || isFetching) {
    return <OrdersSkeleton />;
  }

  // ✅ Fix: Show loading if unauthenticated (will redirect via useEffect)
  if (sessionStatus === "unauthenticated") {
    return <OrdersSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-red-200 dark:border-red-900">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Package className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Unable to load orders</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                {error instanceof Error ? error.message : "An error occurred while loading orders"}
              </p>
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data?.success || !data?.data) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No orders data available.</p>
              <Button onClick={() => refetch()} variant="outline">
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const orders = data.data.orders;
  const pagination = data.data.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Orders Management
        </h1>
        <p className="text-muted-foreground">
          View and manage all purchase orders from clients
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="border-2 border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                    {pagination.total}
                  </p>
                </div>
                <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-200 dark:border-amber-900 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                    {stats.pending}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-indigo-200 dark:border-indigo-900 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Approved</p>
                  <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">
                    {stats.approved}
                  </p>
                </div>
                <User className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 dark:border-purple-900 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Quotation Sent</p>
                  <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                    {stats.quotationSent}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 dark:border-green-900 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                    {stats.completed}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-2">
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            View and manage purchase orders from clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6">
            <OrderFilters />
          </div>

          {/* Orders Table */}
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.clients.name}</p>
                            <p className="text-xs text-muted-foreground">{order.clients.phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(order.status)}>
                            {order.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.stage.replace(/_/g, " ")}</Badge>
                        </TableCell>
                        <TableCell>
                          {order.totalAmount
                            ? `${order.currency || "AED"} ${order.totalAmount.toLocaleString()}`
                            : "-"}
                        </TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell>
                          <Link href={`/dashboard/orders/${order.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} orders
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set("page", (pagination.page - 1).toString());
                        router.push(`/dashboard/orders?${params.toString()}`);
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set("page", (pagination.page + 1).toString());
                        router.push(`/dashboard/orders?${params.toString()}`);
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

