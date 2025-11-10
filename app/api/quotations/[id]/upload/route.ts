import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require ADMIN role
    const session = await requireRole([UserRole.ADMIN]);

    const { id } = await params;
    const quotationId = parseInt(id);

    if (isNaN(quotationId)) {
      return NextResponse.json(
        { success: false, error: "Invalid quotation ID" },
        { status: 400 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
      "application/vnd.ms-excel", // xls
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only PDF and Excel files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // Check if quotation exists
    const quotation = await prisma.quotations.findUnique({
      where: { id: quotationId },
      include: { orders: true },
    });

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: "Quotation not found" },
        { status: 404 }
      );
    }

    // Authorization check
    if (quotation.orders.companyId !== session.user.companyId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Access denied" },
        { status: 403 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    const fileName = `quotation_${quotationId}_${timestamp}.${extension}`;
    const filePath = `/uploads/quotations/${fileName}`;

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/uploads/quotations
    const publicPath = join(process.cwd(), "public", "uploads", "quotations", fileName);
    await writeFile(publicPath, buffer);

    // Update quotation with file info
    const updatedQuotation = await prisma.quotations.update({
      where: { id: quotationId },
      data: {
        file: filePath,
        fileName: file.name,
        fileSize: file.size,
        updatedAt: new Date(),
      },
    });

    // Create history entry
    await prisma.order_histories.create({
      data: {
        orderId: quotation.orderId,
        actorId: session.user.id,
        actorName: session.user.name,
        action: "quotation_file_uploaded",
        payload: {
          quotationId,
          fileName: file.name,
          fileSize: file.size,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        quotation: updatedQuotation,
        file: {
          path: filePath,
          name: file.name,
          size: file.size,
        },
      },
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading file:", error);

    if ((error as Error).message === "Unauthorized: Insufficient permissions") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: "An error occurred while uploading the file" },
      { status: 500 }
    );
  }
}

