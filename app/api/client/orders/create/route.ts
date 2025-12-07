import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePublicToken } from "@/lib/token-generator";
import { OrderStatus } from "@prisma/client";
import { jwtVerify } from "jose";
import { sendEmail, getOrderConfirmationEmail } from "@/lib/email";
import { uploadFile, isCloudinaryConfigured } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📨 [API] Client order creation request received");
    
    // Verify client authentication via JWT token
    const token = request.cookies.get("client-token")?.value;

    if (!token) {
      console.error("❌ [API] No client token found");
      return NextResponse.json(
        { success: false, error: "Unauthorized - Please login first" },
        { status: 401 }
      );
    }
    
    console.log("✅ [API] Client token found");

    // Verify JWT
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "secret");
    let clientData;
    
    try {
      const { payload } = await jwtVerify(token, secret);
      clientData = payload;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid session - Please login again" },
        { status: 401 }
      );
    }

    if (!clientData.clientId || clientData.type !== "client") {
      return NextResponse.json(
        { success: false, error: "Invalid client session" },
        { status: 401 }
      );
    }

    // Parse request body (FormData or JSON)
    const contentType = request.headers.get("content-type");
    let items;
    let uploadedFiles: string[] = [];

    if (contentType?.includes("multipart/form-data")) {
      // Handle FormData (with files)
      const formData = await request.formData();
      const itemsJson = formData.get("items");
      
      if (!itemsJson) {
        return NextResponse.json(
          { success: false, error: "Items data required" },
          { status: 400 }
        );
      }

      items = JSON.parse(itemsJson as string);

      // Process uploaded files - Use Cloudinary if configured, otherwise local storage
      const { writeFile, mkdir } = await import("fs/promises");
      const { join } = await import("path");
      
      const uploadDir = join(process.cwd(), "public", "uploads", "orders");
      
      // Ensure directory exists (for local storage fallback)
      if (!isCloudinaryConfigured()) {
        try {
          await mkdir(uploadDir, { recursive: true });
        } catch (err) {
          console.error("Error creating upload directory:", err);
        }
      }
      
      for (let i = 0; i < 5; i++) {
        const file = formData.get(`file_${i}`) as File;
        if (file) {
          try {
            if (isCloudinaryConfigured()) {
              // Upload to Cloudinary
              const result = await uploadFile(file, "orders", {
                resource_type: "auto",
                public_id: `order_${Date.now()}_${i}`,
              });
              uploadedFiles.push(result.secure_url);
              console.log(`✅ [Order Create] File uploaded to Cloudinary: ${result.secure_url}`);
            } else {
              // Fallback to local storage
              const bytes = await file.arrayBuffer();
              const buffer = Buffer.from(bytes);
              const fileName = `order_${Date.now()}_${i}_${file.name}`;
              const filePath = join(uploadDir, fileName);
              
              await writeFile(filePath, buffer);
              uploadedFiles.push(`/uploads/orders/${fileName}`);
            }
          } catch (err) {
            console.error("Error saving file:", err);
          }
        }
      }
    } else {
      // Handle JSON (backward compatibility)
      const body = await request.json();
      items = body.items;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one item is required" },
        { status: 400 }
      );
    }

    // Get client info
    console.log("🔍 [API] Looking for client ID:", clientData.clientId);
    const client = await prisma.clients.findUnique({
      where: { id: Number(clientData.clientId) },
    });

    if (!client) {
      console.error("❌ [API] Client not found");
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }
    
    console.log("✅ [API] Client found:", client.name);

    // Get first company
    const company = await prisma.companies.findFirst();
    
    if (!company) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 500 }
      );
    }

    // Create order in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Generate unique public token
      let publicToken = generatePublicToken();
      let tokenExists = await tx.orders.findUnique({
        where: { publicToken },
      });

      while (tokenExists) {
        publicToken = generatePublicToken();
        tokenExists = await tx.orders.findUnique({
          where: { publicToken },
        });
      }

      // Create order
      const order = await tx.orders.create({
        data: {
          companyId: company.id,
          clientId: client.id,
          publicToken,
          items: items,
          images: uploadedFiles.length > 0 ? uploadedFiles : undefined,
          status: OrderStatus.PENDING,
          stage: "RECEIVED",
          currency: "AED",
          updatedAt: new Date(),
        },
        include: {
          clients: true,
          companies: true,
        },
      });

      // Create order history
      await tx.order_histories.create({
        data: {
          orderId: order.id,
          actorName: client.name,
          action: "order_created",
          payload: {
            itemCount: items.length,
            items: items,
          },
        },
      });

      // Create notification for admins
      const admins = await tx.users.findMany({
        where: {
          companyId: company.id,
          role: "ADMIN",
        },
      });

      await Promise.all(
        admins.map((admin) =>
          tx.notifications.create({
            data: {
              companyId: company.id,
              userId: admin.id,
              title: `New Order from ${client.name}`,
              body: `Order #${order.id} - ${items.length} item(s)`,
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

      return order;
    });

    const trackingUrl = `${request.nextUrl.origin}/order/track/${result.publicToken}`;

    // Send confirmation email (async, non-blocking)
    if (client.email) {
      sendEmail({
        to: client.email,
        ...getOrderConfirmationEmail({
          clientName: client.name,
          orderNumber: result.id,
          trackingUrl,
          companyName: company.name,
        }),
      }).catch((error) => {
        console.error("⚠️ [API] Failed to send confirmation email:", error);
      });
    }

    console.log("✅ [API] Order created successfully! ID:", result.id);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    return NextResponse.json(
      {
        success: true,
        data: {
          orderId: result.id,
          publicToken: result.publicToken,
          trackingUrl,
        },
        message: "Order created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating order:", error);

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

