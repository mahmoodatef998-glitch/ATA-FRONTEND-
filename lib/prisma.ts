import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma Client instance with connection pooling and optimizations
 * 
 * Features:
 * - Connection pooling for better performance
 * - Query logging based on environment
 * - Singleton pattern to prevent multiple instances
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
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
    // Optimize connection pool for production
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Connection pool configuration
    // Note: Prisma uses connection pooling by default, but we can optimize it
    // by setting connection_limit in DATABASE_URL: postgresql://user:pass@host:port/db?connection_limit=10
  });

// Prevent multiple instances in development (Hot Reload)
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

