"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserRole } from "@prisma/client";

/**
 * Team Data Prefetcher Component
 * 
 * Automatically prefetches data and pages for team section when it loads
 * This ensures data is ready when users navigate to team sub-pages
 */
export function TeamDataPrefetcher() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Only prefetch when authenticated
    if (status !== "authenticated" || !session?.user) {
      return;
    }

    const userRole = session.user.role;

    // Prefetch data and pages based on user role
    const prefetchData = async () => {
      try {
        // ✅ Performance: Disable RSC prefetching - causes excessive _rsc requests
        // Client-side navigation is fast enough with React Query cache
        // const pagesToPrefetch = [
        //   "/team/tasks",
        //   "/team/attendance",
        //   "/team/kpi",
        // ];
        // pagesToPrefetch.forEach((page) => {
        //   router.prefetch(page);
        // });

        const prefetches: Promise<any>[] = [];

        // Common prefetches for all team members
        if (
          userRole === UserRole.TECHNICIAN ||
          userRole === UserRole.SUPERVISOR ||
          userRole === UserRole.ADMIN ||
          userRole === UserRole.OPERATIONS_MANAGER ||
          userRole === UserRole.HR ||
          userRole === UserRole.ACCOUNTANT
        ) {
          // Prefetch team attendance stats
          prefetches.push(
            fetch("/api/team/attendance-stats", { credentials: "include" })
              .then((res) => res.json())
              .then((data) => {
                if (data.success) {
                  queryClient.setQueryData(["team", "attendance-stats"], data.data);
                }
              })
              .catch(() => {})
          );

          // Prefetch tasks
          prefetches.push(
            fetch("/api/tasks?status=PENDING&status=IN_PROGRESS&status=COMPLETED&limit=100", { credentials: "include" })
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

        // Prefetch for technicians
        if (userRole === UserRole.TECHNICIAN) {
          // Prefetch KPI
          prefetches.push(
            fetch("/api/kpi", { credentials: "include" })
              .then((res) => res.json())
              .then((data) => {
                if (data.success) {
                  queryClient.setQueryData(["kpi"], data.data);
                }
              })
              .catch(() => {})
          );
        }

        // Prefetch for supervisors/admins
        if (
          userRole === UserRole.SUPERVISOR ||
          userRole === UserRole.ADMIN ||
          userRole === UserRole.OPERATIONS_MANAGER
        ) {
          // ✅ Performance: Disable RSC prefetching
          // router.prefetch("/team/members");

          // Prefetch team KPI
          prefetches.push(
            fetch("/api/kpi/team", { credentials: "include" })
              .then((res) => res.json())
              .then((data) => {
                if (data.success) {
                  queryClient.setQueryData(["kpi", "team", {}], data.data);
                }
              })
              .catch(() => {})
          );

          // Prefetch team members data
          prefetches.push(
            fetch("/api/team/members", { credentials: "include" })
              .then((res) => res.json())
              .then((data) => {
                if (data.success) {
                  queryClient.setQueryData(["team", "members"], data.data);
                }
              })
              .catch(() => {})
          );
        }

        // Execute all prefetches in parallel (non-blocking)
        await Promise.allSettled(prefetches);
      } catch (error) {
        // Silently fail - prefetching is optional
        console.debug("Team prefetch error (non-critical):", error);
      }
    };

    // Start prefetching immediately (non-blocking)
    prefetchData();
  }, [queryClient, router, status, session?.user?.role]);

  // This component doesn't render anything
  return null;
}

