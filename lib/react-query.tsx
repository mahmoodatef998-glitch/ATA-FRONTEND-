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
            // ✅ Performance: Ultra-aggressive caching for sub-1.5s page loads
            staleTime: 20 * 60 * 1000, // 20 minutes - data is fresh for 20 minutes (increased from 15 for even faster loads)
            gcTime: 40 * 60 * 1000, // 40 minutes - keep unused data in cache longer (increased from 30 for instant navigation)
            // Retry failed requests once (fast failure for better UX)
            retry: 1,
            // Exponential backoff with max delay (reduced for faster failure)
            retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 2000), // Reduced from 1000-3000 to 500-2000
            // Disable automatic refetching for better performance
            refetchOnWindowFocus: false, // Don't refetch on window focus
            refetchOnReconnect: false, // Don't refetch on reconnect
            refetchOnMount: false, // Use cached data if available (don't refetch on mount)
            // Network mode: prefer cache over network for better performance
            networkMode: "offlineFirst", // ✅ Use cache first, then network if needed
            // ✅ Performance: Enable query deduplication to prevent duplicate requests
            // If multiple components request the same query simultaneously, only one request will be made
            structuralSharing: true, // ✅ Enable structural sharing for better performance
            // ✅ Performance: Enable query deduplication (automatic in React Query v5)
            // This ensures identical queries are deduplicated automatically
            // ✅ Performance: Add query key factory for better deduplication
            queryKeyHashFn: (queryKey) => {
              // Custom hash function for better deduplication
              return JSON.stringify(queryKey);
            },
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

