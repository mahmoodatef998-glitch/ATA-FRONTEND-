import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";

export async function GET(request: NextRequest) {
  // Build-time probe safe response
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const { userId, companyId } = await authorize(PermissionAction.LEAD_READ);

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    // Get orders
    const orders = await prisma.orders.findMany({
      where: {
        companyId,
        ...(startDate && endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      },
      include: {
        clients: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get delivery notes
    const deliveryNotes = await prisma.delivery_notes.findMany({
      where: {
        orders: {
          companyId,
        },
        ...(startDate && endDate && {
          OR: [
            { deliveredAt: { gte: new Date(startDate), lte: new Date(endDate) } },
            { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } },
          ],
        }),
      },
      include: {
        orders: {
          select: {
            id: true,
            clients: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        orders,
        deliveryNotes,
      },
    });
  } catch (error) {
    console.error("Error fetching calendar data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch calendar data" },
      { status: 500 }
    );
  }
}

