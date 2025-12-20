import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  // Build-time probe safe response (do not require auth during Next build probes)
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return NextResponse.json({ success: true, ok: true }, { status: 200 });
  }

  return NextResponse.json(
    { success: true, message: "Endpoint requires PATCH; probe handled." },
    { status: 200 }
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const [{ prisma }, { requireRole }, { UserRole }] = await Promise.all([
      import("@/lib/prisma"),
      import("@/lib/auth-helpers"),
      import("@prisma/client"),
    ]);

    const session = await requireRole([UserRole.ADMIN]);
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, rejectionReason } = body; // action: "approve" or "reject"

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (user.companyId !== session.user.companyId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: User belongs to different company" },
        { status: 403 }
      );
    }

    if (user.accountStatus !== "PENDING") {
      return NextResponse.json(
        { success: false, error: `User account is already ${user.accountStatus}` },
        { status: 400 }
      );
    }

    const approverId = typeof session.user.id === "string" ? parseInt(session.user.id) : session.user.id;

    if (action === "approve") {
      // Approve user
      const updatedUser = await prisma.users.update({
        where: { id: userId },
        data: {
          accountStatus: "APPROVED" as any,
          approvedAt: new Date(),
          approvedById: approverId,
          rejectionReason: null,
        },
      });

      // Create notification for user
      await prisma.notifications.create({
        data: {
          companyId: user.companyId,
          userId: userId,
          title: "Account Approved",
          body: "Your account has been approved. You can now log in.",
          meta: {
            type: "account_approved",
          },
        },
      });

      // Emit Socket.io event
      if (global.io) {
        global.io.to(`company_${user.companyId}`).emit("user_approved", {
          userId: userId,
          userName: user.name,
        });
      }

      return NextResponse.json({
        success: true,
        data: updatedUser,
        message: "User account approved successfully",
      });
    } else if (action === "reject") {
      // Reject user
      const updatedUser = await prisma.users.update({
        where: { id: userId },
        data: {
          accountStatus: "REJECTED" as any,
          approvedAt: null,
          approvedById: approverId,
          rejectionReason: rejectionReason || "Account rejected by admin",
        },
      });

      // Create notification for user
      await prisma.notifications.create({
        data: {
          companyId: user.companyId,
          userId: userId,
          title: "Account Rejected",
          body: rejectionReason || "Your account registration has been rejected.",
          meta: {
            type: "account_rejected",
            reason: rejectionReason,
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: updatedUser,
        message: "User account rejected",
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action. Use 'approve' or 'reject'" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error approving/rejecting user:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}

