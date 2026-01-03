"use client";

import { useQuery } from "@tanstack/react-query";

interface UseUsersOptions {
  role?: string;
  enabled?: boolean;
}

/**
 * React Query hook for fetching users data
 * Provides automatic caching, refetching, and error handling
 */
export function useUsers(options: UseUsersOptions = {}) {
  const { role, enabled = true } = options;

  return useQuery({
    queryKey: ["users", { role }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (role) {
        params.append("role", role);
      }

      const response = await fetch(`/api/users?${params}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch users");
      }
      return result.data;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

