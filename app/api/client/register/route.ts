import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { applyRateLimit, RATE_LIMITS, getRateLimitHeaders } from "@/lib/rate-limit";

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
    console.error("❌ [Register] Rate limit error:", rateLimitError);
    return NextResponse.json(
      { success: false, error: "Rate limit check failed" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      if (isDev) {
        console.error("❌ [Register] Validation failed:", validation.error.errors);
      }
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
      if (isDev) {
        console.warn("🚫 Bot detected in registration");
      }
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
      console.error("❌ [Register] Error sanitizing inputs:", sanitizeError);
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
      console.error("❌ [Register] Error validating phone:", phoneError);
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
      console.error("❌ [Register] Error checking password strength:", passwordError);
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
    const admins = await prisma.users.findMany({
      where: {
        role: "ADMIN",
      },
      select: {
        id: true,
        companyId: true,
      },
    });

    // Create notifications for admins
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
    if (global.io && admins.length > 0) {
      admins.forEach((admin) => {
        global.io.to(`company_${admin.companyId}`).emit("new_notification", {
          clientId: client.id,
          title: `New Client Registration`,
          body: `${client.name} is waiting for approval`,
          type: "client_registration",
        });
      });
    }

    // Get rate limit headers (from the check we already did)
    let rateLimitHeaders: Record<string, string> = {};
    if (rateLimitInfo) {
      try {
        rateLimitHeaders = getRateLimitHeaders(rateLimitInfo.remaining, rateLimitInfo.resetAt, rateLimitInfo.limit);
      } catch (headerError: any) {
        console.error("❌ [Register] Error getting rate limit headers:", headerError);
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
    console.error("❌ [Register] Error creating client account:");
    console.error("❌ [Register] Error message:", error?.message);
    console.error("❌ [Register] Error stack:", error?.stack);
    console.error("❌ [Register] Error name:", error?.name);
    
    // Return JSON response (not HTML error page)
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || "An error occurred while creating account",
        ...(process.env.NODE_ENV === "development" && {
          details: error?.stack,
          errorName: error?.name,
        })
      },
      { status: 500 }
    );
  }
}


