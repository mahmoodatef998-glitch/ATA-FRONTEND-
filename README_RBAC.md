# RBAC Backend Module - Quick Start Guide

## Overview

Complete backend RBAC (Role-Based Access Control) implementation with database-driven permissions, caching, and audit logging.

## Features

✅ **Database-Driven Permissions**: Roles and permissions stored in database
✅ **Permission Caching**: 5-minute cache to reduce database queries
✅ **Authorization Middleware**: `authorize()` function for protecting endpoints
✅ **Contextual Authorization**: Rules like "supervisor can assign only to technicians"
✅ **Policy Enforcement**: Resource-level checks (ownership, team membership)
✅ **Audit Logging**: Automatic logging of critical actions
✅ **Admin APIs**: Full CRUD for roles, permissions, and user role assignments
✅ **Backward Compatible**: Works with existing hardcoded permissions

## Quick Start

### 1. Run Migration

```bash
npx prisma migrate dev --name add_rbac_tables
npx prisma generate
```

### 2. Seed Data

```bash
npx tsx prisma/seed-rbac.ts
```

This will create:
- All permissions (user.create, task.assign, etc.)
- System roles (admin, operation_manager, accountant, hr, supervisor, technician)
- Role-permission mappings

### 3. Use in API Routes

**Before:**
```typescript
const session = await requireRole([UserRole.ADMIN]);
```

**After:**
```typescript
import { authorize } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";

const { userId, companyId, permissions } = await authorize(PermissionAction.USER_DELETE);
```

## API Endpoints

### Roles
- `GET /api/rbac/roles` - List all roles
- `POST /api/rbac/roles` - Create role
- `GET /api/rbac/roles/[id]` - Get role details
- `PATCH /api/rbac/roles/[id]` - Update role
- `DELETE /api/rbac/roles/[id]` - Delete role

### Permissions
- `GET /api/rbac/permissions` - List all permissions
- `POST /api/rbac/permissions` - Create permission

### User Roles
- `GET /api/rbac/users/[userId]/roles` - Get user roles
- `POST /api/rbac/users/[userId]/roles` - Assign role to user
- `DELETE /api/rbac/users/[userId]/roles?roleId=1` - Remove role from user

### Audit Logs
- `GET /api/rbac/audit-logs` - Get audit logs (requires `audit.read`)

## Usage Examples

### Basic Authorization

```typescript
import { authorize } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";

export async function DELETE(request: NextRequest) {
  const { userId, companyId } = await authorize(PermissionAction.USER_DELETE);
  // Your code here
}
```

### Contextual Authorization

```typescript
import { authorizeContextual } from "@/lib/rbac/authorize";

// Supervisor can assign tasks only to technicians
const { userId, companyId } = await authorizeContextual(
  PermissionAction.TASK_ASSIGN,
  {
    targetUserId: 2,
    targetUserRole: "TECHNICIAN",
  }
);
```

### Resource-Level Checks

```typescript
import { enforceResourceAccess } from "@/lib/rbac/policy-enforcement";

// Check if user can access this specific task
await enforceResourceAccess(
  userId,
  companyId,
  PermissionAction.TASK_READ,
  "task",
  taskId
);
```

### Audit Logging

```typescript
import { createAuditLog, AuditAction, AuditResource, getAuditContext } from "@/lib/rbac/audit-logger";

const auditContext = getAuditContext(request);
await createAuditLog({
  companyId: session.user.companyId,
  userId: session.user.id,
  userName: session.user.name,
  userRole: session.user.role,
  action: AuditAction.USER_DELETED,
  resource: AuditResource.USER,
  resourceId: userId,
  details: { /* additional info */ },
  ...auditContext,
});
```

## Caching

Permissions are cached for 5 minutes. Cache is automatically invalidated when:
- User roles are assigned/removed
- Role permissions are updated
- Company roles change

## Database Schema

### Tables Created

1. **roles** - Role definitions
2. **permissions** - All available permissions
3. **role_permissions** - Many-to-many: roles ↔ permissions
4. **user_roles** - Many-to-many: users ↔ roles (additional roles)

### Migration Files

- `prisma/migrations/add_rbac_tables/migration.sql` - Up migration
- `prisma/migrations/add_rbac_tables/down.sql` - Down migration

## Testing

```bash
npm test __tests__/rbac/
```

Test files:
- `__tests__/rbac/authorize.test.ts`
- `__tests__/rbac/policy-enforcement.test.ts`
- `__tests__/rbac/permissions.test.ts`
- `__tests__/rbac/audit-logger.test.ts`

## Documentation

- `docs/RBAC_BACKEND_IMPLEMENTATION.md` - Complete implementation guide
- `docs/RBAC_SYSTEM.md` - General RBAC documentation
- `docs/ROLE_PERMISSIONS.md` - Role permissions reference
- `docs/PERMISSIONS_MIGRATION.md` - Migration guide

## Support

For issues or questions, refer to the documentation files or check the source code in `lib/rbac/`.


