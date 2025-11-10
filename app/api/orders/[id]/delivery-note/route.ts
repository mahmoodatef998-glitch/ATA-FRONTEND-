import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { sendEmail } from "@/lib/email";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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

    const formData = await request.formData();
    const dnNumber = formData.get("dnNumber") as string;
    const items = formData.get("items") as string;
    const notes = formData.get("notes") as string | null;
    
    // Handle multiple files
    const files = formData.getAll("files") as File[];

    if (!dnNumber || !items) {
      return NextResponse.json(
        { success: false, error: "DN Number and items required" },
        { status: 400 }
      );
    }

    // Handle multiple file uploads
    const dnFiles: string[] = [];
    if (files && files.length > 0) {
      const uploadDir = path.join(process.cwd(), "public", "uploads", "delivery-notes");
      
      // Ensure directory exists
      await mkdir(uploadDir, { recursive: true });

      for (const file of files) {
        if (file && file.size > 0) {
          try {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Create unique filename
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(7);
            const ext = path.extname(file.name);
            const filename = `DN-${orderId}-${timestamp}-${randomStr}${ext}`;
            const filePath = path.join(uploadDir, filename);

            // Write file
            await writeFile(filePath, buffer);
            dnFiles.push(`/uploads/delivery-notes/${filename}`);
          } catch (err) {
            console.error("Error saving delivery note file:", err);
          }
        }
      }
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

    const result = await prisma.$transaction(async (tx) => {
      // Create Delivery Note - save multiple files as JSON string in dnFile
      const dnFileData = dnFiles.length > 0 ? JSON.stringify(dnFiles) : null;
      
      const dn = await tx.delivery_notes.create({
        data: {
          orderId,
          dnNumber,
          dnFile: dnFileData,
          items: JSON.parse(items),
          deliveredAt: new Date(),
          notes: notes || null,
          createdById: session.user.id,
          updatedAt: new Date(),
        },
      });

      // Update order
      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: {
          stage: order.finalPaymentReceived ? "COMPLETED_DELIVERED" : "AWAITING_FINAL_PAYMENT",
          updatedAt: new Date(),
        },
      });

      // History
      await tx.order_histories.create({
        data: {
          orderId,
          actorId: session.user.id,
          actorName: session.user.name,
          action: "delivery_note_sent",
          payload: {
            dnNumber,
            itemCount: JSON.parse(items).length,
            filesCount: dnFiles.length,
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
              title: `Delivery Note Created - Order #${orderId}`,
              body: `${session.user.name} created Delivery Note #${dnNumber}${order.finalPaymentReceived ? ' - Order completed!' : ' - Awaiting final payment'}`,
              meta: {
                orderId,
                dnNumber,
                itemCount: JSON.parse(items).length,
              },
              read: false,
            },
          })
        )
      );

      return { dn, order: updatedOrder };
    });

    // Send email
    if (order.clients?.email) {
      const itemsList = JSON.parse(items)
        .map((item: any) => `<li>${item.name} - Qty: ${item.quantity}</li>`)
        .join("");

      const filesHtml = dnFiles.length > 0 
        ? `<p><strong>Delivery Note Documents:</strong></p><ul>${dnFiles.map(f => `<li><a href="${process.env.NEXTAUTH_URL}${f}">Download Document</a></li>`).join('')}</ul>`
        : '';

      const emailContent = `
        <h2>Delivery Note - Order #${orderId}</h2>
        <p>Dear ${order.clients.name},</p>
        <p>Your order has been delivered!</p>
        <p><strong>Delivery Note: ${dnNumber}</strong></p>
        ${filesHtml}
        <p><strong>Items Delivered:</strong></p>
        <ul>${itemsList}</ul>
        ${!order.finalPaymentReceived ? '<p><strong>Final payment is now due.</strong></p>' : ''}
        <p>Thank you for your business!</p>
      `;

      sendEmail({
        to: order.clients.email,
        subject: `Delivery Note ${dnNumber} - Order #${orderId}`,
        html: emailContent,
      }).catch((err) => console.error("Email error:", err));
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "Delivery Note created successfully",
    });
  } catch (error) {
    console.error("Error creating delivery note:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create delivery note" },
      { status: 500 }
    );
  }
}



