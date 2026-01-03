"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/components/ui/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, CheckCircle, XCircle, Clock, FileText, Truck, TrendingUp, DollarSign } from "lucide-react";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { ClientNavbar } from "@/components/client/client-navbar";
import { useToast } from "@/hooks/use-toast";
import { useClientOrders } from "@/lib/hooks/use-client-orders";
import { useQueryClient } from "@tanstack/react-query";

export default function ClientPortalPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [viewedActionItems, setViewedActionItems] = useState<Set<string>>(new Set());

  // ✅ Performance: Use React Query for automatic caching and deduplication
  const { data: ordersData, isLoading, error: queryError, refetch } = useClientOrders();

  const orders = ordersData?.orders || [];
  const clientName = orders.length > 0 && orders[0].clients ? orders[0].clients.name : "";
  const clientEmail = orders.length > 0 && orders[0].clients ? orders[0].clients.email : "";
  const error = queryError instanceof Error ? queryError.message : "";

  useEffect(() => {
    // Load viewed action items from localStorage
    const stored = localStorage.getItem("client_viewed_action_items");
    if (stored) {
      try {
        setViewedActionItems(new Set(JSON.parse(stored)));
      } catch (e) {
        console.error("Error loading viewed items:", e);
      }
    }
    
    // Check for success message and show it
    const urlParams = new URLSearchParams(window.location.search);
    const successType = urlParams.get("success");
    
    if (successType === "order-created") {
      toast({
        title: "✅ Order created successfully!",
        description: "We will review your request and send a quotation soon.",
        className: "bg-green-50 border-green-200",
      });
      window.history.replaceState({}, "", "/client/portal");
      // ✅ Performance: Invalidate query to refetch updated data
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["clientOrders"] });
      }, 500);
    } else if (successType === "accepted") {
      toast({
        title: "✅ Quotation accepted",
        description: "We will start processing your order.",
        className: "bg-green-50 border-green-200",
      });
      window.history.replaceState({}, "", "/client/portal");
      queryClient.invalidateQueries({ queryKey: ["clientOrders"] });
    } else if (successType === "rejected") {
      toast({
        title: "Quotation rejected",
        description: "We will work on improving the offer.",
      });
      window.history.replaceState({}, "", "/client/portal");
      queryClient.invalidateQueries({ queryKey: ["clientOrders"] });
    }
  }, [toast, queryClient]);

  // Handle authentication errors
  useEffect(() => {
    if (error === "UNAUTHORIZED") {
      router.push("/client/login");
    }
  }, [error, router]);

  // Save viewed items to localStorage whenever it changes
  useEffect(() => {
    if (viewedActionItems.size > 0) {
      localStorage.setItem("client_viewed_action_items", JSON.stringify(Array.from(viewedActionItems)));
    }
  }, [viewedActionItems]);

  const markActionItemAsViewed = (orderId: number, actionType: "quotation" | "payment" | "delivery") => {
    const key = `${orderId}_${actionType}`;
    setViewedActionItems((prev) => {
      const newSet = new Set(prev);
      newSet.add(key);
      return newSet;
    });
  };


  const handleLogout = async () => {
    await fetch("/api/client/logout", { method: "POST" });
    router.push("/client/login");
  };

  const getStatusColor = (status: string) => {
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
      default:
        return "secondary";
    }
  };

  // Calculate statistics - filter out viewed action items
  const stats = {
    total: orders.length,
    pending: orders.filter(o => 
      o.status === "PENDING" || 
      o.status === "QUOTATION_SENT" ||
      (o.status === "APPROVED" && o.stage !== "COMPLETED_DELIVERED")
    ).length,
    active: orders.filter(o => 
      o.status === "APPROVED" && 
      o.stage !== "COMPLETED_DELIVERED" &&
      o.stage !== "FINAL_PAYMENT_RECEIVED"
    ).length,
    completed: orders.filter(o => 
      o.status === "COMPLETED" || 
      o.stage === "COMPLETED_DELIVERED"
    ).length,
    totalValue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    // Needs action: quotation review, unpaid deposit, or delivery note with final payment due (excluding viewed items)
    needsAction: orders.filter(o => {
      const hasQuotation = o.quotations?.some((q: any) => q.accepted === null && q.file);
      const needsPayment = o.depositPercentage && !o.depositPaid;
      const hasDeliveryNote = o.delivery_notes && o.delivery_notes.length > 0;
      const needsFinalPayment = hasDeliveryNote && !o.finalPaymentReceived;
      
      const quotationViewed = hasQuotation && viewedActionItems.has(`${o.id}_quotation`);
      const paymentViewed = needsPayment && viewedActionItems.has(`${o.id}_payment`);
      const deliveryViewed = needsFinalPayment && viewedActionItems.has(`${o.id}_delivery`);
      
      // Show if there's action needed AND not viewed
      return (hasQuotation && !quotationViewed) || (needsPayment && !paymentViewed) || (needsFinalPayment && !deliveryViewed);
    }).length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && error !== "UNAUTHORIZED") {
    return (
      <div className="container mx-auto px-4 py-8">
        <ClientNavbar clientName={clientName || "Client"} clientEmail={clientEmail} />
        <Card className="mt-8 border-red-200 dark:border-red-900">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error loading your orders</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 relative">
      {/* Navbar */}
      <ClientNavbar clientName={clientName || "Client"} clientEmail={clientEmail} />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {clientName ? clientName.split(' ')[0] : "Client"}! 👋
          </h1>
          <p className="text-muted-foreground">
            Track and manage your purchase orders
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Statistics Cards */}
        {orders.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {/* Total Orders */}
            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">Total Orders</CardDescription>
                <CardTitle className="text-3xl font-bold text-blue-600">{stats.total}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Package className="h-4 w-4 mr-1" />
                  All time
                </div>
              </CardContent>
            </Card>

            {/* Pending/In Review */}
            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">In Progress</CardDescription>
                <CardTitle className="text-3xl font-bold text-amber-600">{stats.pending}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  Being processed
                </div>
              </CardContent>
            </Card>

            {/* Completed */}
            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">Completed</CardDescription>
                <CardTitle className="text-3xl font-bold text-green-600">{stats.completed}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-xs text-muted-foreground">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Delivered
                </div>
              </CardContent>
            </Card>

            {/* Total Value */}
            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">Total Value</CardDescription>
                <CardTitle className="text-2xl font-bold text-purple-600">
                  {formatCurrency(stats.totalValue, "AED")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-xs text-muted-foreground">
                  <DollarSign className="h-4 w-4 mr-1" />
                  All orders
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Required Alert */}
        {stats.needsAction > 0 && (
          <Card className="mb-6 border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-6 w-6 text-white animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    ⚠️ Action Required ({stats.needsAction})
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    You have quotations to review or payments to make
                  </p>
                </div>
              </div>
              
              {/* List of orders needing action */}
              <div className="space-y-2">
                {orders
                  .filter(o => {
                    const hasQuotation = o.quotations?.some((q: any) => q.accepted === null && q.file);
                    const needsPayment = o.depositPercentage && !o.depositPaid;
                    const hasDeliveryNote = o.delivery_notes && o.delivery_notes.length > 0;
                    const needsFinalPayment = hasDeliveryNote && !o.finalPaymentReceived;
                    
                    const quotationViewed = hasQuotation && viewedActionItems.has(`${o.id}_quotation`);
                    const paymentViewed = needsPayment && viewedActionItems.has(`${o.id}_payment`);
                    const deliveryViewed = needsFinalPayment && viewedActionItems.has(`${o.id}_delivery`);
                    
                    // Show if there's action needed AND not viewed
                    return (hasQuotation && !quotationViewed) || (needsPayment && !paymentViewed) || (needsFinalPayment && !deliveryViewed);
                  })
                  .map((order) => {
                    const hasQuotation = order.quotations?.some((q: any) => q.accepted === null && q.file);
                    const needsPayment = order.depositPercentage && !order.depositPaid;
                    const hasDeliveryNote = order.delivery_notes && order.delivery_notes.length > 0;
                    const needsFinalPayment = hasDeliveryNote && !order.finalPaymentReceived;
                    const quotation = hasQuotation ? order.quotations.find((q: any) => q.accepted === null && q.file) : null;
                    const quotationViewed = hasQuotation && viewedActionItems.has(`${order.id}_quotation`);
                    const paymentViewed = needsPayment && viewedActionItems.has(`${order.id}_payment`);
                    const deliveryViewed = needsFinalPayment && viewedActionItems.has(`${order.id}_delivery`);
                    
                    // Build action text
                    const actionTexts: string[] = [];
                    if (hasQuotation && !quotationViewed) actionTexts.push("📋 Quotation needs review");
                    if (needsPayment && !paymentViewed) actionTexts.push("💰 Deposit payment required");
                    if (needsFinalPayment && !deliveryViewed) actionTexts.push("🚚 Delivery Note - Final payment required");
                    
                    return (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-amber-900 dark:text-amber-100">
                            Order #{order.id}
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            {actionTexts.join(" • ")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {hasQuotation && quotation && !quotationViewed && (
                            <Link 
                              href={`/client/quotation/${quotation.id}/review`}
                              onClick={() => markActionItemAsViewed(order.id, "quotation")}
                            >
                              <Button size="sm" variant="default" className="bg-amber-600 hover:bg-amber-700">
                                Review Quote
                              </Button>
                            </Link>
                          )}
                          {needsPayment && !paymentViewed && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-amber-500 text-amber-700 hover:bg-amber-100"
                              onClick={() => {
                                markActionItemAsViewed(order.id, "payment");
                                router.push(`/order/track/${order.publicToken}`);
                              }}
                            >
                              View PO
                            </Button>
                          )}
                          {needsFinalPayment && !deliveryViewed && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-amber-500 text-amber-700 hover:bg-amber-100"
                              onClick={() => {
                                markActionItemAsViewed(order.id, "delivery");
                                router.push(`/order/track/${order.publicToken}`);
                              }}
                            >
                              View Delivery Note
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders Section Title */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Orders</h2>
          <Link href="/client/portal/create">
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Package className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </Link>
        </div>

        {/* Orders Grid */}
        {orders.length === 0 ? (
          <Card className="border-2">
            <CardContent className="py-16 text-center">
              <div className="mb-6 flex justify-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                  <Package className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">No Orders Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start by creating your first order. We&apos;ll review it and send you a quotation.
              </p>
              <Link href="/client/portal/create">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Package className="mr-2 h-5 w-5" />
                  Create Your First Order
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-xl transition-all hover:scale-[1.02] border-2 overflow-hidden group">
                {/* Colored Top Border based on status */}
                <div className={`h-1 ${
                  order.status === "COMPLETED" ? "bg-gradient-to-r from-green-500 to-emerald-500" :
                  order.status === "APPROVED" ? "bg-gradient-to-r from-blue-500 to-indigo-500" :
                  order.status === "PENDING" ? "bg-gradient-to-r from-amber-500 to-orange-500" :
                  "bg-gradient-to-r from-gray-400 to-gray-500"
                }`} />
                
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <CardTitle className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        Order #{order.id}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {formatDateTime(order.createdAt)}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(order.status)} className="text-xs">
                      {order.status.replace(/_/g, " ")}
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  {order.stage && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          Progress
                        </span>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          {Math.round((
                            ["RECEIVED", "UNDER_REVIEW", "QUOTATION_PREPARATION", "QUOTATION_SENT", "QUOTATION_ACCEPTED", "PO_PREPARED", "AWAITING_DEPOSIT", "DEPOSIT_RECEIVED", "IN_MANUFACTURING", "MANUFACTURING_COMPLETE", "READY_FOR_DELIVERY", "DELIVERY_NOTE_SENT", "AWAITING_FINAL_PAYMENT", "FINAL_PAYMENT_RECEIVED", "COMPLETED_DELIVERED"].indexOf(order.stage) + 1
                          ) / 15 * 100)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full transition-all duration-700"
                          style={{ width: `${(["RECEIVED", "UNDER_REVIEW", "QUOTATION_PREPARATION", "QUOTATION_SENT", "QUOTATION_ACCEPTED", "PO_PREPARED", "AWAITING_DEPOSIT", "DEPOSIT_RECEIVED", "IN_MANUFACTURING", "MANUFACTURING_COMPLETE", "READY_FOR_DELIVERY", "DELIVERY_NOTE_SENT", "AWAITING_FINAL_PAYMENT", "FINAL_PAYMENT_RECEIVED", "COMPLETED_DELIVERED"].indexOf(order.stage) + 1) / 15 * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Items */}
                  {order.items && Array.isArray(order.items) && order.items.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-2 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-blue-900 dark:text-blue-100">
                          {order.items.length} item{order.items.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2">
                    {order.quotations && order.quotations.length > 0 && order.quotations.some((q: any) => q.accepted === true) && (
                      <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Quote Accepted
                      </Badge>
                    )}
                    
                    {order.quotations && order.quotations.some((q: any) => q.accepted === null && q.file) && (
                      <Badge variant="outline" className="bg-amber-50 border-amber-300 text-amber-700 text-xs animate-pulse">
                        <Clock className="h-3 w-3 mr-1" />
                        Review Needed
                      </Badge>
                    )}

                    {order.purchase_orders && order.purchase_orders.length > 0 && (
                      <Badge variant="outline" className="bg-blue-50 border-blue-300 text-blue-700 text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        PO Ready
                      </Badge>
                    )}

                    {order.delivery_notes && order.delivery_notes.length > 0 && (
                      <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700 text-xs">
                        <Truck className="h-3 w-3 mr-1" />
                        Delivered
                      </Badge>
                    )}
                  </div>

                  {/* Payment Alert */}
                  {order.depositPercentage && !order.depositPaid && (
                    <div className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-lg">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        💰 Deposit Payment Due
                      </p>
                    </div>
                  )}

                  {/* Total Amount */}
                  {order.totalAmount && (
                    <div className="pt-2 border-t flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">Total:</span>
                      <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {formatCurrency(order.totalAmount, order.currency)}
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Link href={`/order/track/${order.publicToken}`} className="flex-1">
                      <Button variant="default" className="w-full group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all" size="sm">
                        View Details
                      </Button>
                    </Link>
                    {order.quotations && order.quotations.some((q: any) => q.accepted === null && q.file) && (
                      <Link href={`/client/quotation/${order.quotations.find((q: any) => q.accepted === null).id}/review`}>
                        <Button variant="outline" size="sm" className="border-amber-500 text-amber-700 hover:bg-amber-50">
                          Review Now
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
    </>
  );
}

