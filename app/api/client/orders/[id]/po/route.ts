import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { uploadFile, isCloudinaryConfigured } from "@/lib/cloudinary";

async function getClientFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get("client-token")?.value;
    if (!token) {
      return null;
    }

    const { jwtVerify } = await import("jose");
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "secret");
    const { payload } = await jwtVerify(token, secret);
    
    if (payload.type === "client" && payload.clientId) {
      return typeof payload.clientId === "string" ? parseInt(payload.clientId) : payload.clientId;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const clientId = await getClientFromToken(request);
    
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { success: false, error: "Invalid order ID" },
        { status: 400 }
      );
    }

    // Verify that this order belongs to the client
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
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

    if (order.clientId !== clientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: This order does not belong to you" },
        { status: 403 }
      );
    }

    // Handle multipart/form-data
    const formData = await request.formData();
    const poNumber = formData.get("poNumber") as string;
    const notes = formData.get("notes") as string | null;
    
    // Handle PO files - Use Cloudinary if configured, otherwise local storage
    const files = formData.getAll("files") as File[];
    const poFiles: string[] = [];
    
    // Handle deposit proof files
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
            } else {
              // Fallback to local storage
              const bytes = await file.arrayBuffer();
              const buffer = Buffer.from(bytes);
              const fileName = `PO_${poNumber.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${file.name}`;
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
            } else {
              // Fallback to local storage
              const bytes = await file.arrayBuffer();
              const buffer = Buffer.from(bytes);
              const fileName = `PO_DEPOSIT_${poNumber.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${file.name}`;
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

    if (!poNumber) {
      return NextResponse.json(
        { success: false, error: "PO Number is required" },
        { status: 400 }
      );
    }

    if (poFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one PO file is required" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create PO - save multiple files as JSON string in poFile
      const poFileData = poFiles.length > 0 ? JSON.stringify(poFiles) : null;
      const depositProofFileData = depositProofFiles.length > 0 ? JSON.stringify(depositProofFiles) : null;
      
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

      // Update order stage
      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: {
          stage: "PO_PREPARED",
          updatedAt: new Date(),
        },
      });

      // History
      await tx.order_histories.create({
        data: {
          orderId,
          actorId: null,
          actorName: order.clients?.name || "Client",
          action: "po_uploaded_by_client",
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
        },
      });

      await Promise.all(
        companyUsers.map((user) =>
          tx.notifications.create({
            data: {
              companyId: order.companyId,
              userId: user.id,
              title: `PO Uploaded by Client - Order #${orderId}`,
              body: `${order.clients?.name || "Client"} uploaded PO #${poNumber} for Order #${orderId}`,
              meta: {
                orderId,
                poNumber,
                clientId: clientId,
              },
              read: false,
            },
          })
        )
      );

      return { po, order: updatedOrder };
    });

    // Emit Socket.io event for real-time notification
    if (global.io) {
      global.io.to(`company_${order.companyId}`).emit("new_notification", {
        orderId,
        title: `PO Uploaded by Client`,
        body: `PO #${poNumber} uploaded for Order #${orderId}`,
        type: "po_uploaded",
      });
      console.log(`🔌 Emitted notification to company_${order.companyId}`);
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "PO uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading PO:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload PO" },
      { status: 500 }
    );
  }
}

