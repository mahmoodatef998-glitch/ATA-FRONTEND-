"use client";

import { Suspense } from "react";
import { OrdersClient } from "@/components/dashboard/orders-client";
import { OrdersSkeleton } from "@/components/loading-skeletons/orders-skeleton";

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
 * 
 * ✅ Fix: Removed duplicate session check - OrdersClient handles it
 * ✅ Fix: Added Suspense boundary for better loading states
 */
export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersSkeleton />}>
      <OrdersClient />
    </Suspense>
  );
}
