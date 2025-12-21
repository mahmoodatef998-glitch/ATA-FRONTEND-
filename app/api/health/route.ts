import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmailConfig } from "@/lib/email";
import { existsSync } from "fs";
import { join } from "path";
import { isCloudinaryConfigured, getCloudinaryInstance } from "@/lib/cloudinary";

/**
 * Health Check Endpoint
 * Checks the health of various system components
 */
export async function GET() {
  const health = {
    status: "healthy" as "healthy" | "unhealthy" | "error",
    timestamp: new Date().toISOString(),
    services: {
      database: "unknown" as "connected" | "disconnected" | "unknown",
      email: "unknown" as "configured" | "not_configured" | "error" | "unknown",
      storage: "unknown" as "available" | "unavailable" | "error" | "unknown",
      cloudinary: "unknown" as "configured" | "not_configured" | "error" | "unknown",
    },
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
  };

  try {
    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.services.database = "connected";
    } catch (error) {
      health.services.database = "disconnected";
      health.status = "unhealthy";
    }

    // Check email service configuration
    try {
      const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
      if (emailConfigured) {
        const emailReady = await verifyEmailConfig();
        health.services.email = emailReady ? "configured" : "error";
      } else {
        health.services.email = "not_configured";
      }
    } catch (error) {
      health.services.email = "error";
      health.status = "unhealthy";
    }

    // Check Cloudinary configuration first
    let cloudinaryConfigured = false;
    try {
      cloudinaryConfigured = isCloudinaryConfigured();
      if (cloudinaryConfigured) {
        // Try to get Cloudinary instance to verify it's working
        const cloudinaryInstance = getCloudinaryInstance();
        health.services.cloudinary = cloudinaryInstance ? "configured" : "not_configured";
      } else {
        health.services.cloudinary = "not_configured";
      }
    } catch (error) {
      health.services.cloudinary = "error";
      // Don't mark as unhealthy if Cloudinary fails - it's optional
    }

    // Check storage (uploads directory)
    // Storage is optional if Cloudinary is configured
    try {
      const uploadsDir = join(process.cwd(), "public", "uploads");
      const storageExists = existsSync(uploadsDir);
      health.services.storage = storageExists ? "available" : "unavailable";
      // Only mark as unhealthy if storage is unavailable AND Cloudinary is not configured
      if (!storageExists && !cloudinaryConfigured) {
        health.status = "unhealthy";
      }
    } catch (error) {
      health.services.storage = "error";
      // Only mark as unhealthy if Cloudinary is not configured
      if (!cloudinaryConfigured) {
        health.status = "unhealthy";
      }
    }

    // Return appropriate status code
    const statusCode = health.status === "healthy" ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
