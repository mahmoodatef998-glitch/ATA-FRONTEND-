/**
 * Permissions Context
 * Provides user permissions throughout the application
 */

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";

interface PermissionData {
  permissions: string[];
  roles: { name: string; id: number; isDefault: boolean }[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionData | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<{ name: string; id: number; isDefault: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    if (status !== "authenticated" || !session?.user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/me");
      const result = await response.json();

      if (result.success) {
        setPermissions(result.data.permissions || []);
        setRoles(result.data.roles || []);
      } else {
        throw new Error(result.error || "Failed to fetch permissions");
      }
    } catch (err: any) {
      console.error("Error fetching permissions:", err);
      setError(err.message || "Failed to load permissions");
      // Don't show toast on initial load to avoid spam
      if (permissions.length > 0) {
        toast({
          title: "Error",
          description: "Failed to refresh permissions",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [session, status, toast, permissions.length]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Refresh permissions when session changes
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchPermissions();
    } else if (status === "unauthenticated") {
      setPermissions([]);
      setRoles([]);
      setLoading(false);
    }
  }, [status, session, fetchPermissions]);

  const refresh = useCallback(async () => {
    await fetchPermissions();
  }, [fetchPermissions]);

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        roles,
        loading,
        error,
        refresh,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
}


