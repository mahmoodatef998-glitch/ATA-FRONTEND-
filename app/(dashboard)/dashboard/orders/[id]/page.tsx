"use client";

import { OrderDetailClient } from "@/components/dashboard/order-detail-client";

/**
 * ✅ Performance: Client Component Boundary
 * 
 * This page is now a Client Component to prevent:
 * - Server Component re-execution on navigation
 * - RSC storms
 * - Repeated HEAD/GET requests
 * 
 * Data fetching is handled by OrderDetailClient component
 * which uses React Query for client-side caching
 */
export default function OrderDetailPage() {
  return <OrderDetailClient />;
}
