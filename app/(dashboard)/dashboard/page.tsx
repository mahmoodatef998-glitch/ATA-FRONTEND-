"use client";

import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { useEffect } from "react";

/**
 * ✅ Performance: Client Component Boundary
 * 
 * This page is now a Client Component to prevent:
 * - Server Component re-execution on navigation
 * - RSC storms
 * - Repeated HEAD/GET requests
 * 
 * Data fetching is handled by DashboardClient component
 * which uses React Query for client-side caching
 */
export default function DashboardPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
    
    if (status === "authenticated" && session?.user) {
      // Redirect team members to their dashboard
      if (session.user.role === UserRole.TECHNICIAN || session.user.role === UserRole.SUPERVISOR) {
        redirect("/team");
      }
    }
  }, [status, session?.user?.role]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  if (!session?.user) {
    return null; // Will redirect
  }

  return <DashboardClient />;
}
