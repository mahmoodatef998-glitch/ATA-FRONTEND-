import NextAuth, { type DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { logger } from "@/lib/logger";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      email: string;
      name: string;
      role: UserRole;
      companyId: number;
    } & DefaultSession["user"];
  }

  interface User {
    id: number;
    email: string;
    name: string;
    role: UserRole;
    companyId: number;
  }
}

// JWT types are handled by NextAuth automatically

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  trustHost: true, // Trust host for proper cookie handling
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            logger.warn("Authentication attempt with missing credentials", { context: "auth" });
            throw new Error("Email and password required");
          }

          const user = await prisma.users.findUnique({
            where: { email: credentials.email as string },
            include: { companies: true },
          });

          if (!user) {
            logger.warn("Authentication attempt with non-existent email", { 
              email: credentials.email,
              context: "auth" 
            });
            throw new Error("Username or password incorrect");
          }

          // Check account status - only APPROVED users can login
          if (user.accountStatus !== "APPROVED") {
            logger.warn("Authentication attempt with non-approved account", { 
              email: credentials.email,
              accountStatus: user.accountStatus,
              context: "auth" 
            });
            throw new Error(
              user.accountStatus === "PENDING"
                ? "Your account is pending admin approval. Please wait for approval before logging in."
                : user.accountStatus === "REJECTED"
                ? "Your account has been rejected. Please contact admin for more information."
                : "Your account is not approved. Please contact admin."
            );
          }

          if (!user.password) {
            logger.error("User account has no password set", { 
              userId: user.id,
              email: credentials.email,
              context: "auth" 
            });
            throw new Error("Username or password incorrect");
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            logger.warn("Authentication attempt with invalid password", { 
              email: credentials.email,
              context: "auth" 
            });
            throw new Error("Username or password incorrect");
          }

          logger.info("Successful authentication", { 
            userId: user.id,
            email: user.email,
            role: user.role,
            context: "auth" 
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            companyId: user.companyId,
          };
        } catch (error) {
          logger.error("Authentication error", { 
            error: error instanceof Error ? error.message : String(error),
            context: "auth" 
          });
          // Re-throw error so NextAuth can handle it properly
          if (error instanceof Error) {
            throw error;
          }
          throw new Error("An error occurred during authentication");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days - increased for better user experience
    updateAge: 0, // Update session on every request to prevent automatic logout
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days - match session maxAge
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirect errors to login page
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.companyId = user.companyId;
      }
      
      // Refresh token data periodically to ensure it stays valid
      // This prevents automatic logout due to stale tokens
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // Ensure id and companyId are numbers (JWT converts everything to string)
        const userId = typeof (token as any).id === "string" ? parseInt((token as any).id) : (token as any).id;
        const companyId = typeof (token as any).companyId === "string" ? parseInt((token as any).companyId) : (token as any).companyId;
        
        (session.user as any).id = userId;
        (session.user as any).email = (token as any).email;
        (session.user as any).name = (token as any).name;
        (session.user as any).role = (token as any).role;
        (session.user as any).companyId = companyId;
        
        // Note: Permissions are NOT loaded here because Prisma Client doesn't work on Edge Runtime
        // Permissions are loaded on-demand in API routes via /api/auth/me endpoint
        // Frontend uses PermissionsContext which fetches from /api/auth/me
      }
      return session;
    },
  },
  secret: (() => {
    try {
      // Use process.env directly to avoid circular dependencies with env.ts
      // env.ts uses lazy initialization which can cause issues during NextAuth initialization
      let providedSecret = process.env.NEXTAUTH_SECRET;
      
      // Remove quotes if present (sometimes .env files have quotes)
      if (providedSecret) {
        providedSecret = providedSecret.replace(/^["']|["']$/g, '').trim();
      }
      
      // Validate secret length
      if (providedSecret && providedSecret.length >= 32) {
        return providedSecret;
      }
      
      // Generate a fallback secret in development if not provided or too short
      const isDevelopment = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
      if (isDevelopment) {
        const fallbackSecret = "ata-crm-dev-secret-key-change-in-production-min-32-chars-long";
        if (!providedSecret) {
          logger.warn("NEXTAUTH_SECRET not found in .env file. Using fallback secret for development.", {
            context: "auth",
            note: "Please add NEXTAUTH_SECRET (min 32 characters) to your .env file. See ENV_TEMPLATE.txt for example."
          });
        } else if (providedSecret.length < 32) {
          logger.warn("NEXTAUTH_SECRET is too short in .env file. Using fallback secret for development.", {
            context: "auth",
            providedLength: providedSecret.length,
            note: "Please add NEXTAUTH_SECRET (min 32 characters) to your .env file. See ENV_TEMPLATE.txt for example."
          });
        }
        return fallbackSecret;
      }
      
      // In production, throw error if secret is missing or too short
      logger.error("NEXTAUTH_SECRET is required in production environment (min 32 characters)", { 
        context: "auth",
        hasSecret: !!providedSecret,
        secretLength: providedSecret?.length || 0
      });
      throw new Error("NEXTAUTH_SECRET environment variable is required and must be at least 32 characters. Please add it to your .env file. See ENV_TEMPLATE.txt for example.");
    } catch (error) {
      // If there's an error, use fallback in development
      const isDevelopment = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
      if (isDevelopment) {
        logger.warn("Error getting NEXTAUTH_SECRET, using fallback for development.", {
          context: "auth",
          error: error instanceof Error ? error.message : String(error)
        });
        return "ata-crm-dev-secret-key-change-in-production-min-32-chars-long";
      }
      throw error;
    }
  })(),
});

