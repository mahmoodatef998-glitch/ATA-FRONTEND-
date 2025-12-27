import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const updateKnowledgeSchema = z.object({
  description: z.string().optional(),
  products: z.string().optional(),
  services: z.string().optional(),
  contactInfo: z.string().optional(),
  businessHours: z.string().optional(),
  specialties: z.string().optional(),
});

/**
 * GET - Get company knowledge base
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const companyId = typeof session.user.companyId === "string" 
      ? parseInt(session.user.companyId) 
      : session.user.companyId;

    const company = await prisma.companies.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        description: true,
        products: true,
        services: true,
        contactInfo: true,
        businessHours: true,
        specialties: true,
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
      data: company,
    });
  } catch (error: any) {
    console.error("Error fetching company knowledge:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch company knowledge" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update company knowledge base
 */
export async function PATCH(request: NextRequest) {
  try {
    // Only admins can update company knowledge
    await requireRole([UserRole.ADMIN]);
    
    const session = await requireAuth();
    const companyId = typeof session.user.companyId === "string" 
      ? parseInt(session.user.companyId) 
      : session.user.companyId;

    const body = await request.json();
    const validatedData = updateKnowledgeSchema.parse(body);

    const company = await prisma.companies.update({
      where: { id: companyId },
      data: {
        description: validatedData.description ?? null,
        products: validatedData.products ?? null,
        services: validatedData.services ?? null,
        contactInfo: validatedData.contactInfo ?? null,
        businessHours: validatedData.businessHours ?? null,
        specialties: validatedData.specialties ?? null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        products: true,
        services: true,
        contactInfo: true,
        businessHours: true,
        specialties: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: company,
    });
  } catch (error: any) {
    console.error("Error updating company knowledge:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || "Failed to update company knowledge" },
      { status: 500 }
    );
  }
}

