import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Optimize DATABASE_URL for connection pooling
 * Adds connection pool parameters if not already present
 */
function optimizeDatabaseUrl(url: string | undefined): string | undefined {
  if (!url) return url;
  
  try {
    const urlObj = new URL(url);
    
    // Add connection pool parameters if not present
    if (!urlObj.searchParams.has("connection_limit")) {
      // For Railway/Supabase: Use 20 connections (safe for free tier)
      // For production: Can increase to 30-50 based on plan
      urlObj.searchParams.set("connection_limit", "20");
    }
    
    if (!urlObj.searchParams.has("pool_timeout")) {
      // Wait 10 seconds for available connection
      urlObj.searchParams.set("pool_timeout", "10");
    }
    
    if (!urlObj.searchParams.has("connect_timeout")) {
      // Connection timeout of 10 seconds
      urlObj.searchParams.set("connect_timeout", "10");
    }
    
    // Ensure SSL mode for Supabase
    if (url.includes("supabase") && !urlObj.searchParams.has("sslmode")) {
      urlObj.searchParams.set("sslmode", "require");
    }
    
    return urlObj.toString();
  } catch {
    // If URL parsing fails, return original
    return url;
  }
}

/**
 * Prisma Client instance with optimized connection pooling
 * 
 * Performance Optimizations:
 * - Connection pooling (20 connections by default)
 * - Query result caching (via application-level cache)
 * - Minimal logging in production
 * - Singleton pattern to prevent multiple instances
 * 
 * Connection Pool Settings:
 * - connection_limit: 20 (safe for free tier, can increase for paid plans)
 * - pool_timeout: 10s (wait time for available connection)
 * - connect_timeout: 10s (initial connection timeout)
 * 
 * @example
 * ```typescript
 * import { prisma } from '@/lib/prisma'
 * const users = await prisma.users.findMany()
 * ```
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Disable query logging for better performance (only log errors)
    log: process.env.NODE_ENV === "production" 
      ? ["error"] 
      : process.env.NODE_ENV === "development"
      ? ["error", "warn", "info"]
      : ["error", "warn"],
    // Optimize connection pool
    datasources: {
      db: {
        url: optimizeDatabaseUrl(process.env.DATABASE_URL),
      },
    },
  });

// Prevent multiple instances in development (Hot Reload)
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Graceful shutdown: Disconnect Prisma on process termination
if (typeof process !== "undefined") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
  
  process.on("SIGINT", async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  
  process.on("SIGTERM", async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

