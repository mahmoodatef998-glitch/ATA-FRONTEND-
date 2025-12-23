import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { applyRateLimit, RATE_LIMITS, getRateLimitHeaders } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// Simple phone normalization function (inline to avoid import issues)
function normalizePhoneNumber(phone: string): string {
  if (!phone) return "";
  // Remove spaces, dashes, parentheses, and plus signs
  return phone.replace(/[\s\-+()]/g, "");
}

// Simple text sanitization (inline to avoid import issues)
function sanitizeText(text: string): string {
  if (!text) return "";
  // Remove HTML tags
  const withoutHtml = text.replace(/<[^>]*>/g, "");
  // Remove special characters that could be used for injection
  const sanitized = withoutHtml.replace(/[<>'"&]/g, "");
  return sanitized.trim();
}

const registerSchema = z.object({
  phone: z.string().min(8).max(20),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().max(255).optional().or(z.literal("")),
  // Honeypot field - if filled, it's a bot (accept empty string or undefined)
  website: z.string().optional().default(""),
});

export async function POST(request: NextRequest) {
  // Reduced logging for better performance - only log errors
  const isDev = process.env.NODE_ENV === "development";
  
  // Apply rate limiting
  let rateLimitInfo: any = null;
  try {
    const rateLimitResult = await applyRateLimit(request, RATE_LIMITS.AUTH_REGISTER);
    if (rateLimitResult.response) {
      return rateLimitResult.response;
    }
    rateLimitInfo = rateLimitResult.rateLimitInfo;
  } catch (rateLimitError: any) {
    logger.error("[Register] Rate limit error", rateLimitError, "client-register");
    return NextResponse.json(
      { success: false, error: "Rate limit check failed" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      logger.warn("[Register] Validation failed", { errors: validation.error.errors }, "client-register");
      return NextResponse.json(
        {
          success: false,
          error: "Invalid data",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    let { phone, password, name, email, website } = validation.data;

    // Honeypot check - if website field is filled, it's a bot
    if (website && typeof website === "string" && website.length > 0) {
      logger.warn("[Register] Bot detected in registration", { website }, "client-register");
      return NextResponse.json(
        { success: false, error: "Registration failed. Please try again." },
        { status: 400 }
      );
    }

    // Sanitize inputs
    try {
      if (name) {
        name = sanitizeText(name);
      }
      if (email) {
        email = sanitizeText(email);
      }
      phone = normalizePhoneNumber(phone);
    } catch (sanitizeError: any) {
      logger.error("[Register] Error sanitizing inputs", sanitizeError, "client-register");
      return NextResponse.json(
        { success: false, error: "Invalid input data" },
        { status: 400 }
      );
    }

    // Validate phone number format (basic check - allow any 8+ digits)
    try {
      const cleanedPhone = phone.replace(/\D/g, ""); // Remove non-digits
      if (cleanedPhone.length < 8) {
        return NextResponse.json(
          { success: false, error: "Please enter a valid phone number (at least 8 digits)" },
          { status: 400 }
        );
      }
      phone = cleanedPhone; // Use cleaned phone
    } catch (phoneError: any) {
      logger.error("[Register] Error validating phone", phoneError, "client-register");
      return NextResponse.json(
        { success: false, error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Check password strength (simplified - just check length for now)
    try {
      if (password.length < 8) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Password must be at least 8 characters long",
          },
          { status: 400 }
        );
      }
    } catch (passwordError: any) {
      logger.error("[Register] Error checking password strength", passwordError, "client-register");
      return NextResponse.json(
        { success: false, error: "Error validating password" },
        { status: 400 }
      );
    }

    // Check if client exists
    let client = await prisma.clients.findUnique({
      where: { phone },
      select: {
        id: true,
        hasAccount: true,
        accountStatus: true,
        name: true,
        email: true,
      },
    });

    if (client && client.hasAccount && client.accountStatus === "APPROVED") {
      return NextResponse.json(
        { success: false, error: "Account already exists. Please login instead." },
        { status: 400 }
      );
    }

    // If client exists but account is pending or rejected, allow re-registration
    if (client && client.hasAccount && (client.accountStatus === "PENDING" || client.accountStatus === "REJECTED")) {
      // Allow updating the account (e.g., changing password or email)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create or update client
    if (client) {
      // Update existing client with account info
      client = await prisma.clients.update({
        where: { id: client.id },
        data: {
          password: hashedPassword,
          hasAccount: true,
          accountStatus: "PENDING", // Requires admin approval
          name: name || client.name,
          email: email || client.email,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          hasAccount: true,
          accountStatus: true,
        },
      });
    } else {
      // Create new client
      client = await prisma.clients.create({
        data: {
          phone,
          password: hashedPassword,
          hasAccount: true,
          accountStatus: "PENDING", // Requires admin approval
          name: name || "Client",
          email,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          hasAccount: true,
          accountStatus: true,
        },
      });
    }

    // Notify admins about new client registration
    // Use select to only fetch needed fields for better performance
    try {
      const admins = await prisma.users.findMany({
        where: {
          role: "ADMIN",
        },
        select: {
          id: true,
          companyId: true,
        },
      });

      // Create notifications for admins (don't fail registration if this fails)
      if (admins.length > 0) {
        try {
          await Promise.all(
            admins.map((admin) =>
              prisma.notifications.create({
                data: {
                  companyId: admin.companyId,
                  userId: admin.id,
                  title: `🔔 New Client Registration - ${client.name}`,
                  body: `Client ${client.name} has registered and is waiting for approval.`,
                  meta: {
                    clientId: client.id,
                    clientName: client.name,
                    actionRequired: true,
                    actionType: "approve_client",
                    waitingFor: "admin_approval",
                  },
                  read: false,
                },
              })
            )
          );

          // Emit Socket.io event for real-time notification
          if (global.io) {
            admins.forEach((admin) => {
              try {
                global.io?.to(`company_${admin.companyId}`).emit("new_notification", {
                  clientId: client.id,
                  title: `New Client Registration`,
                  body: `${client.name} is waiting for approval`,
                  type: "client_registration",
                });
              } catch (socketError) {
                // Don't fail if Socket.io fails
                logger.error("[Register] Socket.io error", socketError, "client-register");
              }
            });
          }
        } catch (notificationError) {
          // Log but don't fail registration if notifications fail
          logger.error("[Register] Error creating notifications", notificationError, "client-register");
        }
      }
    } catch (adminError) {
      // Log but don't fail registration if admin fetch fails
      logger.error("[Register] Error fetching admins", adminError, "client-register");
    }

    // Get rate limit headers (from the check we already did)
    let rateLimitHeaders: Record<string, string> = {};
    if (rateLimitInfo) {
      try {
        rateLimitHeaders = getRateLimitHeaders(rateLimitInfo.remaining, rateLimitInfo.resetAt, rateLimitInfo.limit);
      } catch (headerError: any) {
        logger.error("[Register] Error getting rate limit headers", headerError, "client-register");
        // Continue without headers if there's an error
      }
    }

    const response = NextResponse.json({
      success: true,
      data: {
        id: client.id,
        name: client.name,
        phone: client.phone,
        email: client.email,
        accountStatus: client.accountStatus,
      },
      message: "Account created successfully. Please wait for admin approval before you can login.",
    });

    // Add rate limit headers
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error: any) {
    logger.error("[Register] Error creating client account", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
    }, "client-register");
    
    // Determine user-friendly error message
    let errorMessage = "An error occurred while creating account. Please try again.";
    
    // Handle specific error types
    if (error?.code === "P2002") {
      // Prisma unique constraint violation
      if (error?.meta?.target?.includes("phone")) {
        errorMessage = "This phone number is already registered. Please login instead.";
      } else if (error?.meta?.target?.includes("email")) {
        errorMessage = "This email is already registered. Please use a different email.";
      } else {
        errorMessage = "This account already exists. Please login instead.";
      }
    } else if (error?.message) {
      // Use error message if available
      errorMessage = error.message;
    }
    
    // Return JSON response (not HTML error page)
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        ...(process.env.NODE_ENV === "development" && {
          details: error?.stack,
          errorName: error?.name,
          errorCode: error?.code,
        })
      },
      { status: 500 }
    );
  }
}


