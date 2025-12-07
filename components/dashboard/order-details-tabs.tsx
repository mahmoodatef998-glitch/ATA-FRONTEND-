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
import { QuotationManager } from "@/components/dashboard/quotation-manager";
import { PaymentRecorder } from "@/components/dashboard/payment-recorder";
import { DeliveryNoteCreator } from "@/components/dashboard/delivery-note-creator";
import { OrderProgressTrackerCompact } from "@/components/order-progress-tracker-compact";
import { UpdateStage } from "@/components/dashboard/update-stage";
import { useCan, useCanAny } from "@/lib/permissions/frontend-helpers";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { Permission, migratePermission } from "@/lib/permissions/migration-map";
import { usePermissions } from "@/contexts/permissions-context";

interface OrderDetailsTabsProps {
  order: any;
}

// Build tabs list - show all tabs, but content will check permissions
function getAvailableTabs(checkPermission: (p: Permission) => boolean) {
  const allTabs = [
    { id: "overview", label: "Overview", icon: Package, permission: null },
    { id: "quotations", label: "Quotations", icon: FileText, permission: Permission.VIEW_QUOTATIONS },
    { id: "po", label: "Purchase Orders", icon: FileText, permission: Permission.VIEW_POS },
    { id: "payments", label: "Payments", icon: DollarSign, permission: Permission.VIEW_PAYMENTS },
    { id: "delivery", label: "Delivery", icon: Truck, permission: Permission.VIEW_DELIVERY_NOTES },
    { id: "history", label: "History", icon: HistoryIcon, permission: Permission.VIEW_ORDERS },
  ];
  
  // Show all tabs (don't filter), but content will check permissions
  return allTabs;
}

