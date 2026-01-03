"use client";

import { useQuery } from "@tanstack/react-query";

interface UseKPIOptions {
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

/**
 * React Query hook for fetching KPI data
 * Provides automatic caching, refetching, and error handling
 */
export function useKPI(options: UseKPIOptions = {}) {
  const { startDate, endDate, enabled = true } = options;

  return useQuery({
    queryKey: ["kpi", { startDate, endDate }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/kpi?${params}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch KPI");
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch KPI");
      }
      return result.data;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

