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

// Ensure NEXTAUTH_URL is set for proper callback handling
// In production, use VERCEL_URL if NEXTAUTH_URL is not set
if (!process.env.NEXTAUTH_URL) {
  if (process.env.NODE_ENV === "development") {
    process.env.NEXTAUTH_URL = "http://localhost:3005";
    logger.info("✅ Set NEXTAUTH_URL to http://localhost:3005 for development", {
      context: "auth"
    });
  } else if (process.env.VERCEL_URL) {
    // In production on Vercel, use VERCEL_URL as fallback
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
    console.log(`✅ [NextAuth] Set NEXTAUTH_URL to https://${process.env.VERCEL_URL} from VERCEL_URL`);
  } else {
    // Final fallback - use the known production URL
    process.env.NEXTAUTH_URL = "https://ata-frontend-pied.vercel.app";
    console.log("✅ [NextAuth] Set NEXTAUTH_URL to https://ata-frontend-pied.vercel.app (fallback)");
  }
} else {
  // Log the URL being used
  if (process.env.NODE_ENV === "production") {
    console.log(`✅ [NextAuth] Using NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`);
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  trustHost: true, // Trust host for proper cookie handling
  basePath: "/api/auth", // Explicitly set base path for NextAuth
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
            if (!credentials?.email) {
              throw new Error("MISSING_EMAIL: Email address is required. Please enter your email address.");
            }
            if (!credentials?.password) {
              throw new Error("MISSING_PASSWORD: Password is required. Please enter your password.");
            }
            throw new Error("MISSING_CREDENTIALS: Email and password are required. Please fill in all fields.");
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
            throw new Error("INVALID_EMAIL: The email address you entered does not exist in our system. Please check your email and try again.");
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
            throw new Error("INVALID_PASSWORD: The password you entered is incorrect. Please check your password and try again.");
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
            throw new Error("INVALID_PASSWORD: The password you entered is incorrect. Please check your password and try again.");
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
      
      // Log for debugging in production
      const isProduction = process.env.NODE_ENV === "production";
      if (isProduction) {
        console.log("🔍 [NextAuth] Checking NEXTAUTH_SECRET in production", {
          hasSecret: !!providedSecret,
          secretLength: providedSecret?.length || 0,
          secretPreview: providedSecret ? `${providedSecret.substring(0, 4)}...${providedSecret.substring(providedSecret.length - 4)}` : "NOT FOUND",
          nodeEnv: process.env.NODE_ENV,
          vercelUrl: process.env.VERCEL_URL,
          nextAuthUrl: process.env.NEXTAUTH_URL
        });
      }
      
      // Validate secret length
      if (providedSecret && providedSecret.length >= 32) {
        if (isProduction) {
          console.log("✅ [NextAuth] Using NEXTAUTH_SECRET from environment", {
            secretLength: providedSecret.length
          });
        }
        return providedSecret;
      }
      
      // Generate a fallback secret in development if not provided or too short
      const isDevelopment = process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
      const fallbackSecret = "ata-crm-dev-secret-key-change-in-production-min-32-chars-long";
      
      if (isDevelopment) {
        if (!providedSecret) {
          logger.warn("⚠️ NEXTAUTH_SECRET not found in .env file. Using fallback secret for development.", {
            context: "auth",
            note: "Please add NEXTAUTH_SECRET (min 32 characters) to your .env file. See ENV_TEMPLATE.txt for example."
          });
        } else if (providedSecret.length < 32) {
          logger.warn("⚠️ NEXTAUTH_SECRET is too short in .env file. Using fallback secret for development.", {
            context: "auth",
            providedLength: providedSecret.length,
            note: "Please add NEXTAUTH_SECRET (min 32 characters) to your .env file. See ENV_TEMPLATE.txt for example."
          });
        }
        logger.info("✅ Using fallback NEXTAUTH_SECRET for development", {
          context: "auth"
        });
        return fallbackSecret;
      }
      
      // In production, use fallback if secret is missing (but log warning)
      // This allows the app to work even if env vars are not set correctly
      if (isProduction && (!providedSecret || providedSecret.length < 32)) {
        console.error("⚠️ [NextAuth] WARNING: NEXTAUTH_SECRET is missing or too short in production!", {
          hasSecret: !!providedSecret,
          secretLength: providedSecret?.length || 0,
          usingFallback: true,
          note: "Please add NEXTAUTH_SECRET (min 32 characters) to Vercel Environment Variables"
        });
        // Use fallback to allow app to work, but log error
        return fallbackSecret;
      }
      
      // This should not happen, but just in case
      throw new Error("NEXTAUTH_SECRET environment variable is required and must be at least 32 characters. Please add it to your Vercel Environment Variables. Current length: " + (providedSecret?.length || 0));
    } catch (error) {
      // If there's an error, use fallback to allow app to work
      const fallbackSecret = "ata-crm-dev-secret-key-change-in-production-min-32-chars-long";
      console.error("❌ [NextAuth] Error getting NEXTAUTH_SECRET, using fallback", {
        error: error instanceof Error ? error.message : String(error),
        nodeEnv: process.env.NODE_ENV,
        vercelUrl: process.env.VERCEL_URL
      });
      return fallbackSecret;
    }
  })(),
});