export function OrderDetailsTabs({ order }: OrderDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Permission checks using new RBAC system
  const canViewPayments = useCan(PermissionAction.INVOICE_READ);
  const canCreatePayments = useCan(PermissionAction.PAYMENT_RECORD);
  const canUpdateManufacturing = useCan(PermissionAction.LEAD_MOVE_STAGE);
  const canViewManufacturing = useCan(PermissionAction.LEAD_READ);
  const canCreateQuotations = useCan(PermissionAction.INVOICE_CREATE);
  // Purchase Orders - use PO permissions
  const canCreatePOs = useCan(PermissionAction.PO_CREATE);
  const canViewPOs = useCan(PermissionAction.PO_READ);
  const canUpdatePOs = useCan(PermissionAction.PO_UPDATE);
  const canDeletePOs = useCan(PermissionAction.PO_DELETE);
  const canCreateDeliveryNotes = useCan(PermissionAction.LEAD_CREATE);
  const canViewOrders = useCan(PermissionAction.LEAD_READ);
  const canViewQuotations = useCan(PermissionAction.INVOICE_READ);
  const canViewDeliveryNotes = useCan(PermissionAction.LEAD_READ);
  // History - allow with either LEAD_READ or OVERVIEW_VIEW
  const canViewHistory = useCanAny([PermissionAction.LEAD_READ, PermissionAction.OVERVIEW_VIEW]);

  // Helper function for backward compatibility
  const checkPermission = (oldPermission: Permission): boolean => {
    const newPermission = migratePermission(oldPermission);
    return useCan(newPermission);
  };

  const availableTabs = getAvailableTabs(checkPermission);
  
  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Tabs Navigation */}
      <Card className="border-2" suppressHydrationWarning>
        <CardContent className="pt-6" suppressHydrationWarning>
          <div className="flex flex-wrap gap-2" suppressHydrationWarning>
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                suppressHydrationWarning
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
            {/* Access Denied for Accountant - they should only see PO and Payments */}
            {!canViewOrders && (
              <Card className="border-2 border-red-200 dark:border-red-900">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <h2 className="text-2xl font-bold mb-2 text-red-600 dark:text-red-400">Access Denied</h2>
                    <p className="text-muted-foreground">
                      You do not have permission to view this section. Please use Purchase Orders or Payments tabs.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {canViewOrders && (
          <>
            {/* Compact Progress Tracker */}
            <Card className="border-2">
              <CardContent className="pt-6">
                <OrderProgressTrackerCompact currentStage={order.stage || "RECEIVED"} />
              </CardContent>
            </Card>
            
            {/* Update Stage - admins / supervisors */}
            {canUpdateManufacturing && (
              <UpdateStage orderId={order.id} currentStage={order.stage} />
            )}

            {/* Order Details + Recent Activity */}
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

              {/* Client Information */}
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

              {/* Recent Activity / History Preview */}
              <Card className="border-2">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/30">
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest actions performed on this order</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {order.order_histories && order.order_histories.length > 0 ? (
                    <div className="space-y-3">
                      {order.order_histories.slice(0, 5).map((history: any) => (
                        <div
                          key={history.id}
                          className="flex items-start gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800"
                        >
                          <div className="mt-1">
                            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium capitalize">
                              {history.action?.replace(/_/g, " ") || "Activity"}
                            </p>
                            {history.actorName && (
                              <p className="text-xs text-muted-foreground">
                                by {history.actorName}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDateTime(history.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {order.order_histories.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          View full history in the <span className="font-semibold">History</span> tab
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No activity has been recorded for this order yet.
                    </p>
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
          </>
            )}
          </div>
        )}

        {/* Quotations Tab */}
        {activeTab === "quotations" && (
          <div className="space-y-6">
            {/* Access Denied for Accountant */}
            {!canViewQuotations && (
              <Card className="border-2 border-red-200 dark:border-red-900">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <h2 className="text-2xl font-bold mb-2 text-red-600 dark:text-red-400">Access Denied</h2>
                    <p className="text-muted-foreground">
                      You do not have permission to view quotations. Please use Purchase Orders or Payments tabs.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {canViewQuotations && (
              <>
            {order.status !== "COMPLETED" && order.status !== "CANCELLED" && canCreateQuotations && (
              <QuotationManager orderId={order.id} orderTotal={order.totalAmount || undefined} currency={order.currency} />
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
          </>
            )}
          </div>
        )}

        {/* Purchase Orders Tab */}
        {activeTab === "po" && (
          <div className="space-y-6">
            {/* Access Denied check */}
            {!canViewPOs && (
              <Card className="border-2 border-red-200 dark:border-red-900">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <h2 className="text-2xl font-bold mb-2 text-red-600 dark:text-red-400">Access Denied</h2>
                    <p className="text-muted-foreground">
                      You do not have permission to view purchase orders.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {canViewPOs && (
          <>
            <Card className="border-2 border-blue-200 dark:border-blue-900">
              <CardContent className="pt-6">
                <p className="text-blue-700 dark:text-blue-300">
                  ℹ️ The client is responsible for uploading the Purchase Order (PO). Once uploaded, it will appear here.
                </p>
              </CardContent>
            </Card>

            {order.purchase_orders && order.purchase_orders.length > 0 && (
              <Card className="border-2">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                  <CardTitle>📄 Purchase Orders</CardTitle>
                  <CardDescription>All purchase orders and deposit proofs for this order</CardDescription>
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
                                    
                                    // Use simple link like Quotation (no complex handling)
                                    // Cloudinary can serve PDFs from /image/upload/ if they're public
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

                      {/* Display Deposit Proof Files (cheque / bank slip) */}
                      {po.depositProofFile && (
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900">
                          {(() => {
                            let files: string[] = [];
                            try {
                              const parsed = JSON.parse(po.depositProofFile);
                              files = Array.isArray(parsed) ? parsed : [po.depositProofFile];
                            } catch {
                              files = [po.depositProofFile];
                            }
                            
                            return (
                              <>
                                <p className="text-sm font-semibold mb-2 text-emerald-700 dark:text-emerald-300">
                                  💰 Deposit proof ({files.length}):
                                </p>
                                <div className="space-y-2">
                                  {files.map((file: string, idx: number) => {
                                    // Use original URL as-is (Cloudinary handles both /image/upload/ and /raw/upload/)
                                    const fileName = file.split('/').pop() || `Deposit ${idx + 1}`;
                                    return (
                                      <a
                                        key={idx}
                                        href={file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-md border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-all"
                                      >
                                        <FileText className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300 truncate flex-1">
                                          {fileName}
                                        </span>
                                        <Download className="h-4 w-4 text-emerald-600 flex-shrink-0" />
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
          </>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            {/* Access Denied check */}
            {!canViewPayments && (
              <Card className="border-2 border-red-200 dark:border-red-900">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <h2 className="text-2xl font-bold mb-2 text-red-600 dark:text-red-400">Access Denied</h2>
                    <p className="text-muted-foreground">
                      You do not have permission to view payments.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {canViewPayments && (
              <>
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
                              setProcessingPayment(true);
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
                              } finally {
                                setProcessingPayment(false);
                              }
                            }
                          }}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          disabled={processingPayment}
                        >
                          {processingPayment ? (
                            <>⏳ Processing...</>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Mark as Received
                            </>
                          )}
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
                              setProcessingPayment(true);
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
                              } finally {
                                setProcessingPayment(false);
                              }
                            }
                          }}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          disabled={processingPayment}
                        >
                          {processingPayment ? (
                            <>⏳ Processing...</>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Mark as Received
                            </>
                          )}
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

            {/* Payment Recorder - only for accountants/admins */}
            {(order.stage === "AWAITING_DEPOSIT" || order.stage === "AWAITING_FINAL_PAYMENT") && canCreatePayments && (
              <PaymentRecorder
                orderId={order.id}
                depositAmount={order.depositAmount || undefined}
                totalAmount={order.totalAmount || undefined}
                currency={order.currency}
              />
            )}
            
            {/* Message for users without permission to record payments */}
            {(order.stage === "AWAITING_DEPOSIT" || order.stage === "AWAITING_FINAL_PAYMENT") && !canCreatePayments && canViewPayments && (
              <Card className="border-2 border-amber-200 dark:border-amber-900">
                <CardContent className="pt-6">
                  <p className="text-amber-700 dark:text-amber-300">
                    ⚠️ You do not have permission to record payments. Please contact an accountant or administrator.
                  </p>
                </CardContent>
              </Card>
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
              </>
            )}
          </div>
        )}

        {/* Delivery Tab */}
        {activeTab === "delivery" && (
          <div className="space-y-6">
            {/* Access Denied for Accountant */}
            {!canViewDeliveryNotes && (
              <Card className="border-2 border-red-200 dark:border-red-900">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <h2 className="text-2xl font-bold mb-2 text-red-600 dark:text-red-400">Access Denied</h2>
                    <p className="text-muted-foreground">
                      You do not have permission to view delivery notes. Please use Purchase Orders or Payments tabs.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {canViewDeliveryNotes && (
              <>
            {/* Show Delivery Note Creator if order is approved and has PO */}
            {order.status === "APPROVED" && !order.delivery_notes?.length && canCreateDeliveryNotes && (
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
                                    // Use simple link like Quotation (no complex handling)
                                    // Cloudinary can serve PDFs from /image/upload/ if they're public
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
          </>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="space-y-6">
            {/* Access Denied check */}
            {!canViewHistory && (
              <Card className="border-2 border-red-200 dark:border-red-900">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <h2 className="text-2xl font-bold mb-2 text-red-600 dark:text-red-400">Access Denied</h2>
                    <p className="text-muted-foreground">
                      You do not have permission to view order history. Please use Purchase Orders or Payments tabs.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {canViewHistory && (
              <>
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

