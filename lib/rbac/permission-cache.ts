/**
 * Permission Cache
 * Caches user permissions for 5 minutes to reduce database queries
 */

import { UserRole } from "@prisma/client";

interface CachedPermissions {
  permissions: string[];
  roles: string[];
  expiresAt: number;
}

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds (increased for better performance)
const cache = new Map<string, CachedPermissions>();

/**
 * Get cache key for user
 */
function getCacheKey(userId: number, companyId: number): string {
  return `permissions:${userId}:${companyId}`;
}

/**
 * Get cached permissions for user
 */
export function getCachedPermissions(
  userId: number,
  companyId: number
): string[] | null {
  const key = getCacheKey(userId, companyId);
  const cached = cache.get(key);

  if (!cached) {
    return null;
  }

  // Check if cache expired
  if (Date.now() > cached.expiresAt) {
    cache.delete(key);
    return null;
  }

  return cached.permissions;
}

/**
 * Set cached permissions for user
 */
export function setCachedPermissions(
  userId: number,
  companyId: number,
  permissions: string[],
  roles: string[] = []
): void {
  const key = getCacheKey(userId, companyId);
  cache.set(key, {
    permissions,
    roles,
    expiresAt: Date.now() + CACHE_TTL,
  });
}

/**
 * Invalidate cache for user
 */
export function invalidateUserCache(userId: number, companyId: number): void {
  const key = getCacheKey(userId, companyId);
  cache.delete(key);
}

/**
 * Invalidate cache for all users in a company (when role permissions change)
 */
export function invalidateCompanyCache(companyId: number): void {
  const keysToDelete: string[] = [];
  for (const key of cache.keys()) {
    if (key.includes(`:${companyId}`)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => cache.delete(key));
}

/**
 * Invalidate cache for a specific role (when role permissions change)
 */
export function invalidateRoleCache(roleId: number): void {
  // Clear all caches - role changes affect all users
  cache.clear();
}

/**
 * Clear all caches
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  keys: string[];
} {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}


