import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Download, DollarSign, Package, Eye } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { Link } from "@/components/ui/link";
import { UserRole } from "@prisma/client";

async function getPurchaseOrdersAndPayments(companyId: number) {
  try {
    // Get all purchase orders with order and client info
    const purchaseOrders = await prisma.purchase_orders.findMany({
      where: {
        orders: {
          companyId,
        },
      },
      include: {
        orders: {
          select: {
            id: true,
            totalAmount: true,
            currency: true,
            clients: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
              },
            },
            payments: {
              select: {
                id: true,
                paymentType: true,
                amount: true,
                currency: true,
                paymentMethod: true,
                reference: true,
                paidAt: true,
                createdAt: true,
              },
              orderBy: {
                paidAt: "desc",
              },
            },
            depositAmount: true,
            depositPaid: true,
            finalPaymentReceived: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get all payments with order and client info
    const allPayments = await prisma.payments.findMany({
      where: {
        orders: {
          companyId,
        },
      },
      include: {
        orders: {
          select: {
            id: true,
            totalAmount: true,
            currency: true,
            clients: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        paidAt: "desc",
      },
    });

    return {
      purchaseOrders,
      payments: allPayments,
    };
  } catch (error) {
    console.error("Error fetching purchase orders and payments:", error);
    return {
      purchaseOrders: [],
      payments: [],
    };
  }
}

export default async function PurchaseOrdersPage() {
  const session = await auth();
  
  if (!session || !session.user) {
    redirect("/login");
  }

  // Only ACCOUNTANT and ADMIN can access this page
  if (session.user.role !== UserRole.ACCOUNTANT && session.user.role !== UserRole.ADMIN) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                Only accountants and administrators can access this page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = await getPurchaseOrdersAndPayments(session.user.companyId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
          Purchase Orders & Payments
        </h1>
        <p className="text-muted-foreground mt-2">
          View and manage purchase orders and payment records
        </p>
      </div>

      {/* Purchase Orders Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Purchase Orders ({data.purchaseOrders.length})
          </CardTitle>
          <CardDescription>
            All purchase orders from clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.purchaseOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No purchase orders found
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Order Total</TableHead>
                    <TableHead>PO Files</TableHead>
                    <TableHead>Deposit Proof</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.purchaseOrders.map((po) => {
                    // Parse PO files
                    let poFiles: string[] = [];
                    try {
                      const parsed = po.poFile ? JSON.parse(po.poFile) : null;
                      poFiles = Array.isArray(parsed) ? parsed : po.poFile ? [po.poFile] : [];
                    } catch {
                      poFiles = po.poFile ? [po.poFile] : [];
                    }

                    // Parse deposit proof files
                    let depositFiles: string[] = [];
                    try {
                      const parsed = po.depositProofFile ? JSON.parse(po.depositProofFile) : null;
                      depositFiles = Array.isArray(parsed) ? parsed : po.depositProofFile ? [po.depositProofFile] : [];
                    } catch {
                      depositFiles = po.depositProofFile ? [po.depositProofFile] : [];
                    }

                    return (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">
                          {po.poNumber}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/dashboard/orders/${po.orderId}`}
                            className="text-blue-600 hover:underline"
                          >
                            #{po.orderId}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {po.orders.clients?.name || "N/A"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {po.orders.clients?.phone || ""}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(
                            po.orders.totalAmount || 0,
                            po.orders.currency || "AED"
                          )}
                        </TableCell>
                        <TableCell>
                          {poFiles.length > 0 ? (
                            <Badge variant="default" className="bg-green-600">
                              {poFiles.length} file(s)
                            </Badge>
                          ) : (
                            <Badge variant="secondary">No files</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {depositFiles.length > 0 ? (
                            <Badge variant="default" className="bg-blue-600">
                              {depositFiles.length} file(s)
                            </Badge>
                          ) : (
                            <Badge variant="secondary">No files</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(po.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/orders/${po.orderId}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payments ({data.payments.length})
          </CardTitle>
          <CardDescription>
            All payment records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payments found
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Paid At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        #{payment.id}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/orders/${payment.orderId}`}
                          className="text-blue-600 hover:underline"
                        >
                          #{payment.orderId}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {payment.orders.clients?.name || "N/A"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {payment.orders.clients?.phone || ""}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.paymentType === "DEPOSIT"
                              ? "default"
                              : payment.paymentType === "FINAL"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            payment.paymentType === "DEPOSIT"
                              ? "bg-blue-600"
                              : payment.paymentType === "FINAL"
                              ? "bg-green-600"
                              : ""
                          }
                        >
                          {payment.paymentType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(
                          payment.amount,
                          payment.currency || "AED"
                        )}
                      </TableCell>
                      <TableCell>
                        {payment.paymentMethod || "N/A"}
                      </TableCell>
                      <TableCell>
                        {payment.reference || "N/A"}
                      </TableCell>
                      <TableCell>
                        {formatDateTime(payment.paidAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/orders/${payment.orderId}`}>
                          <Button variant="outline" size="sm">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

