"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Download, CheckCircle, XCircle, Clock, LogOut, FileText, Truck } from "lucide-react";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { OrderProgressTrackerCompact } from "@/components/order-progress-tracker-compact";

export default function ClientPortalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrders();
    
    // Check for success message and show it
    const urlParams = new URLSearchParams(window.location.search);
    const successType = urlParams.get("success");
    
    if (successType === "order-created") {
      // Show success message
      const successMsg = document.getElementById("success-message");
      if (successMsg) {
        successMsg.classList.remove("hidden");
        setTimeout(() => successMsg.classList.add("hidden"), 5000);
      }
      
      // Small delay to ensure order is in DB, then refresh
      setTimeout(() => {
        fetchOrders();
      }, 500);
      
      // Remove query param
      window.history.replaceState({}, "", "/client/portal");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/client/orders");
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/client/login");
          return;
        }
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data.data.orders || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Orders</h1>
            <p className="text-muted-foreground">
              Track and manage your purchase orders
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/">
              <Button variant="ghost">
                Home
              </Button>
            </Link>
            <div className="flex gap-2">
              <Link href="/client/portal/create">
                <Button variant="default">
                  <Package className="mr-2 h-4 w-4" />
                  New Order
                </Button>
              </Link>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Success Message */}
        <div id="success-message" className="hidden mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-sm text-green-600 dark:text-green-400">
            ✅ Order created successfully! It will appear below.
          </p>
        </div>

        {/* Orders Grid */}
        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven&apos;t placed any orders yet
              </p>
              <Link href="/order/new">
                <Button>
                  <Package className="mr-2 h-4 w-4" />
                  Create Your First Order
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-xl transition-all hover:scale-[1.02] border-2">
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
                      {order.status}
                    </Badge>
                  </div>

                  {/* Compact Progress Bar */}
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
                  {/* Quick Info */}
                  <div className="space-y-2">
                    {/* Items Count */}
                    {order.items && Array.isArray(order.items) && order.items.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-muted-foreground">
                          {order.items.length} item{order.items.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    {/* Status Indicators */}
                    <div className="flex flex-wrap gap-2">
                      {/* Quotation Status */}
                      {order.quotations && order.quotations.length > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          {order.quotations.some((q: any) => q.accepted === true) ? (
                            <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Quote OK
                            </Badge>
                          ) : order.quotations.some((q: any) => q.accepted === null) ? (
                            <Badge variant="outline" className="bg-amber-50 border-amber-300 text-amber-700 text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Review
                            </Badge>
                          ) : null}
                        </div>
                      )}

                      {/* PO Status */}
                      {order.purchase_orders && order.purchase_orders.length > 0 && (
                        <Badge variant="outline" className="bg-blue-50 border-blue-300 text-blue-700 text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          PO Ready
                        </Badge>
                      )}

                      {/* Delivery Status */}
                      {order.delivery_notes && order.delivery_notes.length > 0 && (
                        <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700 text-xs">
                          <Truck className="h-3 w-3 mr-1" />
                          Delivered
                        </Badge>
                      )}
                    </div>

                    {/* Payment Alert */}
                    {order.purchase_orders && order.purchase_orders.some((po: any) => po.depositRequired && !order.depositPaid) && (
                      <div className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-lg">
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Deposit Payment Due
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Total Amount */}
                  {order.totalAmount && (
                    <div className="pt-2 border-t flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">Total:</span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(order.totalAmount, order.currency)}
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Link href={`/order/track/${order.publicToken}`} className="flex-1">
                      <Button variant="default" className="w-full" size="sm">
                        View Details
                      </Button>
                    </Link>
                    {order.quotations && order.quotations.some((q: any) => q.accepted === null && q.file) && (
                      <Link href={`/client/quotation/${order.quotations.find((q: any) => q.accepted === null).id}/review`}>
                        <Button variant="outline" size="sm">
                          Review
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

