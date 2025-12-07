import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { uploadFile, isCloudinaryConfigured } from "@/lib/cloudinary";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    // Find order by public token
    const order = await prisma.orders.findUnique({
      where: { publicToken: token },
      select: {
        id: true,
        companyId: true,
        clientId: true,
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

    // Handle multipart/form-data
    const formData = await request.formData();
    const poNumber = formData.get("poNumber") as string;
    const notes = formData.get("notes") as string | null;

    if (!poNumber) {
      return NextResponse.json(
        { success: false, error: "PO Number is required" },
        { status: 400 }
      );
    }

    // PO files - Use Cloudinary if configured, otherwise local storage
    const files = formData.getAll("files") as File[];
    const poFiles: string[] = [];

    // Deposit proof files
    const depositFiles = formData.getAll("depositFiles") as File[];
    const depositProofFiles: string[] = [];

    const uploadDir = join(process.cwd(), "public", "uploads", "po");

    // Ensure directory exists (for local storage fallback)
    if (!isCloudinaryConfigured()) {
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (err) {
        console.error("Error creating upload directory:", err);
      }
    }

    if (files && files.length > 0) {
      for (const file of files) {
        if (file && file.size > 0) {
          try {
            if (isCloudinaryConfigured()) {
              // Upload to Cloudinary - Use 'raw' for PDFs like Quotation
              const cleanPoNumber = poNumber.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
              const timestamp = Date.now();
              const publicId = `ata-crm/po/PO_${cleanPoNumber}_${timestamp}`;
              const result = await uploadFile(file, "po", {
                resource_type: "raw", // Use 'raw' for PDFs (same as Quotation)
                public_id: publicId, // Full path including folder
              });
              poFiles.push(result.secure_url);
              console.log(`✅ [Public PO] File uploaded to Cloudinary: ${result.secure_url}`);
            } else {
              // Fallback to local storage
              const bytes = await file.arrayBuffer();
              const buffer = Buffer.from(bytes);
              const safePo = poNumber.replace(/[^a-zA-Z0-9]/g, "_");
              const fileName = `PO_${safePo}_${Date.now()}_${file.name}`;
              const filePath = join(uploadDir, fileName);

              await writeFile(filePath, buffer);
              poFiles.push(`/uploads/po/${fileName}`);
            }
          } catch (err) {
            console.error("Error saving PO file:", err);
          }
        }
      }
    }

    if (depositFiles && depositFiles.length > 0) {
      for (const file of depositFiles) {
        if (file && file.size > 0) {
          try {
            if (isCloudinaryConfigured()) {
              // Upload deposit proof to Cloudinary - Use 'raw' for PDFs
              const cleanPoNumber = poNumber.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
              const timestamp = Date.now();
              const publicId = `ata-crm/po/PO_DEPOSIT_${cleanPoNumber}_${timestamp}`;
              const result = await uploadFile(file, "po", {
                resource_type: "raw", // Use 'raw' for PDFs (same as Quotation)
                public_id: publicId, // Full path including folder
              });
              depositProofFiles.push(result.secure_url);
              console.log(`✅ [Public PO Deposit] File uploaded to Cloudinary: ${result.secure_url}`);
            } else {
              // Fallback to local storage
              const bytes = await file.arrayBuffer();
              const buffer = Buffer.from(bytes);
              const safePo = poNumber.replace(/[^a-zA-Z0-9]/g, "_");
              const fileName = `PO_DEPOSIT_${safePo}_${Date.now()}_${file.name}`;
              const filePath = join(uploadDir, fileName);

              await writeFile(filePath, buffer);
              depositProofFiles.push(`/uploads/po/${fileName}`);
            }
          } catch (err) {
            console.error("Error saving PO deposit file:", err);
          }
        }
      }
    }

    if (poFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one PO file is required" },
        { status: 400 }
      );
    }

    const orderId = order.id;

    const result = await prisma.$transaction(async (tx) => {
      const poFileData = poFiles.length > 0 ? JSON.stringify(poFiles) : null;
      const depositProofFileData =
        depositProofFiles.length > 0 ? JSON.stringify(depositProofFiles) : null;

      const po = await tx.purchase_orders.create({
        data: {
          orderId,
          poNumber,
          poFile: poFileData,
          depositProofFile: depositProofFileData,
          notes: notes || null,
          updatedAt: new Date(),
        },
      });

      // Try to move stage based on accepted quotation deposit info
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
          actorId: null,
          actorName: order.clients?.name || "Client",
          action: "po_uploaded_public_link",
          payload: {
            poNumber,
            filesCount: poFiles.length,
            depositProofCount: depositProofFiles.length,
          },
        },
      });

      return { po, order: updatedOrder };
    });

    // Notifications for admins
    const companyUsers = await prisma.users.findMany({
      where: {
        companyId: order.companyId,
      },
    });

    await Promise.all(
      companyUsers.map((user) =>
        prisma.notifications.create({
          data: {
            companyId: order.companyId,
            userId: user.id,
            title: `📦 PO Uploaded by Client - Order #${orderId}`,
            body: `Client ${order.clients?.name || "Client"} uploaded PO #${poNumber}${depositProofFiles.length > 0 ? ' with deposit proof document' : ''}. Please review PO documents and deposit proof (if provided) in the Purchase Orders tab.`,
            meta: {
              orderId,
              poNumber,
              actionRequired: true, // Admin needs to review
              actionType: "admin_review_po",
              hasDepositProof: depositProofFiles.length > 0,
              waitingFor: "admin_review",
            },
            read: false,
          },
        })
      )
    );

    // Emit socket event if available
    if (globalThis.hasOwnProperty("io") && (globalThis as any).io) {
      (globalThis as any).io
        .to(`company_${order.companyId}`)
        .emit("new_notification", {
          orderId,
          title: `PO Uploaded by Client`,
          body: `PO #${poNumber} uploaded for Order #${orderId}`,
          type: "po_uploaded",
        });
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "PO uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading public PO:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload PO" },
      { status: 500 }
    );
  }
}


