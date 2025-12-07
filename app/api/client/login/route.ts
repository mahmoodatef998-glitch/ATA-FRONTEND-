import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { SignJWT } from "jose";
import { applyRateLimit, RATE_LIMITS, getRateLimitHeaders } from "@/lib/rate-limit";

const loginSchema = z.object({
  identifier: z.string().min(3), // email or phone
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const { response: rateLimitResponse, rateLimitInfo } = await applyRateLimit(request, RATE_LIMITS.AUTH_LOGIN);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Username or password incorrect",
        },
        { status: 400 }
      );
    }

    const { identifier, password } = validation.data;

    // Check if identifier is email or phone
    const isEmail = identifier.includes("@");

    // Find client by email or phone
    const client = await prisma.clients.findFirst({
      where: isEmail
        ? { email: identifier }
        : { phone: identifier },
    });

    if (!client || !client.hasAccount || !client.password) {
      return NextResponse.json(
        { success: false, error: "Username or password incorrect" },
        { status: 401 }
      );
    }

    // Check if account is approved
    if (client.accountStatus === "PENDING") {
      return NextResponse.json(
        { 
          success: false, 
          error: "Your account is pending approval. Please wait for admin approval before logging in.",
          accountStatus: "PENDING"
        },
        { status: 403 }
      );
    }

    if (client.accountStatus === "REJECTED") {
      return NextResponse.json(
        { 
          success: false, 
          error: client.rejectionReason || "Your account has been rejected. Please contact support for more information.",
          accountStatus: "REJECTED"
        },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, client.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Username or password incorrect" },
        { status: 401 }
      );
    }

    // Create JWT token for client session
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "secret");
    const token = await new SignJWT({
      clientId: client.id,
      phone: client.phone,
      name: client.name,
      type: "client",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .sign(secret);

    // Get rate limit headers (from the check we already did)
    const rateLimitHeaders = rateLimitInfo 
      ? getRateLimitHeaders(rateLimitInfo.remaining, rateLimitInfo.resetAt, rateLimitInfo.limit)
      : {};

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      data: {
        id: client.id,
        name: client.name,
        phone: client.phone,
        email: client.email,
      },
      message: "Login successful",
    });

    // Add rate limit headers
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Set HTTP-only cookie
    response.cookies.set("client-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error during client login:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during login" },
      { status: 500 }
    );
  }
}

