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
            // Cache data for 2 minutes
            staleTime: 2 * 60 * 1000, // 2 minutes
            // Keep unused data in cache for 5 minutes
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            // Retry failed requests up to 2 times
            retry: 2,
            // Retry delay increases exponentially
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Refetch on window focus (only if data is stale)
            refetchOnWindowFocus: true,
            // Don't refetch on reconnect (to save bandwidth)
            refetchOnReconnect: false,
            // Refetch on mount if data is stale
            refetchOnMount: true,
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

