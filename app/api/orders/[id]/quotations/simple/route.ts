import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { OrderStatus, UserRole } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require ADMIN role
    const session = await requireRole([UserRole.ADMIN]);

    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { success: false, error: "Invalid order ID" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { total, currency, notes } = body;

    if (!total || total <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid total amount is required" },
        { status: 400 }
      );
    }

    // Check if order exists and user has access
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: { clients: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Authorization: Check company access
    if (order.companyId !== session.user.companyId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Access denied" },
        { status: 403 }
      );
    }

    // Create quotation (simplified - no items needed)
    const quotation = await prisma.quotations.create({
      data: {
        orderId,
        createdById: typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id,
        items: [], // Empty for now - file will contain details
        total: parseFloat(total),
        currency: currency || "AED",
        notes: notes || null,
        accepted: null, // Pending review
        updatedAt: new Date(),
      },
    });

    // Update order total
    await prisma.orders.update({
      where: { id: orderId },
      data: {
        totalAmount: parseFloat(total),
        currency: currency || "AED",
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: quotation,
        message: "Quotation created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating quotation:", error);

    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? {
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined
        } : undefined
      },
      { status: 500 }
    );
  }
}

