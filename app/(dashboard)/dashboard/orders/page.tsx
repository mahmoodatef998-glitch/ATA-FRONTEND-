"use client";

import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { OrdersClient } from "@/components/dashboard/orders-client";
import { useEffect } from "react";

/**
 * ✅ Performance: Client Component Boundary
 * 
 * This page is now a Client Component to prevent:
 * - Server Component re-execution on navigation
 * - RSC storms
 * - Repeated HEAD/GET requests
 * 
 * Data fetching is handled by OrdersClient component
 * which uses React Query for client-side caching
 */
export default function OrdersPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  if (!session?.user) {
    return null; // Will redirect
  }

  return <OrdersClient />;
}
