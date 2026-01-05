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
        // ✅ Performance: Disable RSC prefetching - use client-side navigation only
        // RSC prefetching causes excessive _rsc requests and slows down navigation
        // Client-side navigation is faster for authenticated dashboard pages
        // const pagesToPrefetch = [
        //   "/dashboard/orders",
        //   "/dashboard/clients",
        //   "/dashboard/notifications",
        // ];
        // pagesToPrefetch.forEach((page) => {
        //   router.prefetch(page);
        // });

        // Common data for all users
        const commonPrefetches: Promise<any>[] = [];
        
        // ✅ Performance: Only prefetch if data is not already in cache
        // Prefetch orders data with credentials (only if not cached)
        if (!queryClient.getQueryData(["orders", { page: 1, limit: 20 }])) {
          commonPrefetches.push(
            fetch("/api/orders?page=1&limit=20", {
              credentials: "include",
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.success) {
                  queryClient.setQueryData(["orders", { page: 1, limit: 20 }], data.data);
                }
              })
              .catch(() => {}) // Ignore errors - prefetch is optional
          );
        }

        // ✅ Performance: Prefetch clients data with credentials (only if not cached)
        if (!queryClient.getQueryData(["clients", { limit: 20 }])) {
          commonPrefetches.push(
            fetch("/api/users?role=CLIENT&limit=20", {
              credentials: "include",
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.success) {
                  queryClient.setQueryData(["clients", { limit: 20 }], data.data);
                }
              })
              .catch(() => {})
          );
        }

        // ✅ Performance: Role-specific prefetches with credentials
        if (
          userRole === UserRole.ADMIN ||
          userRole === UserRole.OPERATIONS_MANAGER ||
          userRole === UserRole.SUPERVISOR
        ) {
          // ✅ Disable RSC prefetching - causes RSC storms
          // router.prefetch("/team");

          // ✅ Performance: Prefetch team stats with credentials (only if not cached)
          if (!queryClient.getQueryData(["team", "attendance-stats"])) {
            commonPrefetches.push(
              fetch("/api/team/attendance-stats", {
                credentials: "include",
              })
                .then((res) => res.json())
                .then((data) => {
                  if (data.success) {
                    queryClient.setQueryData(["team", "attendance-stats"], data.data);
                  }
                })
                .catch(() => {})
            );
          }

          // ✅ Performance: Prefetch team KPI with credentials (only if not cached)
          if (!queryClient.getQueryData(["kpi", "team", {}])) {
            commonPrefetches.push(
              fetch("/api/kpi/team", {
                credentials: "include",
              })
                .then((res) => res.json())
                .then((data) => {
                  if (data.success) {
                    queryClient.setQueryData(["kpi", "team", {}], data.data);
                  }
                })
                .catch(() => {})
            );
          }
        }

        if (userRole === UserRole.TECHNICIAN) {
          // ✅ Disable RSC prefetching - causes RSC storms
          // router.prefetch("/team");

          // ✅ Performance: Prefetch tasks for technicians with credentials (only if not cached)
          if (!queryClient.getQueryData(["tasks", { status: ["PENDING", "IN_PROGRESS", "COMPLETED"], limit: 100 }])) {
            commonPrefetches.push(
              fetch("/api/tasks?status=PENDING&status=IN_PROGRESS&status=COMPLETED&limit=100", {
                credentials: "include",
              })
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
          }

          // ✅ Performance: Prefetch KPI for technicians with credentials (only if not cached)
          if (!queryClient.getQueryData(["kpi"])) {
            commonPrefetches.push(
              fetch("/api/kpi", {
                credentials: "include",
              })
                .then((res) => res.json())
                .then((data) => {
                  if (data.success) {
                    queryClient.setQueryData(["kpi"], data.data);
                  }
                })
                .catch(() => {})
            );
          }
        }

        // Execute all prefetches in parallel (non-blocking)
        await Promise.allSettled(commonPrefetches);
      } catch (error) {
        // Silently fail - prefetching is optional
        console.debug("Prefetch error (non-critical):", error);
      }
    };

    // ✅ Fix: Add delay to prevent race conditions and duplicate calls
    // This ensures session cookies are fully ready before prefetching
    const timer = setTimeout(() => {
      prefetchData();
    }, 300); // 300ms delay to ensure session cookies are ready

    return () => clearTimeout(timer);
  }, [queryClient, router, status, session?.user?.role, session?.user?.companyId]);

  // This component doesn't render anything
  return null;
}

