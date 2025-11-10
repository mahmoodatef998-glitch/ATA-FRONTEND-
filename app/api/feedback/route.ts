import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, clientId, rating, serviceQuality, deliveryExperience, comments, wouldRecommend } = body;

    // Validation
    if (!orderId || !clientId || !rating) {
      return NextResponse.json(
        { success: false, error: "Order ID, Client ID, and rating are required" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if order exists and is completed
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

    if (order.status !== "COMPLETED") {
      return NextResponse.json(
        { success: false, error: "Can only provide feedback for completed orders" },
        { status: 400 }
      );
    }

    if (order.clientId !== clientId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Create feedback
    const feedback = await prisma.order_feedback.create({
      data: {
        orderId,
        clientId,
        rating,
        serviceQuality: serviceQuality || null,
        deliveryExperience: deliveryExperience || null,
        comments: comments || null,
        wouldRecommend: wouldRecommend !== undefined ? wouldRecommend : null,
        createdAt: new Date(),
      },
    });

    // Create notification for admins
    const companyAdmins = await prisma.users.findMany({
      where: {
        companyId: order.companyId,
        role: "ADMIN",
      },
    });

    await Promise.all(
      companyAdmins.map((admin) =>
        prisma.notifications.create({
          data: {
            companyId: order.companyId,
            userId: admin.id,
            title: `New Feedback: Order #${orderId}`,
            body: `${order.clients?.name} rated ${rating}/5 stars`,
            meta: {
              orderId,
              rating,
              feedbackId: feedback.id,
            },
            read: false,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully",
      data: feedback,
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID required" },
        { status: 400 }
      );
    }

    const feedback = await prisma.order_feedback.findFirst({
      where: { orderId: parseInt(orderId) },
      include: {
        clients: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}



