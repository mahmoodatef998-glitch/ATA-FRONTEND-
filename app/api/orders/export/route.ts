import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import * as XLSX from "xlsx";
import { formatDateTime } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { userId, companyId } = await authorize(PermissionAction.LEAD_READ);

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "excel"; // excel or pdf
    const orderId = searchParams.get("orderId");

    // If orderId is provided, export single order comprehensive report
    if (orderId) {
      const order = await prisma.orders.findUnique({
        where: { 
          id: parseInt(orderId),
          companyId,
        },
        include: {
          clients: true,
          companies: true,
          quotations: {
            orderBy: { createdAt: "desc" },
          },
          purchase_orders: {
            orderBy: { createdAt: "desc" },
          },
          delivery_notes: {
            orderBy: { createdAt: "desc" },
          },
          payments: {
            orderBy: { paidAt: "desc" },
          },
          order_histories: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!order) {
        return NextResponse.json(
          { success: false, error: "Order not found" },
          { status: 404 }
        );
      }

      if (format === "excel") {
        return exportOrderToExcel(order);
      } else {
        return exportOrderToPDF(order);
      }
    }

    // Export all orders summary
    const orders = await prisma.orders.findMany({
      where: { companyId },
      include: {
        clients: { select: { name: true, phone: true, email: true } },
        quotations: { select: { id: true, total: true, accepted: true, createdAt: true } },
        purchase_orders: { select: { poNumber: true, createdAt: true } },
        delivery_notes: { select: { dnNumber: true, createdAt: true } },
        payments: { select: { paymentType: true, amount: true, paidAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (format === "excel") {
      return exportOrdersToExcel(orders);
    } else {
      return exportOrdersToPDF(orders);
    }
  } catch (error) {
    console.error("Error exporting orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export orders" },
      { status: 500 }
    );
  }
}

function exportOrderToExcel(order: any) {
  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Order Overview Sheet
  const overviewData = [
    ["Order Comprehensive Report"],
    [],
    ["Order Information"],
    ["Order ID", order.id],
    ["Order Status", order.status],
    ["Order Stage", order.stage],
    ["Client Name", order.clients?.name || "N/A"],
    ["Client Phone", order.clients?.phone || "N/A"],
    ["Client Email", order.clients?.email || "N/A"],
    ["Company", order.companies?.name || "N/A"],
    ["Total Amount", order.totalAmount ? `${order.totalAmount} ${order.currency}` : "N/A"],
    ["Created At", formatDateTime(order.createdAt)],
    ["Updated At", formatDateTime(order.updatedAt)],
    [],
    ["Order Details", order.details || "N/A"],
    [],
  ];

  // Quotations Sheet
  const quotationsData = [
    ["Quotations"],
    ["ID", "Total", "Currency", "Accepted", "Created At"],
    ...order.quotations.map((q: any) => [
      q.id,
      q.total,
      q.currency || "AED",
      q.accepted === true ? "Yes" : q.accepted === false ? "No" : "Pending",
      formatDateTime(q.createdAt),
    ]),
  ];

  // Purchase Orders Sheet
  const poData = [
    ["Purchase Orders"],
    ["PO Number", "Created At", "Notes"],
    ...order.purchase_orders.map((po: any) => [
      po.poNumber,
      formatDateTime(po.createdAt),
      po.notes || "N/A",
    ]),
  ];

  // Delivery Notes Sheet
  const dnData = [
    ["Delivery Notes"],
    ["DN Number", "Delivered At", "Created At", "Notes"],
    ...order.delivery_notes.map((dn: any) => [
      dn.dnNumber,
      dn.deliveredAt ? formatDateTime(dn.deliveredAt) : "N/A",
      formatDateTime(dn.createdAt),
      dn.notes || "N/A",
    ]),
  ];

  // Payments Sheet
  const paymentsData = [
    ["Payments"],
    ["Type", "Amount", "Currency", "Payment Method", "Reference", "Paid At"],
    ...order.payments.map((p: any) => [
      p.paymentType,
      p.amount,
      p.currency || "AED",
      p.paymentMethod || "N/A",
      p.reference || "N/A",
      formatDateTime(p.paidAt),
    ]),
  ];

  // Order History Sheet (Full Lifecycle)
  const historyData = [
    ["Order Lifecycle - Complete History"],
    ["Date", "Actor", "Action", "Details"],
    ...order.order_histories.map((h: any) => [
      formatDateTime(h.createdAt),
      h.actorName || "System",
      h.action,
      JSON.stringify(h.payload || {}),
    ]),
  ];

  // Create sheets
  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
  const quotationsSheet = XLSX.utils.aoa_to_sheet(quotationsData);
  const poSheet = XLSX.utils.aoa_to_sheet(poData);
  const dnSheet = XLSX.utils.aoa_to_sheet(dnData);
  const paymentsSheet = XLSX.utils.aoa_to_sheet(paymentsData);
  const historySheet = XLSX.utils.aoa_to_sheet(historyData);

  // Add sheets to workbook
  XLSX.utils.book_append_sheet(workbook, overviewSheet, "Overview");
  XLSX.utils.book_append_sheet(workbook, quotationsSheet, "Quotations");
  XLSX.utils.book_append_sheet(workbook, poSheet, "Purchase Orders");
  XLSX.utils.book_append_sheet(workbook, dnSheet, "Delivery Notes");
  XLSX.utils.book_append_sheet(workbook, paymentsSheet, "Payments");
  XLSX.utils.book_append_sheet(workbook, historySheet, "Lifecycle");

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Order_${order.id}_Comprehensive_Report.xlsx"`,
    },
  });
}

function exportOrdersToExcel(orders: any[]) {
  const data = [
    [
      "Order ID",
      "Status",
      "Stage",
      "Client Name",
      "Client Phone",
      "Client Email",
      "Total Amount",
      "Currency",
      "Quotations",
      "POs",
      "Delivery Notes",
      "Payments",
      "Created At",
      "Updated At",
    ],
    ...orders.map((order) => [
      order.id,
      order.status,
      order.stage,
      order.clients?.name || "N/A",
      order.clients?.phone || "N/A",
      order.clients?.email || "N/A",
      order.totalAmount || 0,
      order.currency || "AED",
      order.quotations.length,
      order.purchase_orders.length,
      order.delivery_notes.length,
      order.payments.length,
      formatDateTime(order.createdAt),
      formatDateTime(order.updatedAt),
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "All Orders");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="All_Orders_Report_${new Date().toISOString().split("T")[0]}.xlsx"`,
    },
  });
}

function exportOrderToPDF(order: any) {
  // For now, return Excel format (PDF requires additional library setup)
  return exportOrderToExcel(order);
}

function exportOrdersToPDF(orders: any[]) {
  // For now, return Excel format (PDF requires additional library setup)
  return exportOrdersToExcel(orders);
}
