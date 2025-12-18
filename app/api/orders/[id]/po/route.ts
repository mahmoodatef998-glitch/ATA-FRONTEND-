import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { sendEmail } from "@/lib/email";
import { sendPOCreatedEmail } from "@/lib/email-templates";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { uploadFile, isCloudinaryConfigured } from "@/lib/cloudinary";
import { authorize } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { auth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Use RBAC: Allow Admin and Accountant to create purchase orders
    const { userId, companyId } = await authorize(PermissionAction.PO_CREATE);
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { success: false, error: "Invalid order ID" },
        { status: 400 }
      );
    }

    // Handle multipart/form-data
    const formData = await request.formData();
    const poNumber = formData.get("poNumber") as string;
    const notes = formData.get("notes") as string | null;
    
    // Handle multiple files - Use Cloudinary if configured, otherwise local storage
    const files = formData.getAll("files") as File[];
    const poFiles: string[] = [];
    
    const uploadDir = join(process.cwd(), "public", "uploads", "po");
    
    // Ensure directory exists (for local storage fallback)
    if (!isCloudinaryConfigured()) {
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (err) {
        console.error("Error creating upload directory:", err);
      }
    }
    
    // Handle file upload - Use Cloudinary if configured, otherwise local storage
    // TEMPORARY: Disable Cloudinary for testing - set to false to use local storage only
    const USE_CLOUDINARY = process.env.USE_CLOUDINARY !== "false"; // Default to true, set USE_CLOUDINARY=false to disable
    
    if (files && files.length > 0) {
      for (const file of files) {
        if (file && file.size > 0) {
          let fileUrl: string | null = null;
          console.log(`📎 [PO] File received: ${file.name} (${file.size} bytes)`);
          try {
            if (USE_CLOUDINARY && isCloudinaryConfigured()) {
              console.log("☁️ [PO] Uploading to Cloudinary...");
              // Upload to Cloudinary
              try {
                // Clean poNumber for public_id (remove special characters, keep only alphanumeric and underscore)
                const cleanPoNumber = poNumber.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
                const timestamp = Date.now();
                // Include folder path in public_id to match Cloudinary's actual public_id
                const publicId = `ata-crm/po/PO_${cleanPoNumber}_${timestamp}`;
                console.log(`📤 [PO] Public ID: ${publicId}`);
                const result = await uploadFile(file, "po", {
                  resource_type: "raw", // Use 'raw' for PDFs like Quotation
                  public_id: publicId, // Full path including folder
                });
                fileUrl = result.secure_url;
                console.log(`✅ [PO] File uploaded to Cloudinary: ${fileUrl}`);
              } catch (cloudinaryError: unknown) {
                const logger = await import("@/lib/logger").then(m => m.logger);
                logger.error("PO Cloudinary upload error", cloudinaryError, "purchase-orders");
                // Fallback to local storage if Cloudinary fails
                // Don't throw - continue with local storage
              }
            }
            
            // Use local storage if Cloudinary is disabled or failed
            if (!fileUrl) {
              console.log("💾 [PO] Using local storage");
              const uploadDir = join(process.cwd(), "public", "uploads", "po");
              
              // Ensure directory exists
              try {
                await mkdir(uploadDir, { recursive: true });
                console.log(`✅ [PO] Upload directory ready: ${uploadDir}`);
              } catch (err) {
                console.error("❌ [PO] Error creating upload directory:", err);
                throw err; // Re-throw to be caught by outer catch
              }
              
              const bytes = await file.arrayBuffer();
              const buffer = Buffer.from(bytes);
              
              // Create unique filename
              const timestamp = Date.now();
              const extension = file.name.split(".").pop() || "pdf";
              const cleanPoNumber = poNumber.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
              const fileName = `PO_${cleanPoNumber}_${timestamp}.${extension}`;
              const filePath = join(uploadDir, fileName);
              
              await writeFile(filePath, buffer);
              fileUrl = `/uploads/po/${fileName}`;
              console.log(`✅ [PO] File saved to local storage: ${fileUrl}`);
            }
            
            if (fileUrl) {
              poFiles.push(fileUrl);
            }
          } catch (err: any) {
            console.error("❌ [PO] Error saving PO file:", err);
            console.error("❌ [PO] File error details:", {
              message: err?.message,
              name: err?.name,
              stack: err?.stack,
              code: err?.code,
            });
            // Don't throw - continue with other files
          }
        }
      }
    }

    if (!poNumber) {
      return NextResponse.json(
        { success: false, error: "PO Number is required" },
        { status: 400 }
      );
    }

    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        companyId: true,
        clientId: true,
        status: true,
        stage: true,
        totalAmount: true,
        currency: true,
        clients: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create PO - save multiple files as JSON string in poFile
      // Files are saved as JSON array in poFile field
      const poFileData = poFiles.length > 0 ? JSON.stringify(poFiles) : null;
      
      // Get user name from database
      const user = await tx.users.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      const userName = user?.name || "Unknown User";
      
      const po = await tx.purchase_orders.create({
        data: {
          orderId,
          poNumber,
          poFile: poFileData,
          notes: notes || null,
          createdById: userId,
          updatedAt: new Date(),
        },
      });

      // Update order - check if quotation has deposit requirement
      const quotation = await tx.quotations.findFirst({
        where: {
          orderId,
          accepted: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const depositPercent = quotation?.depositPercent || null;
      const depositAmount = quotation?.depositAmount || null;

      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: {
          stage: depositPercent ? "AWAITING_DEPOSIT" : "IN_MANUFACTURING",
          depositPercentage: depositPercent,
          depositAmount,
          updatedAt: new Date(),
        },
      });

      // History
      await tx.order_histories.create({
        data: {
          orderId,
          actorId: userId,
          actorName: userName,
          action: "po_created",
          payload: {
            poNumber,
            filesCount: poFiles.length,
          },
        },
      });

      // Create notifications for all admins
      const companyUsers = await tx.users.findMany({
        where: {
          companyId: order.companyId,
          role: UserRole.ADMIN,
        },
      });

      await Promise.all(
        companyUsers.map((user) =>
          tx.notifications.create({
            data: {
              companyId: order.companyId,
              userId: user.id,
              title: `Purchase Order Created - Order #${orderId}`,
              body: `${userName} created PO #${poNumber}`,
              meta: {
                orderId,
                poNumber,
              },
              read: user.id === userId, // Mark as read for creator
            },
          })
        )
      );

      // Create notification for client
      if (order.clientId) {
        await tx.notifications.create({
          data: {
            companyId: order.companyId,
            userId: null, // Client notifications don't have userId
            title: `📦 Purchase Order Received - Order #${orderId}`,
            body: `Your Purchase Order #${poNumber} has been received and is being processed.`,
            meta: {
              orderId,
              poNumber,
              clientId: order.clientId,
              action: "po_received",
            },
            read: false,
          },
        });
      }

      return { po, order: updatedOrder };
    });

    // Emit Socket.io event for real-time notification
    if (global.io) {
      global.io.to(`company_${order.companyId}`).emit("new_notification", {
        orderId,
        title: `Purchase Order Created`,
        body: `PO #${poNumber} created for Order #${orderId}`,
        type: "po_created",
      });
      console.log(`🔌 Emitted notification to company_${order.companyId}`);
    }

    // Send professional email to client
    if (order.clients?.email) {
      const company = await prisma.companies.findUnique({
        where: { id: order.companyId }
      });
      
      // Get deposit info from quotation if exists
      const quotation = await prisma.quotations.findFirst({
        where: {
          orderId,
          accepted: true,
        },
        orderBy: { createdAt: "desc" },
      });

      sendPOCreatedEmail({
        clientName: order.clients.name,
        clientEmail: order.clients.email,
        orderId: order.id,
        poNumber: poNumber,
        depositRequired: !!quotation?.depositRequired,
        depositAmount: quotation?.depositAmount || undefined,
        depositPercent: quotation?.depositPercent || undefined,
        totalAmount: order.totalAmount || undefined,
        currency: order.currency,
        companyName: company?.name || "ATA CRM",
      }).catch((err) => console.error("PO email error:", err));
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "PO created successfully",
    });
  } catch (error) {
    console.error("Error creating PO:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create PO" },
      { status: 500 }
    );
  }
}

