import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, FileText, Package, Download, LogIn, ArrowLeft, Truck } from "lucide-react";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { OrderProgressTrackerCompact } from "@/components/order-progress-tracker-compact";
import { CancelOrderButton } from "@/components/cancel-order-button";
import { OrderTabs } from "@/components/client/order-tabs";
import { MarkActionViewed } from "@/components/client/mark-action-viewed";
import { auth } from "@/lib/auth";
import { getBaseUrl } from "@/lib/utils";

async function getOrderByToken(token: string) {
  try {
    const baseUrl = getBaseUrl();
    const apiUrl = `${baseUrl}/api/public/orders/track/${token}`;
    const response = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

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
  const session = await auth();

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

        {/* Mark payment action as viewed when viewing this page */}
        {order.depositPercentage && !order.depositPaid && (
          <MarkActionViewed orderId={order.orderId} actionType="payment" />
        )}

        {/* Mark delivery note action as viewed when viewing this page */}
        {order.delivery_notes && order.delivery_notes.length > 0 && !order.finalPaymentReceived && (
          <MarkActionViewed orderId={order.orderId} actionType="delivery" />
        )}

        {/* Order Tabs */}
        <OrderTabs 
          order={order} 
          isLoggedIn={true}
          isPublic={true}
          token={token}
        />

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
            
            {/* Cancel Order Button - Only in early stages */}
            <CancelOrderButton
              orderId={order.orderId}
              orderStage={order.stage}
              hasQuotation={order.quotations?.some((q: any) => q.file !== null) || false}
              isLoggedIn={!!session && session.user?.id === order.clientId}
            />
            
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

