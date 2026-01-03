"use client";

import { useQuery } from "@tanstack/react-query";

interface UseOvertimeOptions {
  approved?: boolean;
  limit?: number;
  enabled?: boolean;
}

/**
 * React Query hook for fetching overtime data
 * Provides automatic caching, refetching, and error handling
 */
export function useOvertime(options: UseOvertimeOptions = {}) {
  const { approved, limit, enabled = true } = options;

  return useQuery({
    queryKey: ["overtime", { approved, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (approved !== undefined) {
        params.append("approved", approved.toString());
      }
      if (limit) {
        params.append("limit", limit.toString());
      }

      const response = await fetch(`/api/overtime?${params}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch overtime");
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch overtime");
      }
      return result.data;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

