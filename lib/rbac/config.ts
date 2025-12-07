/**
 * RBAC Configuration
 * Feature flag and configuration settings for RBAC system
 */

/**
 * Feature flag to enable/disable RBAC system
 * Set RBAC_ENABLED=true in .env to enable RBAC
 * Set RBAC_ENABLED=false to use legacy role-based checks
 * 
 * NOTE: RBAC is now the primary system. Legacy system is deprecated.
 */
export const RBAC_ENABLED = process.env.RBAC_ENABLED !== "false"; // Default to true

/**
 * Permission cache TTL in milliseconds
 * Default: 5 minutes
 */
export const PERMISSION_CACHE_TTL = parseInt(
  process.env.PERMISSION_CACHE_TTL || "300000",
  10
);

/**
 * Whether to enable audit logging
 * Default: true
 */
export const AUDIT_LOGGING_ENABLED = process.env.AUDIT_LOGGING_ENABLED !== "false";

/**
 * Log RBAC configuration on startup (development only)
 */
if (process.env.NODE_ENV === "development") {
  console.log("🔐 RBAC Configuration:", {
    RBAC_ENABLED,
    PERMISSION_CACHE_TTL: `${PERMISSION_CACHE_TTL / 1000}s`,
    AUDIT_LOGGING_ENABLED,
  });
}


