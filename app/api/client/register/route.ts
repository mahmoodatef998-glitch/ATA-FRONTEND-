import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  phone: z.string().min(8),
  password: z.string().min(6),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
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

    const { phone, password, name, email } = validation.data;

    // Check if client exists
    let client = await prisma.clients.findUnique({
      where: { phone },
    });

    if (client && client.hasAccount) {
      return NextResponse.json(
        { success: false, error: "Account already exists. Please login instead." },
        { status: 400 }
      );
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
          name: name || client.name,
          email: email || client.email,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new client
      client = await prisma.clients.create({
        data: {
          phone,
          password: hashedPassword,
          hasAccount: true,
          name: name || "Client",
          email,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: client.id,
        name: client.name,
        phone: client.phone,
        email: client.email,
      },
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Error creating client account:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while creating account" },
      { status: 500 }
    );
  }
}


