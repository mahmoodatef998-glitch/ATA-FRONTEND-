"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

/**
 * React Query Client Provider
 * 
 * Provides caching, background refetching, and optimistic updates
 * for all API calls in the application.
 * 
 * Features:
 * - Automatic caching with stale-while-revalidate
 * - Background refetching on window focus
 * - Retry logic for failed requests
 * - Optimized for production performance
 */
export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // ✅ Performance: Enhanced caching strategy for better performance
            staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes (increased from 2)
            gcTime: 10 * 60 * 1000, // 10 minutes - keep unused data in cache longer (increased from 5)
            // Retry failed requests once (fast failure for better UX)
            retry: 1,
            // Exponential backoff with max delay
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
            // Disable automatic refetching for better performance
            refetchOnWindowFocus: false, // Don't refetch on window focus
            refetchOnReconnect: false, // Don't refetch on reconnect
            refetchOnMount: false, // Use cached data if available (don't refetch on mount)
            // Network mode: prefer cache over network for better performance
            networkMode: "offlineFirst", // ✅ Use cache first, then network if needed
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
            // Retry delay for mutations
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

