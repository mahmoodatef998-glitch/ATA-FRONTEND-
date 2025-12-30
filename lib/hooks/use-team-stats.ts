"use client";

import { useQuery } from "@tanstack/react-query";

/**
 * React Query hook for fetching team attendance statistics
 * Provides automatic caching, refetching, and error handling
 */
export function useTeamStats() {
  return useQuery({
    queryKey: ["team", "attendance-stats"],
    queryFn: async () => {
      const response = await fetch("/api/team/attendance-stats");
      if (!response.ok) {
        throw new Error("Failed to fetch team stats");
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch team stats");
      }
      return result.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

