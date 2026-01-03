"use client";

import { useQuery } from "@tanstack/react-query";

interface UseTasksOptions {
  status?: string | string[];
  limit?: number;
  page?: number;
  enabled?: boolean;
}

/**
 * React Query hook for fetching tasks
 * Provides automatic caching, refetching, and error handling
 */
export function useTasks(options: UseTasksOptions = {}) {
  const { status, limit = 100, page = 1, enabled = true } = options;

  return useQuery({
    queryKey: ["tasks", { status, limit, page }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) {
        if (Array.isArray(status)) {
          status.forEach((s) => params.append("status", s));
        } else {
          params.append("status", status);
        }
      }
      if (limit) {
        params.append("limit", limit.toString());
      }
      if (page > 1) {
        params.append("page", page.toString());
      }

      const response = await fetch(`/api/tasks?${params}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch tasks");
      }
      return result.data;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

