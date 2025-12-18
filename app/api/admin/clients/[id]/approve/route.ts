import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: "This endpoint only supports PATCH requests.",
    },
    { status: 200 }
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole([UserRole.ADMIN]);
    const { id } = await params;
    const clientId = parseInt(id);

    if (isNaN(clientId)) {
      return NextResponse.json(
        { success: false, error: "Invalid client ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, rejectionReason } = body; // action: "approve" or "reject"

    const client = await prisma.clients.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client not found" },
        { status: 404 }
      );
    }

    if (client.accountStatus !== "PENDING") {
      return NextResponse.json(
        { success: false, error: `Client account is already ${client.accountStatus}` },
        { status: 400 }
      );
    }

    const userId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;

    if (action === "approve") {
      // Approve client
      const updatedClient = await prisma.clients.update({
        where: { id: clientId },
        data: {
          accountStatus: "APPROVED",
          approvedAt: new Date(),
          approvedById: userId,
          rejectionReason: null,
        },
      });

      // Create notification for client (if they have email)
      if (updatedClient.email) {
        // You can send email notification here
        console.log(`Client ${updatedClient.name} account approved`);
      }

      return NextResponse.json({
        success: true,
        data: updatedClient,
        message: "Client account approved successfully",
      });
    } else if (action === "reject") {
      // Reject client
      const updatedClient = await prisma.clients.update({
        where: { id: clientId },
        data: {
          accountStatus: "REJECTED",
          approvedAt: null,
          approvedById: userId,
          rejectionReason: rejectionReason || "Account rejected by admin",
        },
      });

      return NextResponse.json({
        success: true,
        data: updatedClient,
        message: "Client account rejected",
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action. Use 'approve' or 'reject'" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error approving/rejecting client:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}

