"use client";

import { useQuery } from "@tanstack/react-query";

interface UseTeamKPIOptions {
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

/**
 * React Query hook for fetching team KPI data
 * Provides automatic caching, refetching, and error handling
 */
export function useTeamKPI(options: UseTeamKPIOptions = {}) {
  const { startDate, endDate, enabled = true } = options;

  return useQuery({
    queryKey: ["kpi", "team", { startDate, endDate }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/kpi/team?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch team KPI");
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch team KPI");
      }
      return result.data;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

