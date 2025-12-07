# RBAC Frontend Implementation Guide

## Overview

This document describes the complete frontend RBAC (Role-Based Access Control) implementation for the ATA CRM project.

## Architecture

### Components

1. **Permissions Context** (`contexts/permissions-context.tsx`)
   - Provides permissions throughout the app
   - Auto-fetches permissions after login
   - Caches permissions in React state

2. **Helper Functions** (`lib/permissions/frontend-helpers.ts`)
   - `useCan()` - Check single permission
   - `useCanAny()` - Check any permission
   - `useCanAll()` - Check all permissions
   - `useUserPermissions()` - Get all permissions
   - `useUserRoles()` - Get all roles

3. **UI Components** (`components/permissions/`)
   - `PermissionGuard` - Conditionally render based on permissions
   - `PermissionButton` - Button with permission check and tooltip

4. **API Client** (`lib/api-client.ts`)
   - Enhanced fetch with automatic error handling
   - Toast notifications for permission denials

5. **Admin UI Pages**
   - `/dashboard/rbac/roles` - Roles management (CRUD)
   - `/dashboard/rbac/users/[userId]` - User role assignment
   - `/dashboard/rbac/audit` - Audit logs viewer

## Setup

### 1. Permissions Provider

The `PermissionsProvider` is already added to `components/providers.tsx`:

```tsx
<PermissionsProvider>
  {children}
</PermissionsProvider>
```

### 2. API Endpoint

The `/api/auth/me` endpoint returns user permissions:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "ADMIN",
    "companyId": 1,
    "permissions": ["user.create", "user.read", ...],
    "roles": [
      { "name": "admin", "id": 1, "isDefault": true }
    ]
  }
}
```

## Usage

### Basic Permission Check

```tsx
import { useCan } from "@/lib/permissions/frontend-helpers";
import { PermissionAction } from "@/lib/permissions/role-permissions";

function MyComponent() {
  const canDelete = useCan(PermissionAction.USER_DELETE);
  
  return (
    <>
      {canDelete && <Button onClick={handleDelete}>Delete</Button>}
    </>
  );
}
```

### Permission Guard

```tsx
import { PermissionGuard } from "@/components/permissions/permission-guard";
import { PermissionAction } from "@/lib/permissions/role-permissions";

<PermissionGuard permission={PermissionAction.USER_DELETE}>
  <Button onClick={handleDelete}>Delete User</Button>
</PermissionGuard>
```

### Permission Button with Tooltip

```tsx
import { PermissionButton } from "@/components/permissions/permission-button";
import { PermissionAction } from "@/lib/permissions/role-permissions";

<PermissionButton
  permission={PermissionAction.USER_DELETE}
  onClick={handleDelete}
  tooltipMessage="You don't have permission to delete users"
>
  Delete User
</PermissionButton>
```

### Multiple Permissions

```tsx
import { useCanAny, useCanAll } from "@/lib/permissions/frontend-helpers";

// Check if user has ANY of these permissions
const canEdit = useCanAny([
  PermissionAction.USER_UPDATE,
  PermissionAction.USER_DELETE,
]);

// Check if user has ALL of these permissions
const canManage = useCanAll([
  PermissionAction.USER_READ,
  PermissionAction.USER_UPDATE,
]);
```

### API Calls with Error Handling

```tsx
import { useApiClient } from "@/lib/api-client";

function MyComponent() {
  const { fetch } = useApiClient();
  
  const handleAction = async () => {
    try {
      const response = await fetch("/api/users/123", {
        method: "DELETE",
      });
      const result = await response.json();
      // Success handling
    } catch (error) {
      // Error is automatically shown in toast
    }
  };
}
```

## Admin UI Pages

### 1. Roles Management (`/dashboard/rbac/roles`)

**Features:**
- List all roles with permissions
- Create new roles
- Edit existing roles
- Delete roles (if not assigned to users)
- Assign permissions via checkboxes

**Access:** Requires `role.manage` permission

### 2. User Role Assignment (`/dashboard/rbac/users/[userId]`)

**Features:**
- View user information
- View assigned roles
- Assign additional roles
- Remove roles
- See role assignment history

**Access:** Requires `role.manage` permission

### 3. Audit Logs Viewer (`/dashboard/rbac/audit`)

**Features:**
- View all audit logs
- Filter by action, resource, user, date range
- Pagination
- View detailed information

**Access:** Requires `audit.read` permission

## UX Features

### 1. Tooltips on Disabled Buttons

Buttons disabled due to missing permissions automatically show a tooltip:

```tsx
<PermissionButton
  permission={PermissionAction.USER_DELETE}
  tooltipMessage="You don't have permission to delete users"
