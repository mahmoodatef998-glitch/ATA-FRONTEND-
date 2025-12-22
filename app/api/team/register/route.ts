import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { applyRateLimit, RATE_LIMITS, getRateLimitHeaders } from "@/lib/rate-limit";
import { UserRole, UserAccountStatus } from "@prisma/client";
import { logger } from "@/lib/logger";

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  role: z.enum(["TECHNICIAN", "SUPERVISOR", "HR", "OPERATIONS_MANAGER"]),
});

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const { response: rateLimitResponse, rateLimitInfo } = await applyRateLimit(
    request,
    RATE_LIMITS.AUTH_REGISTER
  );
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

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

    const { name, email, password, role } = validation.data;

    // Check if email already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 400 }
      );
    }

    // Get first company (or create default)
    let company = await prisma.companies.findFirst();
    if (!company) {
      company = await prisma.companies.create({
        data: {
          name: "Default Company",
          slug: "default-company",
          updatedAt: new Date(),
        },
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with PENDING status
    let user;
    try {
      // Try using enum first
      user = await prisma.users.create({
        data: {
          companyId: company.id,
          name,
          email,
          password: hashedPassword,
          role: role as UserRole,
          accountStatus: UserAccountStatus.PENDING, // Requires admin approval
          updatedAt: new Date(), // Ensure updatedAt is set
        },
      });
      logger.info("User created with enum accountStatus", { userId: user.id, email }, "team-register");
    } catch (createError: any) {
      logger.error("Error creating user with enum", createError, "team-register", {
        email,
        code: createError.code,
        meta: createError.meta,
      });
      
      // If enum doesn't work, try string literal
      if (
        createError.message?.includes("UserAccountStatus") || 
        createError.message?.includes("accountStatus") ||
        createError.code === "P2003" ||
        createError.code === "P2011"
      ) {
        logger.warn("UserAccountStatus enum not available, trying string literal", { email }, "team-register");
        try {
          user = await prisma.users.create({
            data: {
              companyId: company.id,
              name,
              email,
              password: hashedPassword,
              role: role as UserRole,
              accountStatus: "PENDING" as any,
              updatedAt: new Date(), // Ensure updatedAt is set
            },
          });
          logger.info("User created with string literal accountStatus", { userId: user.id, email }, "team-register");
        } catch (secondError: any) {
          logger.error("Error creating user with string literal", secondError, "team-register", {
            email,
            code: secondError.code,
            meta: secondError.meta,
          });
          
          // If that fails, create without accountStatus and update via raw SQL
          logger.warn("Creating user without accountStatus, will update via SQL", { email }, "team-register");
          try {
            user = await prisma.users.create({
              data: {
                companyId: company.id,
                name,
                email,
                password: hashedPassword,
                role: role as UserRole,
                updatedAt: new Date(), // Ensure updatedAt is set
              },
            });
            logger.info("User created without accountStatus", { userId: user.id, email }, "team-register");
            
            // Update accountStatus manually via raw SQL
            try {
              await prisma.$executeRawUnsafe(
                `UPDATE users SET "accountStatus" = 'PENDING' WHERE id = $1`,
                user.id
              );
              logger.info("accountStatus updated via SQL", { userId: user.id }, "team-register");
              
              // Refresh user to get updated accountStatus
              user = await prisma.users.findUnique({
                where: { id: user.id },
              }) as any;
            } catch (updateError: any) {
              logger.error("Could not update accountStatus", updateError, "team-register", {
                userId: user.id,
                code: updateError.code,
              });
              // Continue anyway - user is created
            }
          } catch (thirdError: any) {
            logger.error("Error creating user without accountStatus", thirdError, "team-register", {
              email,
              code: thirdError.code,
              meta: thirdError.meta,
            });
            throw thirdError;
          }
        }
      } else {
        // Re-throw if it's a different error
        logger.error("Unexpected error, re-throwing", createError, "team-register");
        throw createError;
      }
    }

    // Notify admins about new registration
    const admins = await prisma.users.findMany({
      where: {
        companyId: company.id,
        role: UserRole.ADMIN,
      },
    });

    for (const admin of admins) {
      await prisma.notifications.create({
        data: {
          companyId: company.id,
          userId: admin.id,
          title: "New Team Member Registration",
          body: `${name} (${email}) has registered as ${role}. Please review and approve.`,
          meta: {
            userId: user.id,
            type: "user_registration",
            role: role,
          },
        },
      });
    }

    // Emit Socket.io event
    if (global.io) {
      global.io.to(`company_${company.id}`).emit("new_user_registration", {
        userId: user.id,
        name,
        email,
        role,
      });
    }

    const rateLimitHeaders = rateLimitInfo
      ? getRateLimitHeaders(rateLimitInfo.remaining, rateLimitInfo.resetAt, rateLimitInfo.limit)
      : {};

    const response = NextResponse.json(
      {
        success: true,
        message: "Registration successful. Your account is pending admin approval.",
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.accountStatus,
        },
      },
      { status: 201 }
    );

    // Add rate limit headers
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error: any) {
    logger.error("Team registration error", error, "team-register", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Registration failed",
        details: process.env.NODE_ENV === "development" ? {
          code: error.code,
          meta: error.meta,
        } : undefined,
      },
      { status: 500 }
    );
  }
}

