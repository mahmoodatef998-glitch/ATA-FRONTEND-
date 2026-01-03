"use client";

import { useQuery } from "@tanstack/react-query";

/**
 * React Query hook for fetching client orders
 * Provides automatic caching, refetching, and error handling
 */
export function useClientOrders() {
  return useQuery({
    queryKey: ["clientOrders"],
    queryFn: async () => {
      const response = await fetch("/api/client/orders", {
        credentials: "include",
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("UNAUTHORIZED");
        }
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      return data.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error instanceof Error && error.message === "UNAUTHORIZED") {
        return false;
      }
      return failureCount < 2;
    },
  });
}

