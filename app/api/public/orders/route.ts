import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/validators/order";
import { generatePublicToken } from "@/lib/token-generator";
import { rateLimiter, RATE_LIMITS, getClientIp } from "@/lib/rate-limit";
import { OrderStatus, UserRole } from "@prisma/client";
import { sendEmail, getOrderConfirmationEmail } from "@/lib/email";
import { sanitizeText } from "@/lib/security";
import { handleApiError } from "@/lib/error-handler";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimit = await rateLimiter.check(
      `public-order:${clientIp}`,
      RATE_LIMITS.PUBLIC_ORDER_CREATE.limit,
      RATE_LIMITS.PUBLIC_ORDER_CREATE.windowMs
    );

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: new Date(rateLimit.resetAt).toISOString(),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": RATE_LIMITS.PUBLIC_ORDER_CREATE.limit.toString(),
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
            "X-RateLimit-Reset": rateLimit.resetAt.toString(),
          },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    
    // Sanitize input before validation
    if (body.name) body.name = sanitizeText(body.name);
    if (body.phone) body.phone = sanitizeText(body.phone);
    if (body.email) body.email = sanitizeText(body.email);
    if (body.details) body.details = sanitizeText(body.details);
    if (body.items && Array.isArray(body.items)) {
      body.items = body.items.map((item: any) => ({
        ...item,
        name: sanitizeText(item.name || ""),
        specs: item.specs ? sanitizeText(item.specs) : undefined,
      }));
    }
    
    const validation = createOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { name, phone, email, details, items } = validation.data;

    // Use transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Find or create client by phone (de-duplication)
      let client = await tx.clients.findUnique({
        where: { phone },
      });

      if (!client) {
        client = await tx.clients.create({
          data: {
            name,
            phone,
            email: email || null,
            updatedAt: new Date(),
          },
        });
      } else {
        // Update client info if provided
        client = await tx.clients.update({
          where: { id: client.id },
          data: {
            name,
            email: email || client.email,
            updatedAt: new Date(),
          },
        });
      }

      // Get first company (or create one if none exists)
      // In production, you might want to determine company by subdomain or site context
      let company = await tx.companies.findFirst();
      
      if (!company) {
        // Create default company if none exists
        company = await tx.companies.create({
          data: {
            name: "Default Company",
            slug: "default-company",
            updatedAt: new Date(),
          },
        });
      }
      
      const companyId = company.id;

      // Generate unique public token
      let publicToken = generatePublicToken();
      let tokenExists = await tx.orders.findUnique({
        where: { publicToken },
      });

      // Ensure token is unique
      while (tokenExists) {
        publicToken = generatePublicToken();
        tokenExists = await tx.orders.findUnique({
          where: { publicToken },
        });
      }

      // Create order
      const order = await tx.orders.create({
        data: {
          companyId: companyId,
          clientId: client.id,
          publicToken,
          details: details || undefined,
          items: items || undefined,
          status: OrderStatus.PENDING,
          currency: "AED",
          updatedAt: new Date(),
        },
      });

      // Create order history entry
      await tx.order_histories.create({
        data: {
          orderId: order.id,
          actorName: client.name,
          action: "client_created_order",
          payload: {
            phone: client.phone,
            details: details || "",
            itemCount: items?.length || 0,
          },
        },
      });

      // Create notifications for company admins and brokers
      const companyUsers = await tx.users.findMany({
        where: {
          companyId: companyId,
          role: UserRole.ADMIN,
        },
      });

      // Create notification for each admin/broker
      await Promise.all(
        companyUsers.map((user) =>
          tx.notifications.create({
            data: {
              companyId: companyId,
              userId: user.id,
              title: `New Order from ${client.name}`,
              body: `Order #${order.id} - ${details || "No details provided"}`,
              meta: {
                orderId: order.id,
                clientName: client.name,
                clientPhone: client.phone,
              },
              read: false,
            },
          })
        )
      );

      return { order, client, companyId };
    });

    // Emit Socket.io event for real-time notification
    if (global.io) {
      global.io.to(`company_${result.companyId}`).emit("new_notification", {
        orderId: result.order.id,
        title: `New Order from ${result.client.name}`,
        body: `Order #${result.order.id} created`,
        type: "new_order",
      });
      console.log(`🔌 Emitted new_order notification to company_${result.companyId}`);
    }

    const trackingUrl = `${request.nextUrl.origin}/order/track/${result.order.publicToken}`;

    // Send confirmation email to client (async, non-blocking)
    if (result.client.email) {
      const company = await prisma.companies.findUnique({
        where: { id: result.order.companyId },
        select: { name: true },
      });

      sendEmail({
        to: result.client.email,
        ...getOrderConfirmationEmail({
          clientName: result.client.name,
          orderNumber: result.order.id,
          trackingUrl,
          companyName: company?.name || "ATA CRM",
        }),
      }).catch((error) => {
        console.error("Failed to send confirmation email:", error);
        // Don't fail the request if email fails
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          orderId: result.order.id,
          publicToken: result.order.publicToken,
          trackingUrl,
        },
        message: "Order created successfully",
      },
      {
        status: 201,
        headers: {
          "X-RateLimit-Limit": RATE_LIMITS.PUBLIC_ORDER_CREATE.limit.toString(),
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          "X-RateLimit-Reset": rateLimit.resetAt.toString(),
        },
      }
    );
  } catch (error) {
    // handleApiError already logs errors and handles development details
    return handleApiError(error);
  }
}

