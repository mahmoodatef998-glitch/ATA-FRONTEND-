import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { UserRole } from "@prisma/client";
import { handleApiError, NotFoundError, ForbiddenError } from "@/lib/error-handler";
import { successResponse } from "@/lib/utils/api-helpers";
import { validateId } from "@/lib/utils/validation-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // التحقق من صلاحية عرض الطلبات
    const { userId, companyId } = await authorize(PermissionAction.LEAD_READ);

    const { id } = await params;
    const orderId = validateId(id, "order");

    // Fetch order with optimized select (only needed fields)
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        companyId: true,
        clientId: true,
        publicToken: true,
        items: true,
        details: true,
        totalAmount: true,
        currency: true,
        status: true,
        stage: true,
        images: true,
        depositPercentage: true,
        depositAmount: true,
        depositPaid: true,
        depositPaidAt: true,
        finalPaymentReceived: true,
        finalPaymentAt: true,
        createdAt: true,
        updatedAt: true,
        clients: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        companies: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        quotations: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            items: true,
            total: true,
            currency: true,
            notes: true,
            file: true,
            fileName: true,
            fileSize: true,
            accepted: true,
            rejectedReason: true,
            clientComment: true,
            reviewedAt: true,
            createdAt: true,
            updatedAt: true,
            users: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        order_histories: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            actorId: true,
            actorName: true,
            action: true,
            payload: true,
            createdAt: true,
          },
        },
        purchase_orders: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            poNumber: true,
            poFile: true,
            depositProofFile: true,
            notes: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundError("Order", orderId);
    }

    // Authorization: Check if user belongs to same company
    if (order.companyId !== companyId) {
      throw new ForbiddenError("Access denied: Order belongs to different company");
    }

    return successResponse(order);
  } catch (error) {
    return handleApiError(error);
  }
}

