"use client";

import { NotificationsClient } from "@/components/dashboard/notifications-client";

/**
 * ✅ Performance: Client Component Boundary
 * 
 * This page is now a Client Component to prevent:
 * - Server Component re-execution on navigation
 * - RSC storms
 * - Repeated HEAD/GET requests
 * 
 * Data fetching is handled by NotificationsClient component
 * which uses React Query for client-side caching
 */
export default function NotificationsPage() {
  return <NotificationsClient />;
}

