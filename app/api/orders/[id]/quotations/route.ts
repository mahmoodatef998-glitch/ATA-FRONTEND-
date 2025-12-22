import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { UserRole } from "@prisma/client";
import { sendEmail } from "@/lib/email";
import { sendQuotationEmail } from "@/lib/email-templates";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { formatCurrency } from "@/lib/utils";
import { uploadFile, isCloudinaryConfigured } from "@/lib/cloudinary";
import { logger } from "@/lib/logger";
import { handleApiError } from "@/lib/error-handler";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // CRITICAL: Wrap everything in try-catch to ensure JSON response
  // If any error occurs outside this try-catch, Next.js will return HTML error page
  try {
    logger.info("Starting quotation creation", { url: request.url, method: request.method }, "quotations");
    
    // 1. Authentication - Check permission using RBAC
    let session;
    let authUserId: number;
    let authCompanyId: number;
    try {
      logger.debug("Checking authentication", {}, "quotations");
      // Check permission to create invoice/quotation
      const authResult = await authorize(PermissionAction.INVOICE_CREATE);
      authUserId = authResult.userId;
      authCompanyId = authResult.companyId;
      // Get session for user info
      const { requireAuth } = await import("@/lib/auth-helpers");
      session = await requireAuth();
      logger.debug("Session validated", { userId: session.user.id, role: session.user.role }, "quotations");
    } catch (authError: unknown) {
      logger.error("Quotation authentication error", authError, "quotations");
      // Return JSON instead of letting Next.js return HTML error page
      return NextResponse.json(
        { 
          success: false, 
          error: authError?.message || "Unauthorized",
          errorType: "authentication",
        },
        { status: 401 }
      );
    }
    
    // 2. Parse params
    let orderId: number;
    try {
      const { id } = await params;
      orderId = parseInt(id);
      logger.debug("Parsing order ID", { orderId }, "quotations");
      
      if (isNaN(orderId)) {
        return NextResponse.json(
          { success: false, error: "Invalid order ID" },
          { status: 400 }
        );
      }
    } catch (paramsError: unknown) {
      logger.error("Quotation params error", paramsError, "quotations");
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid order ID",
          details: paramsError?.message,
        },
        { status: 400 }
      );
    }

    // 3. Parse form data
    let formData: FormData;
    try {
      formData = await request.formData();
      logger.debug("Form data parsed", {}, "quotations");
    } catch (formError: unknown) {
      logger.error("Form data error", formError, "quotations");
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to parse form data",
          details: formError?.message,
        },
        { status: 400 }
      );
    }
    // 4. Extract form fields
    const total = formData.get("total") as string;
    const currency = formData.get("currency") as string || "AED";
    const notes = formData.get("notes") as string | null;
    const depositRequired = formData.get("depositRequired") === "true";
    const depositPercent = depositRequired ? parseInt(formData.get("depositPercent") as string) : null;
    
    // Handle file upload (same as PO and Delivery Note)
    const file = formData.get("file") as File;
    let quotationFile: string | null = null;

    // Validate total
    if (!total || parseFloat(total) <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid total amount is required" },
        { status: 400 }
      );
    }
    
    logger.debug("Quotation details", { total, currency, depositRequired }, "quotations");

    // Handle file upload - Use Cloudinary if configured, otherwise local storage
    // TEMPORARY: Disable Cloudinary for testing - set to false to use local storage only
    const USE_CLOUDINARY = process.env.USE_CLOUDINARY !== "false"; // Default to true, set USE_CLOUDINARY=false to disable
    
    if (file && file.size > 0) {
      logger.info("File received", { fileName: file.name, size: file.size }, "quotations");
      try {
        if (USE_CLOUDINARY && isCloudinaryConfigured()) {
          logger.debug("Uploading to Cloudinary", {}, "quotations");
          // Upload to Cloudinary
          try {
            // Include folder path in public_id to match Cloudinary's actual public_id (like PO and DN)
            const publicId = `ata-crm/quotations/quotation_${orderId}_${Date.now()}`;
            const result = await uploadFile(file, "quotations", {
              resource_type: "raw", // Use 'raw' for PDFs instead of 'auto'
              public_id: publicId, // Full path including folder (consistent with PO and DN)
            });
            quotationFile = result.secure_url;
            logger.info("File uploaded to Cloudinary", { url: quotationFile }, "quotations");
          } catch (cloudinaryError: unknown) {
            logger.error("Cloudinary upload error", cloudinaryError, "quotations");
            logger.info("Falling back to local storage", {}, "quotations");
            // Fallback to local storage if Cloudinary fails
            // Don't throw - continue with local storage
          }
        }
        
        // Use local storage if Cloudinary is disabled or failed
        if (!quotationFile) {
          logger.debug("Using local storage", {}, "quotations");
          const uploadDir = join(process.cwd(), "public", "uploads", "quotations");
          
          // Ensure directory exists
          try {
            await mkdir(uploadDir, { recursive: true });
            logger.debug("Upload directory ready", { path: uploadDir }, "quotations");
          } catch (err) {
            logger.error("Error creating upload directory", err, "quotations");
            throw err; // Re-throw to be caught by outer catch
          }
          
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          
          // Create unique filename
          const timestamp = Date.now();
          const extension = file.name.split(".").pop() || "pdf";
          const fileName = `quotation_${orderId}_${timestamp}.${extension}`;
          const filePath = join(uploadDir, fileName);
          
          await writeFile(filePath, buffer);
          quotationFile = `/uploads/quotations/${fileName}`;
          logger.info("File saved to local storage", { path: quotationFile }, "quotations");
        }
      } catch (err: unknown) {
        logger.error("Quotation file save error", err, "quotations");
        // Continue without file - quotation can be created without file
      }
    }

    // 5. Fetch order from database
    let order;
    try {
      order = await prisma.orders.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          companyId: true,
          clientId: true,
          items: true,
          details: true,
          totalAmount: true,
          currency: true,
          status: true,
          stage: true,
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
    } catch (dbError: unknown) {
      logger.error("Quotation database error fetching order", dbError, "quotations");
      const errorMessage = dbError instanceof Error ? dbError.message : "Unknown error";
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to fetch order",
          details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        },
        { status: 500 }
      );
    }

    // Calculate deposit amount
    const depositAmount = depositRequired && depositPercent && total
      ? (parseFloat(total) * depositPercent) / 100
      : null;

    // 6. Database transaction
    let result;
    try {
      logger.debug("Starting database transaction", {}, "quotations");
      result = await prisma.$transaction(async (tx) => {
      // Use userId from authorize() above
      const userId = authUserId;
      
      // Create quotation (same pattern as PO and Delivery Note)
      const quotation = await tx.quotations.create({
        data: {
          orderId,
          createdById: userId,
          items: [], // Empty for now
          total: parseFloat(total),
          currency: currency || "AED",
          notes: notes || null,
          file: quotationFile,
          fileName: file ? file.name : null,
          fileSize: file ? file.size : null,
          accepted: null, // Pending review
          depositRequired: depositRequired || false,
          depositPercent: depositPercent || null,
          depositAmount,
          updatedAt: new Date(),
        },
      });

      // Update order status
      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: {
          status: "QUOTATION_SENT",
          stage: "QUOTATION_SENT",
          totalAmount: parseFloat(total),
          currency: currency || "AED",
          depositPercentage: depositPercent || null,
          depositAmount,
          updatedAt: new Date(),
        },
      });

      // History (same as PO and Delivery Note)
      await tx.order_histories.create({
        data: {
          orderId,
          actorId: userId,
          actorName: session.user.name,
          action: "quotation_created",
          payload: {
            quotationId: quotation.id,
            total: parseFloat(total),
            currency: currency || "AED",
            hasFile: !!quotationFile,
          },
        },
      });

      // Create notifications for all admins (same as PO and Delivery Note)
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
              title: `📄 Quotation Created - Order #${orderId}`,
              body: `${session.user.name} created quotation (${formatCurrency(parseFloat(total), currency || "AED")}) for Order #${orderId}. Ready to send to client.`,
              meta: {
                orderId,
                quotationId: quotation.id,
                total: parseFloat(total),
                currency: currency || "AED",
                actionRequired: false, // Just informational - not sent yet
              },
              read: user.id === userId, // Mark as read for creator
            },
          })
        )
      );

      return { quotation, order: updatedOrder };
    });
  } catch (txError: unknown) {
    logger.error("Quotation database transaction error", txError, "quotations");
    const errorMessage = txError instanceof Error ? txError.message : "Database transaction failed";
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create quotation in database",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }

    // Emit Socket.io event for real-time notification (same as PO)
    if (global.io) {
      global.io.to(`company_${order.companyId}`).emit("new_notification", {
        orderId,
        title: `Quotation Created`,
        body: `Quotation created for Order #${orderId}`,
        type: "quotation_created",
      });
      logger.debug("Emitted notification", { companyId: order.companyId }, "quotations");
    }

    // Send email to client (same pattern as PO)
    if (order.clients?.email) {
      const company = await prisma.companies.findUnique({
        where: { id: order.companyId }
      });
      
      sendQuotationEmail({
        clientName: order.clients.name,
        clientEmail: order.clients.email,
        orderId: order.id,
        quotationId: result.quotation.id,
        quotationTotal: parseFloat(total),
        currency: currency || "AED",
        companyName: company?.name || "ATA CRM",
      }).catch((err) => logger.error("Quotation email error", err, "quotations"));
    }

    logger.info("Quotation created successfully", { orderId, quotationId: result.quotation.id }, "quotations");
    return NextResponse.json({
      success: true,
      data: result,
      message: "Quotation created successfully",
    });
  } catch (error: unknown) {
    logger.error("Quotation creation error", error, "quotations");
    return handleApiError(error);
  }
}

