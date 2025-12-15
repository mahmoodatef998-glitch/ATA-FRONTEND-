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
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OrderFilters } from "@/components/dashboard/order-filters";

// Fetch orders from API
async function getOrders(searchParams: Promise<any>) {
  try {
    // Use direct Prisma query instead of API call (server component)
    const { prisma } = await import("@/lib/prisma");
    
    // Await searchParams in Next.js 15
    const params = await searchParams;
    
    const page = parseInt(params.page || "1");
    const limit = parseInt(params.limit || "20");
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    // Add filters
    if (params.processing === "true") {
      // Processing = all orders that are not completed or cancelled (in development)
      where.status = { notIn: ["COMPLETED", "CANCELLED"] };
    } else if (params.status && params.status !== "") {
      where.status = params.status;
    }
    
    // Advanced search - Full-text search in multiple fields
    if (params.search && params.search !== "") {
      const searchTerm = params.search.trim();
      where.OR = [
        { id: { equals: isNaN(parseInt(searchTerm)) ? -1 : parseInt(searchTerm) } },
        { details: { contains: searchTerm, mode: "insensitive" } },
        { clients: { name: { contains: searchTerm, mode: "insensitive" } } },
        { clients: { phone: { contains: searchTerm } } },
        { clients: { email: { contains: searchTerm, mode: "insensitive" } } },
        { purchase_orders: { some: { poNumber: { contains: searchTerm, mode: "insensitive" } } } },
        { quotations: { some: { id: { equals: isNaN(parseInt(searchTerm)) ? -1 : parseInt(searchTerm) } } } },
        { delivery_notes: { some: { dnNumber: { contains: searchTerm, mode: "insensitive" } } } },
      ];
    }
    
    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        include: {
          clients: {
            select: {
              name: true,
              phone: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.orders.count({ where }),
    ]);
    
    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return {
      orders: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
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

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  // Check authentication
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  
  const data = await getOrders(searchParams);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Orders Management
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Track and manage all client orders in real-time
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              Dashboard
            </Button>
          </Link>
          <a href="/api/orders/export?format=excel" download>
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
              <FileDown className="h-4 w-4 mr-2" />
              Export All Orders
            </Button>
          </a>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2 border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {data.pagination.total}
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
                <p className="text-sm font-medium text-muted-foreground">Processing</p>
                <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                  {data.orders.filter((o: any) => o.status !== "COMPLETED" && o.status !== "CANCELLED").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-purple-200 dark:border-purple-900 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quotations</p>
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                  {data.orders.filter((o: any) => o.status === "QUOTATION_SENT").length}
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
                  {data.orders.filter((o: any) => o.status === "COMPLETED").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

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
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No orders found. Create your first order to see it here!
                    </TableCell>
                  </TableRow>
                ) : (
                  data.orders.map((order: any) => (
                    <TableRow key={order.id} className="group hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors">
                      <TableCell className="font-bold text-blue-600 dark:text-blue-400">
                        #{order.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{order.clients?.name || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.clients?.phone || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusBadgeVariant(order.status)}
                          className={
                            order.status === "COMPLETED" ? "bg-green-600" :
                            order.status === "PENDING" ? "bg-amber-500" :
                            order.status === "APPROVED" ? "bg-blue-600" :
                            order.status === "QUOTATION_SENT" ? "bg-purple-600" :
                            ""
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {order.totalAmount
                          ? `${order.totalAmount} ${order.currency}`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/orders/${order.id}`}>
                          <Button 
                            variant="default" 
                            size="sm"
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 group-hover:scale-105 transition-transform"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(data.pagination.page - 1) * data.pagination.limit + 1} to{" "}
                {Math.min(
                  data.pagination.page * data.pagination.limit,
                  data.pagination.total
                )}{" "}
                of {data.pagination.total} orders
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={data.pagination.page === 1}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.pagination.page >= data.pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

