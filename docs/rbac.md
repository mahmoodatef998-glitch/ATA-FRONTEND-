# Role-Based Access Control (RBAC) System Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Architecture Diagram](#system-architecture-diagram)
3. [Permission Check Flow](#permission-check-flow)
4. [How to Add Custom Permissions](#how-to-add-custom-permissions)
5. [Rollback Plan](#rollback-plan)
6. [Troubleshooting](#troubleshooting)
7. [Feature Flag](#feature-flag)

---

## Architecture Overview

The RBAC system is a modular, database-driven permission management system that provides granular access control across the entire application. It supports:

- **Multiple roles per user**: Users can have a default role plus additional assigned roles
- **Granular permissions**: Dot-notation permissions (e.g., `user.create`, `task.assign`)
- **Contextual authorization**: Resource-level checks (e.g., supervisor can assign only to technicians)
- **Caching**: Server-side permission caching (5 minutes TTL)
- **Audit logging**: All critical actions are logged
- **Backward compatibility**: Legacy role-based checks still work

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   React      │  │  Permission   │  │   Permission  │        │
│  │  Components  │→ │    Guard      │→ │    Button    │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│         │                  │                  │                 │
│         └──────────────────┴──────────────────┘                │
│                            │                                     │
│                    ┌───────▼────────┐                           │
│                    │ Permissions    │                           │
│                    │ Context        │                           │
│                    └───────┬────────┘                           │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             │ HTTP Request
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      API Layer (Next.js)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   API        │→ │  authorize()  │→ │  Permission  │        │
│  │  Routes      │  │  Middleware   │  │   Service    │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│         │                  │                  │                 │
│         └──────────────────┴──────────────────┘                │
│                            │                                     │
│                    ┌───────▼────────┐                           │
│                    │ Permission    │                           │
│                    │ Cache         │                           │
│                    └───────┬────────┘                           │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             │ Database Query
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    Database Layer (PostgreSQL)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  users   │  │   roles      │  │ permissions  │             │
│  └────┬─────┘  └──────┬───────┘  └──────┬───────┘             │
│       │                │                 │                      │
│       │                │                 │                      │
│  ┌────▼───────────────▼─────────────────▼──────┐            │
│  │         user_roles (Many-to-Many)             │            │
│  └───────────────────────────────────────────────┘            │
│                                                                   │
│  ┌─────────────────────────────────────────────────┐            │
│  │    role_permissions (Many-to-Many)              │            │
│  └─────────────────────────────────────────────────┘            │
│                                                                   │
│  ┌─────────────────────────────────────────────────┐            │
│  │         audit_logs (Action History)            │            │
│  └─────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Frontend Layer**
   - `PermissionsContext`: React context providing permissions to components
   - `PermissionGuard`: Component that conditionally renders based on permissions
   - `PermissionButton`: Button component with permission checks and tooltips
   - `useCan()`: Hook for checking permissions

2. **API Layer**
   - `authorize()`: Middleware for protecting endpoints
   - `authorizeAny()`: Check if user has any of the specified permissions
   - `authorizeAll()`: Check if user has all of the specified permissions
   - `authorizeContextual()`: Contextual authorization with resource-level checks

3. **Service Layer**
   - `getUserPermissions()`: Fetch user permissions from database
   - `userHasPermission()`: Check if user has a specific permission
   - `PermissionCache`: Server-side caching (5 minutes TTL)

4. **Database Layer**
   - `roles`: Role definitions
   - `permissions`: Permission definitions
   - `role_permissions`: Role-permission mappings
   - `user_roles`: User-role assignments
   - `audit_logs`: Action history

---

## Permission Check Flow

### Frontend Permission Check

```
┌─────────────────┐
│  User Action    │
│  (Button Click) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  useCan() Hook  │
│  Checks Context │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│ Permission      │─────▶│  /api/auth/me│
│ Context         │      │  (if needed) │
└────────┬────────┘      └──────────────┘
         │
         ▼
┌─────────────────┐
│  Permission     │
│  Found?         │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
   Yes       No
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│ Render │ │ Hide/    │
│ Button │ │ Disable  │
└────────┘ └──────────┘
```

### Backend Permission Check

```
┌─────────────────┐
│  API Request    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  requireAuth()  │
│  (Session Check)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  authorize()    │
│  Middleware     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Check Cache    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
  Hit      Miss
    │         │
    ▼         ▼
┌────────┐ ┌─────────────────┐
│ Return │ │ Query Database  │
│ Cached │ │ (roles +         │
│ Perms  │ │  permissions)    │
└────────┘ └────────┬─────────┘
                    │
                    ▼
            ┌───────────────┐
            │  Cache Result │
            │  (5 min TTL)  │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │  Check        │
            │  Permission  │
            └───────┬───────┘
                    │
            ┌───────┴───────┐
            │               │
          Allowed      Forbidden
            │               │
            ▼               ▼
    ┌───────────┐   ┌───────────┐
    │  Process  │   │  403      │
    │  Request  │   │  Error    │
    └───────────┘   └───────────┘
```

### Sequence Diagram

```
User          Frontend          API Route        Permission Service    Database
 │                │                 │                    │              │
 │  Click Button  │                 │                    │              │
 ├───────────────▶│                 │                    │              │
 │                │  useCan()       │                    │              │
 │                ├────────────────▶│                    │              │
 │                │                 │  authorize()       │              │
 │                │                 ├───────────────────▶│              │
 │                │                 │                    │  Check Cache │
 │                │                 │                    ├─────────────▶│
 │                │                 │                    │  Cache Miss  │
 │                │                 │                    │◀─────────────┤
 │                │                 │                    │  Query DB    │
 │                │                 │                    ├─────────────▶│
 │                │                 │                    │  Permissions │
 │                │                 │                    │◀─────────────┤
 │                │                 │  Allowed           │              │
 │                │                 │◀───────────────────┤              │
 │                │  Render Button  │                    │              │
 │                │◀────────────────│                    │              │
 │  See Button    │                 │                    │              │
 │◀───────────────┤                 │                    │              │
```

---

## How to Add Custom Permissions

### Step 1: Define Permission in `lib/permissions/role-permissions.ts`

```typescript
export enum PermissionAction {
  // ... existing permissions ...
  
  // New permission
  CUSTOM_ACTION = "custom.action",
}
```

### Step 2: Add Permission to Role

```typescript
export const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  [UserRole.ADMIN]: [
    // ... existing permissions ...
    PermissionAction.CUSTOM_ACTION, // Add here
  ],
  // ... other roles ...
};
```

### Step 3: Create Database Permission (via Seed Script)

Update `prisma/seed-rbac.ts`:

```typescript
const permissions = [
  // ... existing permissions ...
  {
    name: "custom.action",
    displayName: "Custom Action",
    description: "Perform custom action",
    category: "Custom",
    resource: "custom",
    action: "action",
  },
];
```

### Step 4: Protect API Endpoint

```typescript
// app/api/custom/route.ts
import { authorize } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";

export async function POST(request: NextRequest) {
  const { userId, companyId } = await authorize(PermissionAction.CUSTOM_ACTION);
  
  // Your logic here
}
```

### Step 5: Use in Frontend

```typescript
// Component
import { useCan } from "@/lib/permissions/frontend-helpers";
import { PermissionAction } from "@/lib/permissions/role-permissions";

function MyComponent() {
  const canPerformAction = useCan(PermissionAction.CUSTOM_ACTION);
  
  return (
    <PermissionButton
      permission={PermissionAction.CUSTOM_ACTION}
      onClick={handleAction}
    >
      Perform Action
    </PermissionButton>
  );
}
```

### Step 6: Run Migration & Seed

```bash
# After updating seed script
npm run prisma:seed:rbac
```

---

## Rollback Plan

### Option 1: Feature Flag (Recommended)

Set `RBAC_ENABLED=false` in `.env`:

```env
RBAC_ENABLED=false
```

This will:
- Disable RBAC checks in backend
- Fall back to legacy role-based checks
- Hide RBAC UI components

### Option 2: Database Rollback

If you need to remove RBAC tables:

```sql
-- WARNING: This will delete all RBAC data!
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
```

Then revert Prisma schema:

```bash
# Revert to previous migration
npx prisma migrate resolve --rolled-back add_rbac_tables
```

### Option 3: Code Rollback

1. Remove RBAC imports from API routes
2. Restore legacy `requireRole()` checks
3. Remove `PermissionsProvider` from `components/providers.tsx`
4. Remove RBAC UI components

### Rollback Checklist

- [ ] Set `RBAC_ENABLED=false`
- [ ] Restart application
- [ ] Verify legacy role checks work
- [ ] Test critical user flows
- [ ] Monitor error logs

---

## Troubleshooting

### Issue: "Insufficient permissions" error

**Symptoms:**
- User gets 403 Forbidden errors
- Buttons are disabled unexpectedly

**Solutions:**

1. **Check user roles:**
   ```typescript
   // In API route
   const session = await requireAuth();
   console.log("User role:", session.user.role);
   ```

2. **Check permissions:**
   ```typescript
   const permissions = await getUserPermissions(userId, companyId);
   console.log("User permissions:", permissions);
   ```

3. **Clear cache:**
   ```typescript
   import { invalidateUserCache } from "@/lib/rbac/permission-cache";
   invalidateUserCache(userId, companyId);
   ```

4. **Verify database:**
   ```sql
   SELECT u.id, u.role, r.name as assigned_role
   FROM users u
   LEFT JOIN user_roles ur ON u.id = ur.userId
   LEFT JOIN roles r ON ur.roleId = r.id
   WHERE u.id = <userId>;
   ```

### Issue: Permissions not updating after role change

**Symptoms:**
- User permissions don't reflect recent changes
- Cache shows old permissions

**Solutions:**

1. **Invalidate cache:**
   ```typescript
   import { invalidateUserCache } from "@/lib/rbac/permission-cache";
   invalidateUserCache(userId, companyId);
   ```

2. **Wait for TTL:**
   - Cache expires after 5 minutes
   - Or restart server to clear all cache

3. **Force refresh frontend:**
   ```typescript
   const { refresh } = usePermissions();
   await refresh();
   ```

### Issue: "Can't reach database server" during migration

**Symptoms:**
- Prisma migrate fails
- Database connection errors

**Solutions:**

1. **Check PostgreSQL is running:**
   ```bash
   # Windows
   Get-Service -Name "*postgresql*"
   
   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. **Verify DATABASE_URL in `.env`:**
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/ata_crm"
   ```

3. **Apply migration manually:**
   - See `APPLY_RBAC_MANUAL.md` for SQL script

### Issue: Frontend shows "Loading permissions..." indefinitely

**Symptoms:**
- Permissions context stuck in loading state
- UI doesn't render

**Solutions:**

1. **Check `/api/auth/me` endpoint:**
   ```bash
   curl http://localhost:3005/api/auth/me
   ```

2. **Check browser console for errors**

3. **Verify session:**
   ```typescript
   const { data: session } = useSession();
   console.log("Session:", session);
   ```

4. **Check network tab:**
   - Verify `/api/auth/me` returns 200
   - Check response format

### Issue: Audit logs not recording

**Symptoms:**
- Actions not appearing in audit log
- `/api/rbac/audit-logs` returns empty

**Solutions:**

1. **Verify audit logging is enabled:**
   ```typescript
   import { createAuditLog } from "@/lib/rbac/audit-logger";
   await createAuditLog({
     userId,
     companyId,
     action: "USER_ROLE_CHANGED",
     resourceType: "user",
     resourceId: userId,
     details: { ... },
   });
   ```

2. **Check database:**
   ```sql
   SELECT * FROM audit_logs ORDER BY createdAt DESC LIMIT 10;
   ```

3. **Verify permissions:**
   - User needs `audit.read` permission to view logs

### Issue: Feature flag not working

**Symptoms:**
- `RBAC_ENABLED=false` but RBAC still active
- Legacy checks not working

**Solutions:**

1. **Verify `.env` file:**
   ```bash
   cat .env | grep RBAC_ENABLED
   ```

2. **Restart server:**
   - Environment variables load on startup
   - Changes require restart

3. **Check code:**
   ```typescript
   const RBAC_ENABLED = process.env.RBAC_ENABLED === "true";
   console.log("RBAC Enabled:", RBAC_ENABLED);
   ```

---

## Feature Flag

### Configuration

Add to `.env`:

```env
RBAC_ENABLED=true
```

### Usage in Code

```typescript
// lib/rbac/config.ts
export const RBAC_ENABLED = process.env.RBAC_ENABLED === "true";

// In API route
import { RBAC_ENABLED } from "@/lib/rbac/config";

if (RBAC_ENABLED) {
  await authorize(PermissionAction.USER_CREATE);
} else {
  // Legacy role check
  await requireRole([UserRole.ADMIN]);
}
```

### Gradual Rollout

1. **Phase 1: Testing (RBAC_ENABLED=false)**
   - Legacy system active
   - RBAC code deployed but disabled

2. **Phase 2: Internal Testing (RBAC_ENABLED=true for admins)**
   - Enable for admin users only
   - Monitor logs and errors

3. **Phase 3: Gradual Rollout (RBAC_ENABLED=true)**
   - Enable for all users
   - Monitor performance and errors

4. **Phase 4: Full Deployment**
   - Remove legacy code
   - RBAC only

---

## Additional Resources

- **Permissions Matrix**: See `permissions-matrix.csv`
- **API Documentation**: See `docs/API.md`
- **Setup Instructions**: See `RBAC_SETUP_INSTRUCTIONS.md`
- **Backend Implementation**: See `docs/RBAC_BACKEND_IMPLEMENTATION.md`
- **Frontend Implementation**: See `docs/RBAC_FRONTEND_IMPLEMENTATION.md`

---

## Support

For issues or questions:
1. Check this documentation
2. Review troubleshooting section
3. Check audit logs for errors
4. Review application logs


