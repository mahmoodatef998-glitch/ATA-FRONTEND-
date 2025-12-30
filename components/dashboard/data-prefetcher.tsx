"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";

/**
 * Data Prefetcher Component
 * 
 * Automatically prefetches data and pages when the dashboard loads
 * This ensures data is ready when users navigate to other sections
 * 
 * Prefetches:
 * - Orders data and page
 * - Clients page
 * - Team stats (if applicable)
 * - Tasks
 * - KPI data
 * - Attendance stats
 */
export function DataPrefetcher() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Only prefetch when authenticated
    if (status !== "authenticated" || !session?.user) {
      return;
    }

    const companyId = session.user.companyId;
    const userRole = session.user.role;

    // Prefetch data and pages based on user role
    const prefetchData = async () => {
      try {
        // ✅ Prefetch common pages (Next.js will cache them)
        const pagesToPrefetch = [
          "/dashboard/orders",
          "/dashboard/clients",
          "/dashboard/notifications",
        ];

        // Prefetch pages in background
        pagesToPrefetch.forEach((page) => {
          router.prefetch(page);
        });

        // Common data for all users
        const commonPrefetches: Promise<any>[] = [
          // Prefetch orders data (for admins/managers)
          fetch("/api/orders?page=1&limit=20")
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                queryClient.setQueryData(["orders", { page: 1, limit: 20 }], data.data);
              }
            })
            .catch(() => {}), // Ignore errors - prefetch is optional

          // Prefetch clients data
          fetch("/api/users?role=CLIENT&limit=20")
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                queryClient.setQueryData(["clients", { limit: 20 }], data.data);
              }
            })
            .catch(() => {}),
        ];

        // Role-specific prefetches
        if (
          userRole === UserRole.ADMIN ||
          userRole === UserRole.OPERATIONS_MANAGER ||
          userRole === UserRole.SUPERVISOR
        ) {
          // Prefetch team page
          router.prefetch("/team");

          // Prefetch team stats
          commonPrefetches.push(
            fetch("/api/team/attendance-stats")
              .then((res) => res.json())
              .then((data) => {
                if (data.success) {
                  queryClient.setQueryData(["team", "attendance-stats"], data.data);
                }
              })
              .catch(() => {})
          );

          // Prefetch team KPI
          commonPrefetches.push(
            fetch("/api/kpi/team")
              .then((res) => res.json())
              .then((data) => {
                if (data.success) {
                  queryClient.setQueryData(["kpi", "team", {}], data.data);
                }
              })
              .catch(() => {})
          );
        }

        if (userRole === UserRole.TECHNICIAN) {
          // Prefetch team page
          router.prefetch("/team");

          // Prefetch tasks for technicians
          commonPrefetches.push(
            fetch("/api/tasks?status=PENDING&status=IN_PROGRESS&status=COMPLETED&limit=100")
              .then((res) => res.json())
              .then((data) => {
                if (data.success) {
                  queryClient.setQueryData(
                    ["tasks", { status: ["PENDING", "IN_PROGRESS", "COMPLETED"], limit: 100 }],
                    data.data
                  );
                }
              })
              .catch(() => {})
          );

          // Prefetch KPI for technicians
          commonPrefetches.push(
            fetch("/api/kpi")
              .then((res) => res.json())
              .then((data) => {
                if (data.success) {
                  queryClient.setQueryData(["kpi"], data.data);
                }
              })
              .catch(() => {})
          );
        }

        // Execute all prefetches in parallel (non-blocking)
        await Promise.allSettled(commonPrefetches);
      } catch (error) {
        // Silently fail - prefetching is optional
        console.debug("Prefetch error (non-critical):", error);
      }
    };

    // Start prefetching immediately (non-blocking)
    prefetchData();
  }, [queryClient, router, status, session?.user?.role, session?.user?.companyId]);

  // This component doesn't render anything
  return null;
}

