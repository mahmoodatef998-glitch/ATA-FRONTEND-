import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // During Next.js production build, Next may probe API routes to "collect page data".
    // This route is admin-protected; avoid throwing during build probes.
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return NextResponse.json({ success: true, ok: true }, { status: 200 });
    }

    const [{ requireRole }, { UserRole }, { prisma }] = await Promise.all([
      import("@/lib/auth-helpers"),
      import("@prisma/client"),
      import("@/lib/prisma"),
    ]);

    const session = await requireRole([UserRole.ADMIN]);

    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get("status") || "PENDING"; // PENDING, APPROVED, REJECTED
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Use string directly (Prisma will handle enum conversion)
    const accountStatus = statusParam.toUpperCase();

    const where: any = {
      hasAccount: true,
      accountStatus: accountStatus,
    };

    const [clients, total] = await Promise.all([
      prisma.clients.findMany({
        where,
        include: {
          approvedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          orders: {
            select: {
              id: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.clients.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        clients,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching pending clients:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

