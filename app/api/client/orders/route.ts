import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { handleApiError } from "@/lib/error-handler";

async function getClientFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get("client-token")?.value;
    
    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "secret");
    const { payload } = await jwtVerify(token, secret);

    if (payload.type !== "client" || !payload.clientId) {
      return null;
    }

    return payload.clientId as number;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  // Build-time probe safe response
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const clientId = await getClientFromToken(request);

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // ✅ Performance: Use select to fetch only needed fields
    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where: { clientId },
        select: {
          id: true,
          status: true,
          stage: true,
          items: true,
          details: true,
          totalAmount: true,
          currency: true,
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
              name: true,
              email: true,
              phone: true,
            },
          },
        companies: {
          select: {
            name: true,
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
            accepted: true,
            reviewedAt: true,
            rejectedReason: true,
            clientComment: true,
            createdAt: true,
          },
        },
        purchase_orders: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            poNumber: true,
            poFile: true,
            notes: true,
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
          },
        },
        order_histories: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            actorName: true,
            action: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" }, // Newest orders first
      skip,
      take: limit,
      }),
      prisma.orders.count({ where: { clientId } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}





