import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Package, FileDown } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { auth } from "@/lib/auth";
import dynamic from "next/dynamic";

// Dynamic imports for heavy components (code splitting)
const OrderDetailsTabs = dynamic(() => import("@/components/dashboard/order-details-tabs").then(mod => ({ default: mod.OrderDetailsTabs })), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-800 h-64 rounded-lg" />,
  ssr: true,
});

const UpdateStage = dynamic(() => import("@/components/dashboard/update-stage").then(mod => ({ default: mod.UpdateStage })), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-800 h-32 rounded-lg" />,
  ssr: true,
});

const OrderActions = dynamic(() => import("@/components/dashboard/order-actions").then(mod => ({ default: mod.OrderActions })), {
  loading: () => <div className="animate-pulse bg-gray-200 dark:bg-gray-800 h-16 rounded-lg" />,
  ssr: true,
});

// Fetch order from database
async function getOrder(id: string) {
  try {
    const { prisma } = await import("@/lib/prisma");
    
    const order = await prisma.orders.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        companyId: true,
        clientId: true,
        publicToken: true,
        items: true,
        details: true,
        totalAmount: true,
        currency: true,
        status: true,
        stage: true,
        images: true,
        depositPercentage: true,
        depositAmount: true,
        depositPaid: true,
        depositPaidAt: true,
        finalPaymentReceived: true,
        finalPaymentAt: true,
        createdAt: true,
        updatedAt: true,
        clients: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        companies: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        quotations: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            items: true,
            total: true,
            currency: true,
            notes: true,
            file: true,
            fileName: true,
            fileSize: true,
            accepted: true,
            rejectedReason: true,
            clientComment: true,
            reviewedAt: true,
            createdAt: true,
            updatedAt: true,
            users: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        purchase_orders: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            poNumber: true,
            poFile: true,
            depositProofFile: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        payments: {
          orderBy: { paidAt: "desc" },
          select: {
            id: true,
            paymentType: true,
            amount: true,
            currency: true,
            paymentMethod: true,
            reference: true,
            notes: true,
            paidAt: true,
            createdAt: true,
          },
        },
        delivery_notes: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            dnNumber: true,
            dnFile: true,
            items: true,
            deliveredAt: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        order_histories: {
          orderBy: { createdAt: "desc" },
          take: 10, // Limit to 10 most recent for performance
          select: {
            id: true,
            actorId: true,
            actorName: true,
            action: true,
            payload: true,
            createdAt: true,
          },
        },
      },
    });
    
    return order;
  } catch (error) {
    // Server component - use logger if available
    if (typeof window === 'undefined') {
      const { logger } = await import("@/lib/logger");
      logger.error("Error fetching order", error, "dashboard");
    }
    return null;
  }
}

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

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Check authentication
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  
  // Await params in Next.js 15
  const { id } = await params;
  
  const order = await getOrder(id);

  if (!order) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </Link>

        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
              <p className="text-muted-foreground mb-6">
                This order doesn&apos;t exist or database is not connected yet.
              </p>
              <Link href="/dashboard/orders">
                <Button>View All Orders</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" suppressHydrationWarning>
        <div className="flex items-center gap-4" suppressHydrationWarning>
          <Link href="/dashboard/orders">
            <Button variant="outline" size="sm" className="hover:bg-blue-50 dark:hover:bg-blue-950" suppressHydrationWarning>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </Link>
          <div suppressHydrationWarning>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Order #{order.id}
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Created {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap" suppressHydrationWarning>
          <a href={`/api/orders/export?orderId=${order.id}&format=excel`} download>
            <Button variant="outline" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0">
              <FileDown className="h-4 w-4 mr-2" />
              Export Full Report
            </Button>
          </a>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" suppressHydrationWarning>
              Dashboard Home
            </Button>
          </Link>
          <Badge 
            variant={getStatusBadgeVariant(order.status)} 
            suppressHydrationWarning
            className={`
              text-base px-5 py-2
              ${order.status === "COMPLETED" ? "bg-green-600" :
                order.status === "PENDING" ? "bg-amber-500" :
                order.status === "APPROVED" ? "bg-blue-600" :
                order.status === "QUOTATION_SENT" ? "bg-purple-600" :
                ""}
            `}
          >
            {order.status}
          </Badge>
        </div>
      </div>

      {/* Main Layout: Tabs (3/4) + Sidebar (1/4) */}
      <div className="grid gap-6 lg:grid-cols-4" suppressHydrationWarning>
        <div className="lg:col-span-3" suppressHydrationWarning>
          <OrderDetailsTabs order={order} />
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6" suppressHydrationWarning>
          {/* Update Stage */}
          <UpdateStage orderId={order.id} currentStage={order.stage || "RECEIVED"} />
          
          {/* Quick Actions */}
          <Card className="border-2" suppressHydrationWarning>
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30" suppressHydrationWarning>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-6" suppressHydrationWarning>
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
