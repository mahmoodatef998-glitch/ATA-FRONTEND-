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

  // Cache key based on user ID
  const getCacheKey = (userId: number | string) => `permissions:${userId}`;
  const CACHE_TTL = 10 * 60 * 1000; // 10 minutes (increased for better performance)

  // Load from localStorage cache
  const loadFromCache = useCallback((userId: number | string) => {
    if (typeof window === 'undefined') return null;
    try {
      const cacheKey = getCacheKey(userId);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          return data;
        }
        // Cache expired
        localStorage.removeItem(cacheKey);
      }
    } catch (e) {
      // Ignore cache errors
    }
    return null;
  }, []);

  // Save to localStorage cache
  const saveToCache = useCallback((userId: number | string, data: { permissions: string[], roles: any[] }) => {
    if (typeof window === 'undefined') return;
    try {
      const cacheKey = getCacheKey(userId);
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (e) {
      // Ignore cache errors (e.g., quota exceeded)
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    if (status !== "authenticated" || !session?.user) {
      setLoading(false);
      return;
    }

    const userId = session.user.id;

    // Try cache first
    const cached = loadFromCache(userId);
    if (cached) {
      setPermissions(cached.permissions || []);
      setRoles(cached.roles || []);
      setLoading(false);
      // Fetch in background to refresh cache
      fetch("/api/auth/me")
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            setPermissions(result.data.permissions || []);
            setRoles(result.data.roles || []);
            saveToCache(userId, {
              permissions: result.data.permissions || [],
              roles: result.data.roles || [],
            });
          }
        })
        .catch(() => {
          // Silently fail background refresh
        });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/me");
      const result = await response.json();

      if (result.success) {
        const permissionsData = result.data.permissions || [];
        const rolesData = result.data.roles || [];
        setPermissions(permissionsData);
        setRoles(rolesData);
        // Cache the result
        saveToCache(userId, {
          permissions: permissionsData,
          roles: rolesData,
        });
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
  }, [session, status, toast, permissions.length, loadFromCache, saveToCache]);

  // Only fetch once when session is authenticated
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchPermissions();
    } else if (status === "unauthenticated") {
      setPermissions([]);
      setRoles([]);
      setLoading(false);
      // Clear cache on logout
      if (typeof window !== 'undefined') {
        const userId = session?.user?.id;
        if (userId) {
          localStorage.removeItem(getCacheKey(userId));
        }
      }
    }
  }, [status, session?.user?.id]); // Only depend on status and user ID, not the whole session

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


