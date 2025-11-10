"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  DollarSign, 
  Truck, 
  History as HistoryIcon,
  Package,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Phone,
  Mail,
  Calendar
} from "lucide-react";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { UploadQuotationSimple } from "@/components/dashboard/upload-quotation-simple";
import { POManager } from "@/components/dashboard/po-manager";
import { PaymentRecorder } from "@/components/dashboard/payment-recorder";
import { DeliveryNoteCreator } from "@/components/dashboard/delivery-note-creator";
import { OrderProgressTrackerCompact } from "@/components/order-progress-tracker-compact";

interface OrderDetailsTabsProps {
  order: any;
}

const tabs = [
  { id: "overview", label: "Overview", icon: Package },
  { id: "quotations", label: "Quotations", icon: FileText },
  { id: "po", label: "Purchase Orders", icon: FileText },
  { id: "payments", label: "Payments", icon: DollarSign },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "history", label: "History", icon: HistoryIcon },
];

export function OrderDetailsTabs({ order }: OrderDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
                  ${activeTab === tab.id
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }
                `}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Compact Progress Tracker */}
            <Card className="border-2">
              <CardContent className="pt-6">
                <OrderProgressTrackerCompact currentStage={order.stage || "RECEIVED"} />
              </CardContent>
            </Card>

            {/* Order Details */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-2">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                  <CardTitle>Order Information</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                    <p className="text-2xl font-bold text-blue-600">#{order.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge className={
                      order.status === "COMPLETED" ? "bg-green-600" :
                      order.status === "PENDING" ? "bg-amber-500" :
                      order.status === "APPROVED" ? "bg-blue-600" :
                      "bg-purple-600"
                    }>
                      {order.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Created</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="font-medium">{formatDateTime(order.createdAt)}</p>
                    </div>
                  </div>
                  {order.totalAmount && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                      <p className="text-3xl font-bold text-green-600">
                        {formatCurrency(order.totalAmount, order.currency)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                  <CardTitle>Client Information</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                      <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-semibold text-lg">{order.clients?.name || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                      <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-semibold">{order.clients?.phone || "N/A"}</p>
                    </div>
                  </div>
                  {order.clients?.email && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                        <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-semibold text-sm">{order.clients.email}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Items & Files */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Order Items & Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.details && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                    <p className="text-sm font-semibold mb-2">Details:</p>
                    <p className="text-sm text-muted-foreground">{order.details}</p>
                  </div>
                )}

                {order.items && Array.isArray(order.items) && order.items.length > 0 && (
                  <div>
                    <p className="font-semibold mb-3">Items Requested:</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {order.items.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-start p-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"
                        >
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            {item.specs && (
                              <p className="text-sm text-muted-foreground mt-1">{item.specs}</p>
                            )}
                          </div>
                          <Badge variant="secondary" className="bg-blue-600 text-white">
                            Qty: {item.quantity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {order.images && Array.isArray(order.images) && order.images.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="font-semibold mb-3">Attached Files ({order.images.length}):</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {order.images.map((filePath: string, index: number) => {
                        const fileName = filePath.split('/').pop() || 'file';
                        const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName);
                        
                        return (
                          <a
                            key={index}
                            href={filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 border-2 border-green-200 dark:border-green-900 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 hover:shadow-md transition-all"
                          >
                            {isImage ? (
                              <div className="h-12 w-12 rounded bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                              </div>
                            ) : (
                              <div className="h-12 w-12 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-blue-600" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium truncate">{fileName}</p>
                              <p className="text-xs text-muted-foreground">Click to view</p>
                            </div>
                            <Download className="h-4 w-4 text-green-600" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quotations Tab */}
        {activeTab === "quotations" && (
          <div className="space-y-6">
            {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
              <UploadQuotationSimple orderId={order.id} orderStatus={order.status} />
            )}
            
            {/* Quotations Display */}
            {order.quotations && order.quotations.length > 0 && (
              <Card className="border-2">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                  <CardTitle>📊 Quotations</CardTitle>
                  <CardDescription>All quotations for this order</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {order.quotations.map((quote: any) => (
                    <div key={quote.id} className="border-2 border-purple-200 dark:border-purple-900 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="font-bold text-lg text-purple-700 dark:text-purple-300">
                            Quotation #{quote.id}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDateTime(quote.createdAt)}
                          </p>
                        </div>
                        {quote.accepted === true && (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Accepted
                          </Badge>
                        )}
                        {quote.accepted === false && (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Rejected
                          </Badge>
                        )}
                        {quote.accepted === null && (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Total Amount:</span>
                          <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                            {formatCurrency(quote.total, quote.currency)}
                          </span>
                        </div>
                      </div>

                      {quote.file && (
                        <div className="mb-3">
                          <a
                            href={quote.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <Button variant="outline" size="sm" className="w-full">
                              <Download className="h-4 w-4 mr-2" />
                              Download Quotation File
                            </Button>
                          </a>
                        </div>
                      )}

                      {quote.notes && (
                        <div className="text-sm bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg">
                          <p className="font-medium mb-1">📝 Notes:</p>
                          <p className="text-muted-foreground">{quote.notes}</p>
                        </div>
                      )}

                      {quote.clientComment && (
                        <div className="text-sm bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg mt-2">
                          <p className="font-medium mb-1 text-blue-700 dark:text-blue-300">💬 Client Comment:</p>
                          <p className="text-muted-foreground">{quote.clientComment}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {(!order.quotations || order.quotations.length === 0) && (
              <Card className="border-2 border-dashed">
                <CardContent className="py-12 text-center">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">No quotations yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Purchase Orders Tab */}
        {activeTab === "po" && (
          <div className="space-y-6">
            {order.status === "APPROVED" && !order.purchase_orders?.length && (
              <POManager 
                orderId={order.id}
                orderTotal={order.totalAmount || undefined}
                currency={order.currency}
              />
            )}

            {order.purchase_orders && order.purchase_orders.length > 0 && (
              <Card className="border-2">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                  <CardTitle>📄 Purchase Orders</CardTitle>
                  <CardDescription>All purchase orders for this order</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {order.purchase_orders.map((po: any) => (
                    <div key={po.id} className="border-2 border-blue-200 dark:border-blue-900 p-5 rounded-xl space-y-3 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-lg font-bold text-blue-700 dark:text-blue-300">PO #{po.poNumber}</span>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDateTime(po.createdAt)}
                          </p>
                        </div>
                        <Badge variant="default" className="bg-blue-600">Purchase Order</Badge>
                      </div>

                      {po.depositRequired && (
                        <div className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg">
                          <p className="text-sm font-semibold mb-1">💰 Deposit Required:</p>
                          <p className="text-base font-bold text-amber-600 dark:text-amber-400">
                            {po.depositPercent}% = {formatCurrency(po.depositAmount, order.currency)}
                          </p>
                          <div className="flex items-center justify-between gap-2 mt-2">
                            <div className="flex items-center gap-2 text-sm">
                              Payment Status: {order.depositPaid ? (
                                <Badge variant="default" className="bg-green-600">✓ Paid</Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-amber-500 text-white">⏳ Awaiting Payment</Badge>
                              )}
                            </div>
                            {!order.depositPaid && po.depositAmount && (
                              <Button
                                onClick={async () => {
                                  if (confirm(`Mark deposit of ${formatCurrency(po.depositAmount, order.currency)} as received?`)) {
                                    try {
                                      const response = await fetch(`/api/orders/${order.id}/payment`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                          paymentType: "DEPOSIT",
                                          amount: po.depositAmount,
                                          paymentMethod: "Client Transfer",
                                          reference: `DEP-${po.poNumber}-${Date.now()}`,
                                        }),
                                      });
                                      const result = await response.json();
                                      if (result.success) {
                                        window.location.reload();
                                      } else {
                                        alert(`Error: ${result.error}`);
                                      }
                                    } catch (error) {
                                      alert("Failed to record payment");
                                    }
                                  }
                                }}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-xs"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Received
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Display PO Files (supports single file or JSON array) */}
                      {po.poFile && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-3 rounded-lg border border-green-200 dark:border-green-900">
                          {(() => {
                            // Try to parse as JSON array (multiple files)
                            let files: string[] = [];
                            try {
                              const parsed = JSON.parse(po.poFile);
                              files = Array.isArray(parsed) ? parsed : [po.poFile];
                            } catch {
                              // If not JSON, treat as single file
                              files = [po.poFile];
                            }
                            
                            return (
                              <>
                                <p className="text-sm font-semibold mb-2 text-green-700 dark:text-green-300">
                                  📎 PO Documents ({files.length}):
                                </p>
                                <div className="space-y-2">
                                  {files.map((file: string, idx: number) => {
                                    const fileName = file.split('/').pop() || `Document ${idx + 1}`;
                                    return (
                                      <a
                                        key={idx}
                                        href={file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-md border border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-950/50 transition-all"
                                      >
                                        <FileText className="h-4 w-4 text-green-600 flex-shrink-0" />
                                        <span className="text-sm font-medium text-green-700 dark:text-green-300 truncate flex-1">{fileName}</span>
                                        <Download className="h-4 w-4 text-green-600 flex-shrink-0" />
                                      </a>
                                    );
                                  })}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {po.notes && (
                        <div className="text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="font-medium mb-1">📝 Notes:</p>
                          <p className="text-muted-foreground">{po.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            {/* Payment Stages Status */}
            <Card className="border-2 border-green-200 dark:border-green-900">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                <CardTitle>💰 Payment Stages</CardTitle>
                <CardDescription>Track payment milestones for this order</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Deposit Payment Stage */}
                <div className={`p-4 border-2 rounded-xl transition-all ${
                  order.depositPaid 
                    ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/20' 
                    : 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        order.depositPaid 
                          ? 'bg-green-500' 
                          : 'bg-amber-500'
                      }`}>
                        {order.depositPaid ? (
                          <CheckCircle className="h-6 w-6 text-white" />
                        ) : (
                          <Clock className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-base">Deposit Payment</h4>
                        {order.depositAmount && (
                          <p className="text-sm text-muted-foreground">
                            {order.depositPercentage}% = {formatCurrency(order.depositAmount, order.currency)}
                          </p>
                        )}
                        {order.depositPaid && order.depositPaidAt && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Paid on {formatDateTime(order.depositPaidAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!order.depositPaid && order.depositAmount && (
                        <Button
                          onClick={async () => {
                            if (confirm(`Mark deposit of ${formatCurrency(order.depositAmount, order.currency)} as received?`)) {
                              try {
                                const response = await fetch(`/api/orders/${order.id}/payment`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    paymentType: "DEPOSIT",
                                    amount: order.depositAmount,
                                    paymentMethod: "Manual",
                                    reference: `DEPOSIT-${Date.now()}`,
                                  }),
                                });
                                const result = await response.json();
                                if (result.success) {
                                  window.location.reload();
                                } else {
                                  alert(`Error: ${result.error}`);
                                }
                              } catch (error) {
                                alert("Failed to record payment");
                              }
                            }
                          }}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark as Received
                        </Button>
                      )}
                      <Badge 
                        variant={order.depositPaid ? "default" : "secondary"} 
                        className={order.depositPaid ? "bg-green-600" : "bg-amber-500 text-white"}
                      >
                        {order.depositPaid ? "✓ Paid" : "⏳ Pending"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Final Payment Stage */}
                <div className={`p-4 border-2 rounded-xl transition-all ${
                  order.finalPaymentReceived 
                    ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/20' 
                    : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        order.finalPaymentReceived 
                          ? 'bg-green-500' 
                          : 'bg-gray-400'
                      }`}>
                        {order.finalPaymentReceived ? (
                          <CheckCircle className="h-6 w-6 text-white" />
                        ) : (
                          <DollarSign className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-base">Final Payment</h4>
                        {order.totalAmount && (
                          <p className="text-sm text-muted-foreground">
                            Remaining: {formatCurrency(
                              order.totalAmount - (order.depositAmount || 0), 
                              order.currency
                            )}
                          </p>
                        )}
                        {order.finalPaymentReceived && order.finalPaymentAt && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Paid on {formatDateTime(order.finalPaymentAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!order.finalPaymentReceived && order.totalAmount && order.depositPaid && (
                        <Button
                          onClick={async () => {
                            const finalAmount = order.totalAmount - (order.depositAmount || 0);
                            if (confirm(`Mark final payment of ${formatCurrency(finalAmount, order.currency)} as received?`)) {
                              try {
                                const response = await fetch(`/api/orders/${order.id}/payment`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    paymentType: "FINAL",
                                    amount: finalAmount,
                                    paymentMethod: "Manual",
                                    reference: `FINAL-${Date.now()}`,
                                  }),
                                });
                                const result = await response.json();
                                if (result.success) {
                                  window.location.reload();
                                } else {
                                  alert(`Error: ${result.error}`);
                                }
                              } catch (error) {
                                alert("Failed to record payment");
                              }
                            }
                          }}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark as Received
                        </Button>
                      )}
                      <Badge 
                        variant={order.finalPaymentReceived ? "default" : "secondary"} 
                        className={order.finalPaymentReceived ? "bg-green-600" : ""}
                      >
                        {order.finalPaymentReceived ? "✓ Paid" : "⏳ Pending"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Order Value</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(order.totalAmount || 0, order.currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-muted-foreground">Payment Status</p>
                      <p className="text-lg font-bold">
                        {order.depositPaid && order.finalPaymentReceived ? (
                          <span className="text-green-600 dark:text-green-400">✓ Fully Paid</span>
                        ) : order.depositPaid ? (
                          <span className="text-amber-600 dark:text-amber-400">Partially Paid</span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400">Unpaid</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Recorder */}
            {(order.stage === "AWAITING_DEPOSIT" || order.stage === "AWAITING_FINAL_PAYMENT") && (
              <PaymentRecorder
                orderId={order.id}
                depositAmount={order.depositAmount || undefined}
                totalAmount={order.totalAmount || undefined}
                currency={order.currency}
              />
            )}

            {/* Payment History */}
            {order.payments && order.payments.length > 0 && (
              <Card className="border-2">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30">
                  <CardTitle>💳 Payment History</CardTitle>
                  <CardDescription>All payment transactions for this order</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {order.payments.map((payment: any) => (
                    <div key={payment.id} className="border-2 border-green-200 dark:border-green-900 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                      <div className="flex justify-between items-start mb-3">
                        <Badge className="bg-green-600">{payment.paymentType}</Badge>
                        <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {formatCurrency(payment.amount, payment.currency)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Date:</p>
                          <p className="font-medium">{formatDateTime(payment.paidAt)}</p>
                        </div>
                        {payment.reference && (
                          <div>
                            <p className="text-muted-foreground">Reference:</p>
                            <p className="font-medium">{payment.reference}</p>
                          </div>
                        )}
                        {payment.paymentMethod && (
                          <div>
                            <p className="text-muted-foreground">Method:</p>
                            <p className="font-medium">{payment.paymentMethod}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {(!order.payments || order.payments.length === 0) && (
              <Card className="border-2 border-dashed">
                <CardContent className="py-12 text-center">
                  <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">No payments recorded yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Delivery Tab */}
        {activeTab === "delivery" && (
          <div className="space-y-6">
            {/* Show Delivery Note Creator if order is approved and has PO */}
            {order.status === "APPROVED" && !order.delivery_notes?.length && (
              <DeliveryNoteCreator
                orderId={order.id}
                orderItems={order.items as any[]}
              />
            )}

            {order.delivery_notes && order.delivery_notes.length > 0 && (
              <Card className="border-2">
                <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30">
                  <CardTitle>🚚 Delivery Notes</CardTitle>
                  <CardDescription>All delivery notes for this order</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {order.delivery_notes.map((dn: any) => (
                    <div key={dn.id} className="border-2 border-cyan-200 dark:border-cyan-900 p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="font-bold text-lg text-cyan-700 dark:text-cyan-300">DN #{dn.dnNumber}</span>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDateTime(dn.deliveredAt || dn.createdAt)}
                          </p>
                        </div>
                        <Badge variant="default" className="bg-green-600">✓ Delivered</Badge>
                      </div>

                      {/* Display Delivery Note Files (supports single file or JSON array) */}
                      {dn.dnFile && (
                        <div className="mb-3 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 p-3 rounded-lg border border-cyan-200 dark:border-cyan-800">
                          {(() => {
                            // Try to parse as JSON array (multiple files)
                            let files: string[] = [];
                            try {
                              const parsed = JSON.parse(dn.dnFile);
                              files = Array.isArray(parsed) ? parsed : [dn.dnFile];
                            } catch {
                              // If not JSON, treat as single file
                              files = [dn.dnFile];
                            }
                            
                            return (
                              <>
                                <p className="text-sm font-semibold mb-2 text-cyan-700 dark:text-cyan-300">
                                  📎 Delivery Documents ({files.length}):
                                </p>
                                <div className="space-y-2">
                                  {files.map((file: string, idx: number) => {
                                    const fileName = file.split('/').pop() || `Document ${idx + 1}`;
                                    return (
                                      <a
                                        key={idx}
                                        href={file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-md border border-cyan-300 dark:border-cyan-700 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 transition-all"
                                      >
                                        <FileText className="h-4 w-4 text-cyan-600 flex-shrink-0" />
                                        <span className="text-sm font-medium text-cyan-700 dark:text-cyan-300 truncate flex-1">{fileName}</span>
                                        <Download className="h-4 w-4 text-cyan-600 flex-shrink-0" />
                                      </a>
                                    );
                                  })}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {dn.notes && (
                        <div className="text-sm bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg">
                          <p className="font-medium mb-1">📝 Notes:</p>
                          <p className="text-muted-foreground">{dn.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {(!order.delivery_notes || order.delivery_notes.length === 0) && (
              <Card className="border-2 border-dashed">
                <CardContent className="py-12 text-center">
                  <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">No delivery notes yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <Card className="border-2">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              <CardTitle>Order History</CardTitle>
              <CardDescription>Timeline of all actions and changes</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {order.order_histories && order.order_histories.length > 0 ? (
                <div className="space-y-4">
                  {order.order_histories.map((history: any) => (
                    <div key={history.id} className="flex gap-4 group">
                      <div className="mt-1">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Clock className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 pb-4 border-b last:border-0 group-hover:bg-blue-50/30 dark:group-hover:bg-blue-950/10 p-3 rounded-lg transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-semibold text-base capitalize">
                            {history.action.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(history.createdAt)}
                          </p>
                        </div>
                        {history.actorName && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <User className="h-3 w-3" />
                            by {history.actorName}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <HistoryIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">No history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

