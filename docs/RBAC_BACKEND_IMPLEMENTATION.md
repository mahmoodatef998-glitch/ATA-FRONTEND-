# RBAC Backend Implementation Guide

## Overview

This document describes the complete backend RBAC (Role-Based Access Control) implementation for the ATA CRM project.

## Database Schema

### Tables

#### 1. `roles`
Stores role definitions (admin, operation_manager, accountant, hr, supervisor, technician).

```prisma
model roles {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  displayName String
  description String?
  isSystem    Boolean   @default(false)
  companyId   Int?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

#### 2. `permissions`
Stores all available permissions using dot notation.

```prisma
model permissions {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  displayName String
  description String?
  category    String
  resource    String
  action      String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

#### 3. `role_permissions`
Many-to-many relationship between roles and permissions.

```prisma
model role_permissions {
  id           Int        @id @default(autoincrement())
  roleId       Int
  permissionId Int
  createdAt    DateTime   @default(now())
}
```

#### 4. `user_roles`
Many-to-many relationship between users and roles (for additional roles beyond default).

```prisma
model user_roles {
  id         Int       @id @default(autoincrement())
  userId     Int
  roleId     Int
  assignedBy Int?
  assignedAt DateTime  @default(now())
  expiresAt  DateTime?
  isActive   Boolean   @default(true)
}
```

## Setup

### 1. Run Migration

```bash
# Create migration
npx prisma migrate dev --name add_rbac_tables

# Or apply existing migration
npx prisma migrate deploy
```

### 2. Seed Data

```bash
# Seed roles and permissions
npx tsx prisma/seed-rbac.ts
```

## Core Services

### Permission Service (`lib/rbac/permission-service.ts`)

Main service for fetching and managing user permissions.

**Key Functions:**
- `getUserPermissions(userId, companyId)` - Get all permissions for a user
- `userHasPermission(userId, companyId, permission)` - Check single permission
- `userHasAnyPermission(userId, companyId, permissions)` - Check any permission
- `userHasAllPermissions(userId, companyId, permissions)` - Check all permissions
- `getUserRoles(userId)` - Get all roles for a user
- `assignRoleToUser(userId, roleId, assignedBy, expiresAt?)` - Assign role
- `removeRoleFromUser(userId, roleId)` - Remove role

### Permission Cache (`lib/rbac/permission-cache.ts`)

Caches user permissions for 5 minutes to reduce database queries.

**Key Functions:**
- `getCachedPermissions(userId, companyId)` - Get cached permissions
- `setCachedPermissions(userId, companyId, permissions, roles)` - Cache permissions
- `invalidateUserCache(userId, companyId)` - Invalidate user cache
- `invalidateCompanyCache(companyId)` - Invalidate all company users
- `invalidateRoleCache(roleId)` - Invalidate when role permissions change

### Authorization (`lib/rbac/authorize.ts`)

Middleware functions for protecting API endpoints.

**Key Functions:**
- `authorize(permission)` - Require single permission
- `authorizeAny(permissions)` - Require any of the permissions
- `authorizeAll(permissions)` - Require all permissions
- `authorizeContextual(permission, context)` - Contextual authorization with rules

**Example:**
```typescript
export async function DELETE(request: NextRequest) {
  const { userId, companyId } = await authorize(PermissionAction.USER_DELETE);
  // Your code here
}
```

### Policy Enforcement (`lib/rbac/policy-enforcement.ts`)

Resource-level checks (ownership, team membership, etc.).

**Key Functions:**
- `checkResourceOwnership(userId, resourceType, resourceId)` - Check if user owns resource
- `checkCompanyAccess(userId, companyId, resourceType, resourceId)` - Check company access
- `canAccessResource(userId, companyId, permission, resourceType, resourceId, options)` - Combined check
- `enforceResourceAccess(userId, companyId, permission, resourceType, resourceId)` - Enforce with fallback
- `checkTeamMembership(userId, targetUserId)` - Check if users are in same team

**Example:**
```typescript
// Check if user can access a task
await enforceResourceAccess(
  userId,
  companyId,
  PermissionAction.TASK_READ,
  "task",
  taskId
);
```

## API Endpoints

### Roles Management

#### GET `/api/rbac/roles`
Get all roles with their permissions.

**Query Parameters:**
- `includeSystem` (boolean) - Include system roles
- `companyOnly` (boolean) - Filter by company

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "admin",
      "displayName": "Admin",
      "permissions": [...],
      "userCount": 5
    }
  ]
}
```

#### POST `/api/rbac/roles`
Create a new role.

**Body:**
```json
{
  "name": "custom_role",
  "displayName": "Custom Role",
  "description": "Custom role description",
  "permissionIds": [1, 2, 3]
}
```

#### PATCH `/api/rbac/roles/[id]`
Update a role.

**Body:**
```json
{
  "displayName": "Updated Name",
  "permissionIds": [1, 2, 3, 4]
}
```

#### DELETE `/api/rbac/roles/[id]`
Delete a role (cannot delete system roles or roles assigned to users).

### Permissions Management

#### GET `/api/rbac/permissions`
Get all permissions.

**Query Parameters:**
- `category` (string) - Filter by category
- `resource` (string) - Filter by resource

#### POST `/api/rbac/permissions`
Create a new permission.

**Body:**
```json
{
  "name": "custom.permission",
  "displayName": "Custom Permission",
  "category": "Custom",
  "resource": "custom",
  "action": "permission"
}
```

### User Roles Assignment

#### GET `/api/rbac/users/[userId]/roles`
Get all roles assigned to a user.

#### POST `/api/rbac/users/[userId]/roles`
Assign a role to a user.

**Body:**
```json
{
  "roleId": 1,
  "expiresAt": "2024-12-31T23:59:59Z" // Optional
}
```

#### DELETE `/api/rbac/users/[userId]/roles?roleId=1`
Remove a role from a user.

### Audit Logs

#### GET `/api/rbac/audit-logs`
Get audit logs (requires `audit.read` permission).

**Query Parameters:**
- `userId` (number) - Filter by user
- `action` (string) - Filter by action
- `resource` (string) - Filter by resource
- `resourceId` (number) - Filter by resource ID
- `startDate` (ISO date) - Start date filter
- `endDate` (ISO date) - End date filter
- `limit` (number) - Results limit (default: 50)
- `offset` (number) - Results offset (default: 0)

## Integration with Auth

The system automatically adds permissions to the user session after login:

```typescript
// In lib/auth.ts session callback
const [permissions, roles] = await Promise.all([
  getUserPermissions(userId, companyId),
  getUserRoles(userId),
]);
session.user.permissions = permissions;
session.user.roles = roles.map(r => r.name);
```

## Caching Strategy

1. **Permission Cache**: 5 minutes TTL
2. **Cache Invalidation**:
   - User cache invalidated when roles are assigned/removed
   - Company cache invalidated when company roles change
   - Role cache invalidated when role permissions change

## Audit Logging

The following actions are automatically logged:

1. **Role Management**:
   - Role creation
   - Role permission updates
   - Role deletion

2. **User Management**:
   - User creation
   - User role assignment/removal
   - User deletion

3. **Attendance**:
   - Attendance updates
   - Attendance deletions

4. **Invoices**:
   - Invoice deletions

### Adding Audit Logging

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
  details: { /* additional details */ },
  ...auditContext,
});
```

