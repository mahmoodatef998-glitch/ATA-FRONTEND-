import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, FileText, Package, Download, LogIn, ArrowLeft, Truck } from "lucide-react";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { OrderProgressTrackerCompact } from "@/components/order-progress-tracker-compact";

async function getOrderByToken(token: string) {
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL || "http://localhost:3005"}/api/public/orders/track/${token}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "APPROVED":
    case "COMPLETED":
      return <CheckCircle className="h-12 w-12 text-green-600" />;
    case "REJECTED":
    case "CANCELLED":
      return <XCircle className="h-12 w-12 text-red-600" />;
    case "QUOTATION_SENT":
      return <FileText className="h-12 w-12 text-blue-600" />;
    default:
      return <Clock className="h-12 w-12 text-yellow-600" />;
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "PENDING":
      return "secondary";
    case "APPROVED":
    case "COMPLETED":
      return "default";
    case "REJECTED":
    case "CANCELLED":
      return "destructive";
    case "QUOTATION_SENT":
      return "outline";
    default:
      return "secondary";
  }
};

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await getOrderByToken(token);

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-6">
              We couldn&apos;t find an order with this tracking number. Please check the link and try again.
            </p>
            <div className="space-y-2">
              <Link href="/client/register">
                <Button className="w-full">Register to Create Order</Button>
              </Link>
              <Link href="/client/login">
                <Button variant="outline" className="w-full">Client Portal</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <div className="flex items-center gap-3">
          <Link href="/client/portal">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to My Orders
            </Button>
          </Link>
        </div>

        {/* Header */}
        <Card>
          <CardContent className="pt-8 pb-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center">
                  {getStatusIcon(order.status)}
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2">Order #{order.orderId}</h1>
                <p className="text-muted-foreground mb-3">
                  Submitted on {formatDateTime(order.createdAt)}
                </p>
                <Badge variant={getStatusBadgeVariant(order.status)} className="text-base px-4 py-1">
                  {order.status.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Tracker - Compact */}
        {order.stage && (
          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <OrderProgressTrackerCompact currentStage={order.stage} />
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Order Details */}
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

        {/* Quotations */}
        {order.quotations && order.quotations.length > 0 && (
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
                      <Badge variant={quote.accepted ? "default" : "secondary"}>
                        {quote.accepted ? "Accepted" : "Pending"}
                      </Badge>
                    </div>
                    <div className="space-y-2 mb-3">
                      {quote.items.map((item: any, idx: number) => (
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
        )}

        {/* Purchase Orders */}
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
                          // Try to parse as JSON array (multiple files)
                          let files: string[] = [];
                          try {
                            const parsed = JSON.parse(po.poFile);
                            files = Array.isArray(parsed) ? parsed : [po.poFile];
                          } catch {
                            // If not JSON, treat as single file
                            files = [po.poFile];
                          }
                          
                          return files.length > 0 ? (
                            <div className="space-y-2">
                              {files.map((file: string, idx: number) => {
                                const fileName = file.split('/').pop() || 'PO Document';
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

                    {po.depositRequired && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                          💰 Deposit Required: {po.depositPercent}%
                        </p>
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

        {/* Delivery Notes */}
        {order.delivery_notes && order.delivery_notes.length > 0 && (
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
                          // Try to parse as JSON array (multiple files)
                          let files: string[] = [];
                          try {
                            const parsed = JSON.parse(dn.dnFile);
                            files = Array.isArray(parsed) ? parsed : [dn.dnFile];
                          } catch {
                            // If not JSON, treat as single file
                            files = [dn.dnFile];
                          }
                          
                          return files.length > 0 ? (
                            <div className="space-y-2">
                              {files.map((file: string, idx: number) => {
                                const fileName = file.split('/').pop() || 'Delivery Document';
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
        )}

        {/* Order History */}
        {order.history && order.history.length > 0 && (
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
        )}

        {/* Footer Actions */}
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Questions about your order? Contact {order.company.name}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/client/portal">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to My Orders
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="gap-2">
                <Package className="h-4 w-4" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

