"use client";

import { useQuery } from "@tanstack/react-query";

interface UseAttendanceOptions {
  userId?: string;
  month?: number;
  year?: number;
  enabled?: boolean;
}

/**
 * React Query hook for fetching attendance data
 * Provides automatic caching, refetching, and error handling
 */
export function useAttendance(options: UseAttendanceOptions = {}) {
  const { userId, month, year, enabled = true } = options;

  return useQuery({
    queryKey: ["attendance", "latest-month", { userId, month, year }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userId) {
        params.append("userId", userId);
      }
      if (month) {
        params.append("month", month.toString());
      }
      if (year) {
        params.append("year", year.toString());
      }

      const response = await fetch(`/api/attendance/latest-month?${params}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch attendance");
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch attendance");
      }
      return result.data;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * React Query hook for fetching today's team attendance
 */
export function useTodayTeamAttendance(enabled: boolean = true) {
  return useQuery({
    queryKey: ["attendance", "today-team"],
    queryFn: async () => {
      const response = await fetch("/api/attendance/today-team", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch today team attendance");
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch today team attendance");
      }
      return result.data;
    },
    enabled,
    staleTime: 1 * 60 * 1000, // 1 minute (attendance changes frequently)
    gcTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: true, // Refetch on focus for real-time updates
  });
}

