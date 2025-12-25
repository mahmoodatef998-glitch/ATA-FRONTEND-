"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Package,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  History as HistoryIcon,
  Upload
} from "lucide-react";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { POUploader } from "@/components/client/po-uploader";
import Link from "next/link";

interface OrderTabsProps {
  order: any;
  isLoggedIn: boolean;
  isPublic?: boolean;
  token?: string;
}

const tabs = [
  { id: "overview", label: "Overview", icon: Package },
  { id: "quotations", label: "Quotations", icon: FileText },
  { id: "po", label: "Purchase Order", icon: Upload },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "history", label: "History", icon: HistoryIcon },
];

export function OrderTabs({ order, isLoggedIn, isPublic, token }: OrderTabsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Check if quotation is accepted and PO can be uploaded
  const hasAcceptedQuotation = order.quotations?.some((q: any) => q.accepted === true);
  const hasPO = order.purchase_orders && order.purchase_orders.length > 0;

  // In public tracking mode we allow upload without login
  const canUploadPO = hasAcceptedQuotation && !hasPO && (isPublic || isLoggedIn);
  
  // Get order ID (could be orderId or id)
  const orderId = order.orderId || order.id;

  // Determine API endpoint based on context
  const poUploadUrl = isPublic && token
    ? `/api/public/orders/track/${token}/po`
    : `/api/client/orders/${orderId}/po`;

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
            <div className="flex gap-2 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  suppressHydrationWarning
                  className={`
                    flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all text-xs sm:text-sm flex-shrink-0
                    ${activeTab === tab.id
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }
                  `}
                >
                  <tab.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Order Details */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Company</p>
                    <p className="font-medium">{order.company.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Client Name</p>
                    <p className="font-medium">{order.client.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Phone</p>
                    <p className="font-medium">{order.client.phone}</p>
                  </div>
                  {order.details && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Details</p>
                      <p className="text-sm">{order.details}</p>
                    </div>
                  )}
                  {order.totalAmount && (
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total Amount:</span>
                        <span className="text-xl font-bold text-primary">
                          {formatCurrency(order.totalAmount, order.currency)}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Items */}
              {order.items && Array.isArray(order.items) && order.items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Requested Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {order.items.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-start p-3 border rounded-lg bg-gray-50"
                        >
                          <div>
                            <p className="font-medium">{item.name}</p>
                            {item.specs && (
                              <p className="text-sm text-muted-foreground">{item.specs}</p>
                            )}
                          </div>
                          <Badge variant="secondary">Qty: {item.quantity}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Quotations Tab */}
        {activeTab === "quotations" && (
          <div className="space-y-6">
            {order.quotations && order.quotations.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Quotations</CardTitle>
                  <CardDescription>Price quotes from {order.company.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.quotations.map((quote: any) => (
                      <div key={quote.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold">Quotation #{quote.id}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDateTime(quote.createdAt)}
                            </p>
                          </div>
                          <Badge variant={quote.accepted ? "default" : quote.accepted === false ? "destructive" : "secondary"}>
                            {quote.accepted === true ? "Accepted" : quote.accepted === false ? "Rejected" : "Pending"}
                          </Badge>
                        </div>
                        <div className="space-y-2 mb-3">
                          {quote.items && Array.isArray(quote.items) && quote.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>
                                {item.name} x {item.quantity}
                              </span>
                              <span className="font-medium">
                                {formatCurrency(item.total, quote.currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-3 border-t flex justify-between items-center">
                          <span className="font-semibold">Total:</span>
                          <span className="text-lg font-bold">
                            {formatCurrency(quote.total, quote.currency)}
                          </span>
                        </div>
                        {quote.notes && (
                          <p className="mt-3 text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                            <strong>Note:</strong> {quote.notes}
                          </p>
                        )}
                        
                        {/* Download Quotation File */}
                        {quote.file && (
                          <div className="mt-4 pt-4 border-t">
                            <a
                              href={quote.file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <Button variant="outline" className="w-full" size="lg">
                                <Download className="h-4 w-4 mr-2" />
                                Download Quotation File
                              </Button>
                            </a>
                          </div>
                        )}
                        
                        {/* Review Quotation */}
                        {quote.accepted === null && quote.file && (
                          <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded-lg">
                            <p className="text-sm text-green-900 font-medium mb-2">
                              ✅ Ready for Review
                            </p>
                            <p className="text-sm text-green-700 mb-3">
                              You can now accept or reject this quotation
                            </p>
                            <Link href={`/client/quotation/${quote.id}/review`}>
                              <Button variant="default" className="w-full bg-green-600 hover:bg-green-700">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Review & Respond
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-dashed">
                <CardContent className="py-12 text-center">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">No quotations yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Purchase Order Tab */}
        {activeTab === "po" && (
          <div className="space-y-6">
            {/* PO Uploader - Show if quotation accepted and no PO yet */}
            {canUploadPO && (
              <POUploader 
                orderId={orderId}
                uploadUrl={poUploadUrl}
                onSuccess={() => {
                  window.location.reload();
                }}
              />
            )}

            {!isPublic && !isLoggedIn && (
              <Card className="border-2 border-amber-200 dark:border-amber-900">
                <CardContent className="pt-6">
                  <p className="text-amber-700 dark:text-amber-300 mb-4">
                    ⚠️ You must be logged in to upload a Purchase Order
                  </p>
                  <Link href={`/client/login?returnUrl=${encodeURIComponent(window.location.pathname)}`}>
                    <Button className="w-full">
                      Login
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Message if no accepted quotation */}
            {!hasAcceptedQuotation && isLoggedIn && (
              <Card className="border-2 border-blue-200 dark:border-blue-900">
                <CardContent className="pt-6">
                  <p className="text-blue-700 dark:text-blue-300">
                    ℹ️ You need to accept a quotation before uploading a Purchase Order
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Existing POs */}
            {order.purchase_orders && order.purchase_orders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Orders</CardTitle>
                  <CardDescription>Official purchase orders for this order</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.purchase_orders.map((po: any) => (
                      <div key={po.id} className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold text-blue-700 dark:text-blue-300">PO #{po.poNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDateTime(po.createdAt)}
                            </p>
                          </div>
                          <Badge variant="default" className="bg-blue-600">Official PO</Badge>
                        </div>
                        
                        {po.poFile && (
                          <div className="mb-3">
                            {(() => {
                              let files: string[] = [];
                              try {
                                const parsed = JSON.parse(po.poFile);
                                files = Array.isArray(parsed) ? parsed : [po.poFile];
                              } catch {
                                files = [po.poFile];
                              }
                              
                              return files.length > 0 ? (
                                <div className="space-y-2">
                                  {files.map((file: string, idx: number) => {
                                    // Use simple link like Quotation (no complex handling)
                                    // Cloudinary can serve PDFs from /image/upload/ if they're public
                                    return (
                                      <a
                                        key={idx}
                                        href={file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                      >
                                        <Button variant="outline" className="w-full" size="sm">
                                          <Download className="h-4 w-4 mr-2" />
                                          Download {files.length > 1 ? `PO Document ${idx + 1}` : 'Purchase Order'}
                                        </Button>
                                      </a>
                                    );
                                  })}
                                </div>
                              ) : null;
                            })()}
                          </div>
                        )}

                        {po.notes && (
                          <p className="mt-3 text-sm text-muted-foreground bg-gray-50 dark:bg-gray-800 p-3 rounded">
                            <strong>Note:</strong> {po.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {!hasPO && !canUploadPO && hasAcceptedQuotation && isLoggedIn && (
              <Card className="border-2 border-dashed">
                <CardContent className="py-12 text-center">
                  <Upload className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">No purchase orders uploaded yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Delivery Tab */}
        {activeTab === "delivery" && (
          <div className="space-y-6">
            {order.delivery_notes && order.delivery_notes.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Notes</CardTitle>
                  <CardDescription>Delivery information for this order</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.delivery_notes.map((dn: any) => (
                      <div key={dn.id} className="border rounded-lg p-4 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold text-cyan-700 dark:text-cyan-300">DN #{dn.dnNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDateTime(dn.deliveredAt || dn.createdAt)}
                            </p>
                          </div>
                          <Badge variant="default" className="bg-green-600">✓ Delivered</Badge>
                        </div>
                        
                        {dn.dnFile && (
                          <div className="mb-3">
                            {(() => {
                              let files: string[] = [];
                              try {
                                const parsed = JSON.parse(dn.dnFile);
                                files = Array.isArray(parsed) ? parsed : [dn.dnFile];
                              } catch {
                                files = [dn.dnFile];
                              }
                              
                              return files.length > 0 ? (
                                <div className="space-y-2">
                                  {files.map((file: string, idx: number) => {
                                    // Use simple link like Quotation (no complex handling)
                                    // Cloudinary can serve PDFs from /image/upload/ if they're public
                                    return (
                                      <a
                                        key={idx}
                                        href={file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block"
                                      >
                                        <Button variant="outline" className="w-full bg-blue-600 hover:bg-blue-700 text-white border-blue-600" size="sm">
                                          <Truck className="h-4 w-4 mr-2" />
                                          Download {files.length > 1 ? `Document ${idx + 1}` : 'Delivery Note'}
                                        </Button>
                                      </a>
                                    );
                                  })}
                                </div>
                              ) : null;
                            })()}
                          </div>
                        )}

                        {dn.items && Array.isArray(dn.items) && dn.items.length > 0 && (
                          <div className="mb-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                              📦 Items Delivered:
                            </p>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                              {dn.items.map((item: any, idx: number) => (
                                <li key={idx}>• {item.name} - Qty: {item.quantity}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {dn.notes && (
                          <p className="text-sm text-muted-foreground bg-white/60 dark:bg-gray-800/60 p-3 rounded">
                            <strong>📝 Delivery Notes:</strong> {dn.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
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
          <div className="space-y-6">
            {order.history && order.history.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Order Timeline</CardTitle>
                  <CardDescription>Track all updates to your order</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.history.map((history: any, index: number) => (
                      <div key={history.id} className="flex gap-4">
                        <div className="mt-1">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-primary" />
                          </div>
                          {index < order.history.length - 1 && (
                            <div className="ml-4 h-full w-0.5 bg-gray-200 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-medium capitalize">
                              {history.action.replace(/_/g, " ")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDateTime(history.createdAt)}
                            </p>
                          </div>
                          {history.actorName && (
                            <p className="text-sm text-muted-foreground">
                              by {history.actorName}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-dashed">
                <CardContent className="py-12 text-center">
                  <HistoryIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">No history available</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

