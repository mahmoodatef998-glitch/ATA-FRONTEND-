"use client";

import { useQuery } from "@tanstack/react-query";

/**
 * React Query hook for fetching KPI data
 * Provides automatic caching, refetching, and error handling
 */
export function useKPI() {
  return useQuery({
    queryKey: ["kpi"],
    queryFn: async () => {
      const response = await fetch("/api/kpi");
      if (!response.ok) {
        throw new Error("Failed to fetch KPI");
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch KPI");
      }
      return result.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

