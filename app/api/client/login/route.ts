import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { SignJWT } from "jose";

const loginSchema = z.object({
  identifier: z.string().min(3), // email or phone
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid credentials",
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
        { success: false, error: "Invalid email/phone or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, client.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email/phone or password" },
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

