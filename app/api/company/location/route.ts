import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateLocationSchema = z.object({
  officeLat: z.number().min(-90).max(90),
  officeLng: z.number().min(-180).max(180),
});

/**
 * GET - Get company office location
 */
export async function GET(request: NextRequest) {
  try {
    // Build-time probe safe response (avoid auth/prisma during Next build probes)
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return NextResponse.json({ success: true, ok: true }, { status: 200 });
    }

    const [{ prisma }, { requireRole }, { UserRole }] = await Promise.all([
      import("@/lib/prisma"),
      import("@/lib/auth-helpers"),
      import("@prisma/client"),
    ]);

    const session = await requireRole([UserRole.ADMIN]);
    
    const company = await prisma.companies.findUnique({
      where: { id: session.user.companyId },
      select: {
        id: true,
        name: true,
        officeLat: true,
        officeLng: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        officeLat: company.officeLat,
        officeLng: company.officeLng,
      },
    });
  } catch (error: any) {
    console.error("Error fetching company location:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch company location" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update company office location
 */
export async function PATCH(request: NextRequest) {
  try {
    const [{ prisma }, { requireRole }, { UserRole }] = await Promise.all([
      import("@/lib/prisma"),
      import("@/lib/auth-helpers"),
      import("@prisma/client"),
    ]);

    const session = await requireRole([UserRole.ADMIN]);
    
    const body = await request.json();
    const validation = updateLocationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid location data",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { officeLat, officeLng } = validation.data;

    // Update company location
    const updatedCompany = await prisma.companies.update({
      where: { id: session.user.companyId },
      data: {
        officeLat,
        officeLng,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        officeLat: true,
        officeLng: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        officeLat: updatedCompany.officeLat,
        officeLng: updatedCompany.officeLng,
      },
      message: "Office location updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating company location:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update company location" },
      { status: 500 }
    );
  }
}

