import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";
import { sendEmail } from "@/lib/email";
import { sendOrderCompletedEmail } from "@/lib/email-templates";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { uploadFile, isCloudinaryConfigured } from "@/lib/cloudinary";

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

    // Handle multiple file uploads - Use Cloudinary if configured, otherwise local storage
    const dnFiles: string[] = [];
    const uploadDir = path.join(process.cwd(), "public", "uploads", "delivery-notes");
    
    // Ensure directory exists (for local storage fallback)
    if (!isCloudinaryConfigured()) {
      await mkdir(uploadDir, { recursive: true });
    }

    if (files && files.length > 0) {
      for (const file of files) {
        if (file && file.size > 0) {
          try {
            if (isCloudinaryConfigured()) {
              // Upload to Cloudinary
              const timestamp = Date.now();
              const randomStr = Math.random().toString(36).substring(7);
              // Include folder path in public_id to match Cloudinary's actual public_id
              const publicId = `ata-crm/delivery-notes/DN-${orderId}-${timestamp}-${randomStr}`;
              // Use "raw" for PDFs to ensure correct URL format (same as Quotation)
              const result = await uploadFile(file, "delivery-notes", {
                resource_type: "raw", // Use 'raw' for PDFs like Quotation (not 'auto')
                public_id: publicId, // Full path including folder
              });
              dnFiles.push(result.secure_url);
              console.log(`✅ [Delivery Note] File uploaded to Cloudinary: ${result.secure_url}`);
            } else {
              // Fallback to local storage
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
            }
          } catch (err) {
            console.error("Error saving delivery note file:", err);
          }
        }
      }
    }

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

    const result = await prisma.$transaction(async (tx) => {
      // Create Delivery Note - save multiple files as JSON string in dnFile
      const dnFileData = dnFiles.length > 0 ? JSON.stringify(dnFiles) : null;
      const userId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;
      
      const dn = await tx.delivery_notes.create({
        data: {
          orderId,
          dnNumber,
          dnFile: dnFileData,
          items: JSON.parse(items),
          deliveredAt: new Date(),
          notes: notes || null,
          createdById: userId,
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
          actorId: userId,
          actorName: session.user.name,
          action: "delivery_note_sent",
          payload: {
            dnNumber,
            itemCount: JSON.parse(items).length,
            filesCount: dnFiles.length,
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
                          title: order.finalPaymentReceived 
                            ? `✅ Order Completed - Delivery Note #${dnNumber} - Order #${orderId}`
                            : `🚚 Delivery Note Sent - Order #${orderId}`,
                          body: order.finalPaymentReceived
                            ? `${session.user.name} created Delivery Note #${dnNumber}. Order #${orderId} is now completed!`
                            : `Delivery Note #${dnNumber} sent to ${order.clients?.name}. Client should arrange final payment to complete the order.`,
                          meta: {
                            orderId,
                            dnNumber,
                            itemCount: JSON.parse(items).length,
                            actionRequired: !order.finalPaymentReceived, // If final payment not received, waiting for it
                            actionType: order.finalPaymentReceived ? null : "client_final_payment",
                            waitingFor: order.finalPaymentReceived ? null : "client_final_payment",
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
                        title: order.finalPaymentReceived
                          ? `✅ Order Completed - Order #${orderId}`
                          : `🚚 Delivery Note - Order #${orderId}`,
                        body: order.finalPaymentReceived
                          ? `Your order has been completed! Delivery Note #${dnNumber} has been created.`
                          : `Delivery Note #${dnNumber} has been sent for your order.${!order.finalPaymentReceived ? ' Please arrange final payment to complete the order.' : ''}`,
                        meta: {
                          orderId,
                          dnNumber,
                          clientId: order.clientId,
                          action: "delivery_note_sent",
                          actionRequired: !order.finalPaymentReceived,
                          actionType: order.finalPaymentReceived ? null : "final_payment",
                        },
                        read: false,
                      },
                    });
                  }

                  return { dn, order: updatedOrder };
    });

    // Emit Socket.io event for real-time updates
    if (global.io) {
      global.io.to(`company_${order.companyId}`).emit("new_notification", {
        orderId,
        title: `Delivery Note Created`,
        body: `DN #${dnNumber} created for Order #${orderId}`,
        type: "delivery_note_created",
      });
      console.log(`🔌 Emitted notification to company_${order.companyId}`);
    }

    // Send completion email to client if final payment received
    if (order.clients?.email) {
      const company = await prisma.companies.findUnique({
        where: { id: order.companyId }
      });
      
      // If final payment received → send completion email
      if (order.finalPaymentReceived) {
        sendOrderCompletedEmail({
          clientName: order.clients.name,
          clientEmail: order.clients.email,
          orderId: order.id,
          deliveryNoteNumber: dnNumber,
          companyName: company?.name || "ATA CRM",
        }).catch((err) => console.error("Completion email error:", err));
      } else {
        // Send delivery note email (with final payment reminder)
        const itemsList = JSON.parse(items)
          .map((item: { name: string; quantity: number }) => `<li>${item.name} - Qty: ${item.quantity}</li>`)
          .join("");

        const filesHtml = dnFiles.length > 0 
          ? `<p><strong>Delivery Note Documents:</strong></p><ul>${dnFiles.map(f => `<li><a href="${process.env.NEXTAUTH_URL}${f}">Download Document</a></li>`).join('')}</ul>`
          : '';

        const emailContent = `
          <h2>🚚 Delivery Note - Order #${orderId}</h2>
          <p>Dear ${order.clients.name},</p>
          <p>Your order has been delivered!</p>
          <p><strong>Delivery Note: ${dnNumber}</strong></p>
          ${filesHtml}
          <p><strong>Items Delivered:</strong></p>
          <ul>${itemsList}</ul>
          <div style="background: #fef3c7; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-weight: bold;">💰 Final Payment Due</p>
            <p style="margin: 5px 0 0 0;">Please arrange the final payment to complete the order.</p>
          </div>
          <p>Thank you for your business!</p>
          <p>Best regards,<br><strong>${company?.name || "ATA CRM"}</strong></p>
        `;

        sendEmail({
          to: order.clients.email,
          subject: `🚚 Delivery Note ${dnNumber} - Order #${orderId}`,
          html: emailContent,
        }).catch((err) => console.error("Delivery email error:", err));
      }
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