## Contextual Authorization

Example: Supervisor can assign tasks only to technicians.

```typescript
await authorizeContextual(PermissionAction.TASK_ASSIGN, {
  targetUserId: 2,
  targetUserRole: "TECHNICIAN",
});
```

## Testing

### Unit Tests

```bash
npm test __tests__/rbac/
```

### Test Files

- `__tests__/rbac/authorize.test.ts` - Authorization tests
- `__tests__/rbac/policy-enforcement.test.ts` - Policy enforcement tests
- `__tests__/rbac/permissions.test.ts` - Permission checks tests
- `__tests__/rbac/audit-logger.test.ts` - Audit logging tests

## Migration Guide

### From Hardcoded Permissions to Database

1. Run migration: `npx prisma migrate dev --name add_rbac_tables`
2. Seed data: `npx tsx prisma/seed-rbac.ts`
3. Update API routes to use `authorize()` instead of `requirePermission()`
4. Test all endpoints

### Backward Compatibility

The system maintains backward compatibility:
- Default role (from `users.role`) still works
- Hardcoded permissions in `ROLE_PERMISSIONS` are still used
- Additional roles from `user_roles` table are added on top

## Best Practices

1. **Always use `authorize()` in API routes** instead of manual permission checks
2. **Use contextual authorization** for complex rules (e.g., supervisor → technician)
3. **Invalidate cache** when roles/permissions change
4. **Log all critical actions** using audit logging
5. **Test permission checks** thoroughly

## Troubleshooting

### Cache Issues
- Clear cache: `clearCache()` from `permission-cache.ts`
- Check cache stats: `getCacheStats()`

### Permission Not Working
1. Check if role has permission in database
2. Check cache (might be stale)
3. Verify user has active role assignment
4. Check company access

### Migration Issues
- Run `npx prisma generate` after schema changes
- Check migration files in `prisma/migrations/`
- Verify seed script ran successfully

## Support

For issues or questions:
- Review `docs/RBAC_SYSTEM.md` for general RBAC documentation
- Check `docs/ROLE_PERMISSIONS.md` for role-specific permissions
- See `lib/rbac/README.md` for module overview


