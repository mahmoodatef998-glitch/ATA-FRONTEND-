"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { NotificationsList } from "@/components/dashboard/notifications-list";
import { Loader2 } from "lucide-react";

/**
 * ✅ Performance: Client Component for Notifications
 * 
 * Prevents Server Component re-execution on navigation
 * Uses React Query for caching and deduplication
 */
export function NotificationsClient() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  // ✅ Performance: Use React Query for automatic caching and deduplication
  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications", {
        credentials: "include",
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push("/login");
          throw new Error("UNAUTHORIZED");
        }
        throw new Error("Failed to fetch notifications");
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch notifications");
      }
      return result.data;
    },
    enabled: sessionStatus === "authenticated",
    staleTime: 1 * 60 * 1000, // 1 minute (notifications change frequently)
    gcTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: true, // Refetch on focus for notifications
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [sessionStatus, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Error loading notifications</h3>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <NotificationsList 
      initialNotifications={data?.notifications || []} 
      pagination={data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 }}
    />
  );
}

