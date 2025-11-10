import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { sendEmail } from "@/lib/email";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole([UserRole.ADMIN]);
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
    const depositRequired = formData.get("depositRequired") === "true";
    const depositPercent = depositRequired ? parseInt(formData.get("depositPercent") as string) : null;
    const notes = formData.get("notes") as string | null;
    
    // Handle multiple files
    const files = formData.getAll("files") as File[];
    const poFiles: string[] = [];
    
    if (files && files.length > 0) {
      const uploadDir = join(process.cwd(), "public", "uploads", "po");
      
      // Ensure directory exists
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (err) {
        console.error("Error creating upload directory:", err);
      }
      
      for (const file of files) {
        if (file && file.size > 0) {
          try {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const fileName = `PO_${poNumber.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${file.name}`;
            const filePath = join(uploadDir, fileName);
            
            await writeFile(filePath, buffer);
            poFiles.push(`/uploads/po/${fileName}`);
          } catch (err) {
            console.error("Error saving PO file:", err);
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
      include: { clients: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Calculate deposit amount
    const depositAmount = depositRequired && depositPercent && order.totalAmount
      ? (order.totalAmount * depositPercent) / 100
      : null;

    const result = await prisma.$transaction(async (tx) => {
      // Create PO - save multiple files as JSON string in poFile
      const poFileData = poFiles.length > 0 ? JSON.stringify(poFiles) : null;
      
      const po = await tx.purchase_orders.create({
        data: {
          orderId,
          poNumber,
          poFile: poFileData,
          depositRequired: depositRequired || false,
          depositPercent: depositPercent || null,
          depositAmount,
          notes: notes || null,
          createdById: session.user.id,
          updatedAt: new Date(),
        },
      });

      // Update order
      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: {
          stage: depositRequired ? "AWAITING_DEPOSIT" : "IN_MANUFACTURING",
          depositPercentage: depositPercent || null,
          depositAmount,
          updatedAt: new Date(),
        },
      });

      // History
      await tx.order_histories.create({
        data: {
          orderId,
          actorId: session.user.id,
          actorName: session.user.name,
          action: "po_created",
          payload: {
            poNumber,
            depositRequired,
            depositPercent,
            depositAmount,
            filesCount: poFiles.length,
          },
        },
      });

      // Create notifications for other admins
      const companyUsers = await tx.users.findMany({
        where: {
          companyId: order.companyId,
          role: UserRole.ADMIN,
          id: { not: session.user.id },
        },
      });

      await Promise.all(
        companyUsers.map((user) =>
          tx.notifications.create({
            data: {
              companyId: order.companyId,
              userId: user.id,
              title: `Purchase Order Created - Order #${orderId}`,
              body: `${session.user.name} created PO #${poNumber}${depositRequired ? ` with ${depositPercent}% deposit required` : ''}`,
              meta: {
                orderId,
                poNumber,
                depositRequired,
                depositAmount,
              },
              read: false,
            },
          })
        )
      );

      return { po, order: updatedOrder };
    });

    // Send email to client
    if (order.clients?.email) {
      const emailContent = depositRequired
        ? `
          <h2>Purchase Order Ready - Deposit Required</h2>
          <p>Dear ${order.clients.name},</p>
          <p>Your Purchase Order #${poNumber} has been prepared.</p>
          <p><strong>Deposit Required: ${depositAmount?.toLocaleString()} ${order.currency} (${depositPercent}%)</strong></p>
          <p>Please arrange payment to proceed with manufacturing.</p>
          <p>Total Order Value: ${order.totalAmount?.toLocaleString()} ${order.currency}</p>
        `
        : `
          <h2>Purchase Order Confirmed</h2>
          <p>Dear ${order.clients.name},</p>
          <p>Your Purchase Order #${poNumber} has been confirmed.</p>
          <p>We are starting the manufacturing process.</p>
        `;

      sendEmail({
        to: order.clients.email,
        subject: `Purchase Order ${poNumber} - ${depositRequired ? 'Deposit Required' : 'Confirmed'}`,
        html: emailContent,
      }).catch((err) => console.error("Email error:", err));
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

