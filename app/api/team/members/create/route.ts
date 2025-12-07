import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserRole, UserAccountStatus } from "@prisma/client";
import { handleApiError } from "@/lib/error-handler";
import { requireAuth } from "@/lib/auth-helpers";
import { logger } from "@/lib/logger";
import { authorize } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";

const createMemberSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  phone: z.string().max(20).optional().nullable(),
  role: z.enum(["TECHNICIAN", "SUPERVISOR", "HR", "OPERATIONS_MANAGER", "ACCOUNTANT"]),
  isActive: z.boolean().default(true),
  department: z.string().max(100).optional().nullable(),
  specialization: z.string().max(100).optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    // Check permission using RBAC - HR and Admin can create team members
    const { userId, companyId } = await authorize(PermissionAction.USER_CREATE);
    
    const session = await requireAuth();

    const body = await request.json();
    const validation = createMemberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid data",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { name, email, password, phone, role, isActive, department, specialization } = validation.data;

    // Check if email already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with APPROVED status (admin is creating, so auto-approve)
    const user = await prisma.users.create({
      data: {
        companyId,
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: role as UserRole,
        isActive: isActive ?? true,
        accountStatus: UserAccountStatus.APPROVED, // Auto-approved by admin
        approvedAt: new Date(),
        approvedById: userId,
        department: department || null,
        specialization: specialization || null,
        updatedAt: new Date(),
      },
    });

    logger.info("Team member created", {
      userId: user.id,
      email: user.email,
      role: user.role,
      createdBy: userId,
      context: "team-members",
    });

    // Emit Socket.io event
    if (global.io) {
      global.io.to(`company_${companyId}`).emit("team_member_created", {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Team member created successfully",
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          specialization: user.specialization,
          status: user.accountStatus,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Error creating team member", error, "team-members");
    return handleApiError(error);
  }
}