>
  Delete
</PermissionButton>
```

### 2. Toast Messages for Errors

API errors automatically show toast messages:

- **403 Forbidden**: "Access Denied - You don't have permission to perform this action"
- **401 Unauthorized**: "Authentication Required - Please log in to continue"
- **Other errors**: Shows the error message

### 3. Loading States

All pages show loading states while fetching data.

### 4. Access Denied Pages

Pages show friendly "Access Denied" messages if user lacks permission.

## Error Handling

### Automatic Error Handling

The `useApiClient` hook automatically handles errors:

```tsx
const { fetch } = useApiClient();

// Errors are automatically shown in toast
const response = await fetch("/api/users/123", {
  method: "DELETE",
});
```

### Manual Error Handling

```tsx
import { useApiErrorHandler } from "@/lib/api-error-handler";

function MyComponent() {
  const handleError = useApiErrorHandler();
  
  try {
    // API call
  } catch (error) {
    handleError(error); // Shows toast automatically
  }
}
```

## Best Practices

1. **Always use permission checks** before showing UI elements
2. **Use PermissionButton** for buttons that require permissions
3. **Use PermissionGuard** for conditional rendering
4. **Handle errors gracefully** with toast messages
5. **Show loading states** during API calls
6. **Provide feedback** for all user actions

## Examples

### Example 1: Delete Button with Permission

```tsx
import { PermissionButton } from "@/components/permissions/permission-button";
import { PermissionAction } from "@/lib/permissions/role-permissions";

function UserActions({ userId }: { userId: number }) {
  const handleDelete = async () => {
    // Delete logic
  };

  return (
    <PermissionButton
      permission={PermissionAction.USER_DELETE}
      onClick={handleDelete}
      variant="destructive"
    >
      Delete User
    </PermissionButton>
  );
}
```

### Example 2: Conditional Rendering

```tsx
import { PermissionGuard } from "@/components/permissions/permission-guard";
import { PermissionAction } from "@/lib/permissions/role-permissions";

function UserManagement() {
  return (
    <div>
      <PermissionGuard permission={PermissionAction.USER_CREATE}>
        <Button onClick={handleCreate}>Create User</Button>
      </PermissionGuard>
      
      <PermissionGuard permission={PermissionAction.USER_READ}>
        <UserList />
      </PermissionGuard>
    </div>
  );
}
```

### Example 3: Multiple Permissions

```tsx
import { useCanAny } from "@/lib/permissions/frontend-helpers";
import { PermissionAction } from "@/lib/permissions/role-permissions";

function TaskActions() {
  const canModify = useCanAny([
    PermissionAction.TASK_UPDATE,
    PermissionAction.TASK_DELETE,
  ]);

  return (
    <>
      {canModify && (
        <div>
          <Button onClick={handleEdit}>Edit</Button>
          <Button onClick={handleDelete}>Delete</Button>
        </div>
      )}
    </>
  );
}
```

## Troubleshooting

### Permissions Not Loading

1. Check if `PermissionsProvider` is in the component tree
2. Verify `/api/auth/me` endpoint is working
3. Check browser console for errors
4. Verify user is authenticated

### Permission Checks Not Working

1. Verify permission string matches exactly
2. Check if permission is in user's permissions array
3. Refresh permissions: `usePermissions().refresh()`

### Toast Messages Not Showing

1. Verify `Toaster` component is in the layout
2. Check if `useToast` hook is working
3. Verify error handler is being called

## Support

For issues or questions:
- Review `docs/RBAC_BACKEND_IMPLEMENTATION.md` for backend details
- Check `docs/RBAC_SYSTEM.md` for general RBAC documentation
- See `lib/permissions/frontend-helpers.ts` for helper functions


