import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Utility hook for optimized page refresh
 * Instead of window.location.reload(), this invalidates React Query cache
 * and refreshes the router, which is much faster
 */
export function useOptimizedRefresh() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const refresh = (invalidatePattern?: string) => {
    // Invalidate React Query cache if pattern provided
    if (invalidatePattern) {
      queryClient.invalidateQueries({ queryKey: [invalidatePattern] });
    } else {
      // Invalidate all queries
      queryClient.invalidateQueries();
    }

    // Refresh router (faster than window.location.reload())
    router.refresh();
  };

  return { refresh };
}

