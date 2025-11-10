import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

export async function getServerSession() {
  return await auth();
}

export async function requireAuth() {
  const session = await getServerSession();
  
  if (!session || !session.user) {
    redirect("/login");
  }
  
  return session;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();
  
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("Unauthorized: Insufficient permissions");
  }
  
  return session;
}

export async function getCurrentUser() {
  const session = await getServerSession();
  return session?.user || null;
}

