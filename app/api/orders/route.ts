import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-helpers";
import { ordersQuerySchema } from "@/lib/validators/order";
import { UserRole } from "@prisma/client";

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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const validation = ordersQuerySchema.safeParse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      companyId: searchParams.get("companyId") || undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { page, limit, status, search, companyId } = validation.data;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where: any = {};

    // Filter by company
    where.companyId = session.user.companyId;

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Search by client name or phone
    if (search) {
      where.client = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
        ],
      };
    }

    // Fetch orders with pagination
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
          _count: {
            select: {
              quotations: true,
              order_histories: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.orders.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while fetching orders" },
      { status: 500 }
    );
  }
}

