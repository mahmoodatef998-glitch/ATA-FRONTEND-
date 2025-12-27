import { NextResponse } from "next/server";

/**
 * OpenAPI Specification Endpoint
 * Returns OpenAPI 3.0 spec for API documentation
 * Can be imported into Postman, Swagger Editor, or other API tools
 */
export async function GET() {
  // Build-time probe safe response
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  const baseUrl = process.env.NEXTAUTH_URL || "https://ata-frontend-pied.vercel.app";

  const spec = {
    openapi: "3.0.0",
    info: {
      title: "ATA CRM API",
      version: "1.0.0",
      description: "ATA CRM API Documentation - Complete API reference for all endpoints",
      contact: {
        name: "ATA CRM Support",
        email: "support@ata-crm.com",
      },
    },
    servers: [
      {
        url: baseUrl,
        description: "Production server",
      },
      {
        url: "http://localhost:3005",
        description: "Development server",
      },
    ],
    paths: {
      "/api/public/orders": {
        post: {
          summary: "Create public order",
          description: "Create a new order from public link (no authentication required)",
          tags: ["Public Orders"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "phone"],
                  properties: {
                    name: {
                      type: "string",
                      description: "Client name",
                      example: "Ahmed Ali",
                    },
                    phone: {
                      type: "string",
                      description: "Client phone number",
                      example: "+971501234567",
                    },
                    email: {
                      type: "string",
                      format: "email",
                      description: "Client email (optional)",
                      example: "ahmed@example.com",
                    },
                    details: {
                      type: "string",
                      description: "Order details",
                      example: "Need generator for office",
                    },
                    items: {
                      type: "array",
                      description: "Order items",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          quantity: { type: "number" },
                          specs: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Order created successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: {
                        type: "object",
                        properties: {
                          orderId: { type: "number" },
                          publicToken: { type: "string" },
                          trackingUrl: { type: "string" },
                        },
                      },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid request data",
            },
            "429": {
              description: "Rate limit exceeded",
            },
          },
        },
        get: {
          summary: "Get API status",
          description: "Check if Public Orders API is available",
          tags: ["Public Orders"],
          responses: {
            "200": {
              description: "API is available",
            },
          },
        },
      },
      "/api/public/orders/track/{token}": {
        get: {
          summary: "Track order by public token",
          description: "Get order details using public tracking token",
          tags: ["Public Orders"],
          parameters: [
            {
              name: "token",
              in: "path",
              required: true,
              schema: {
                type: "string",
              },
              description: "Public order tracking token",
            },
          ],
          responses: {
            "200": {
              description: "Order details",
            },
            "404": {
              description: "Order not found",
            },
          },
        },
      },
      "/api/auth/[...nextauth]": {
        get: {
          summary: "NextAuth.js endpoints",
          description: "Authentication endpoints (login, logout, session, etc.)",
          tags: ["Authentication"],
        },
      },
      "/api/dashboard/analytics": {
        get: {
          summary: "Get dashboard analytics",
          description: "Get dashboard statistics and analytics (requires authentication)",
          tags: ["Dashboard"],
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "Analytics data",
            },
            "401": {
              description: "Unauthorized",
            },
          },
        },
      },
      "/api/orders": {
        get: {
          summary: "Get all orders",
          description: "Get list of all orders (requires authentication)",
          tags: ["Orders"],
          security: [{ bearerAuth: [] }],
          responses: {
            "200": {
              description: "List of orders",
            },
          },
        },
      },
      "/api/cron/daily-report": {
        get: {
          summary: "Generate daily report",
          description: "Generate and send daily report (cron job endpoint)",
          tags: ["Cron Jobs"],
          responses: {
            "200": {
              description: "Report generated",
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    tags: [
      {
        name: "Public Orders",
        description: "Public order creation and tracking",
      },
      {
        name: "Authentication",
        description: "User authentication and session management",
      },
      {
        name: "Dashboard",
        description: "Dashboard data and analytics",
      },
      {
        name: "Orders",
        description: "Order management (authenticated)",
      },
      {
        name: "Cron Jobs",
        description: "Scheduled tasks and cron jobs",
      },
    ],
  };

  return NextResponse.json(spec, {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}



