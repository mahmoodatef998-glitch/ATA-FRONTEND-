import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch all orders for the company
    const orders = await prisma.orders.findMany({
      where: {
        companyId: session.user.companyId,
      },
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
    });

    // Convert to CSV format
    const csvRows = [];
    
    // Header
    csvRows.push([
      "Order ID",
      "Client Name",
      "Client Phone",
      "Client Email",
      "Status",
      "Stage",
      "Total Amount",
      "Currency",
      "Created Date",
      "Updated Date",
    ].join(","));

    // Data rows
    orders.forEach((order) => {
      csvRows.push([
        order.id,
        `"${order.clients?.name || "N/A"}"`,
        order.clients?.phone || "N/A",
        order.clients?.email || "N/A",
        order.status,
        order.stage || "N/A",
        order.totalAmount || 0,
        order.currency,
        new Date(order.createdAt).toLocaleDateString(),
        new Date(order.updatedAt).toLocaleDateString(),
      ].join(","));
    });

    const csv = csvRows.join("\n");

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ATA_CRM_Orders_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export orders" },
      { status: 500 }
    );
  }
}






