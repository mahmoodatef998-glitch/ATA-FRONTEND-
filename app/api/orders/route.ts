import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { ordersQuerySchema } from "@/lib/validators/order";
import { UserRole, Prisma, OrderStatus } from "@prisma/client";
import { applyRateLimit, RATE_LIMITS, getRateLimitHeaders } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/error-handler";
import { getCached } from "@/lib/cache";

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get list of orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, QUOTATION_SENT, COMPLETED, CANCELLED]
 *         description: Filter by order status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by client name or phone
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: array
 *                     pagination:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const { response: rateLimitResponse, rateLimitInfo } = await applyRateLimit(request, RATE_LIMITS.API_GENERAL);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // التحقق من صلاحية عرض الطلبات
    const { userId, companyId } = await authorize(PermissionAction.LEAD_READ);

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

    const { page, limit, status, search } = validation.data;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause with proper Prisma types
    // companyId comes from authorize() above
    const where: Prisma.ordersWhereInput = {
      companyId: companyId,
    };

    // Filter by status
    if (status) {
      where.status = status as OrderStatus;
    }

    // Search by client name or phone
    if (search) {
      where.clients = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
        ],
      };
    }

    // Create cache key based on user, company, and filters
    const cacheKey = `orders:${userId}:${companyId}:${JSON.stringify({
      page,
      limit,
      status,
      search,
    })}`;

    // Use cached data if available (1 minute cache for order lists)
    const result = await getCached(
      cacheKey,
      async () => {
        // ✅ Performance: Use select instead of include to fetch only needed fields
        const [orders, total] = await Promise.all([
          prisma.orders.findMany({
            where,
            select: {
              id: true,
              status: true,
              stage: true,
              totalAmount: true,
              currency: true,
              createdAt: true,
              updatedAt: true,
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
                  purchase_orders: true,
                  delivery_notes: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: parseInt(limit),
          }),
          prisma.orders.count({ where }),
        ]);

        return {
          orders,
          total,
        };
      },
      60 // 1 minute cache TTL for order lists
    );

    const { orders, total } = result;

    // Get rate limit headers (from the check we already did)
    const rateLimitHeaders = rateLimitInfo 
      ? getRateLimitHeaders(rateLimitInfo.remaining, rateLimitInfo.resetAt, rateLimitInfo.limit)
      : {};

    const response = NextResponse.json({
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

    // Add rate limit headers
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

