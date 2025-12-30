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
            // ✅ Performance: Reduce staleTime to 1 minute for faster updates
            staleTime: 1 * 60 * 1000, // 1 minute (reduced from 2 minutes)
            // Keep unused data in cache for 3 minutes (reduced from 5)
            gcTime: 3 * 60 * 1000, // 3 minutes (formerly cacheTime)
            // Retry failed requests up to 1 time (reduced from 2 for faster failures)
            retry: 1,
            // Retry delay increases exponentially (faster retry)
            retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 10000),
            // Refetch on window focus (only if data is stale)
            refetchOnWindowFocus: false, // Disabled for better performance
            // Don't refetch on reconnect (to save bandwidth)
            refetchOnReconnect: false,
            // Refetch on mount if data is stale
            refetchOnMount: false, // Disabled - use cached data if available
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

