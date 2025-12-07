# RBAC Frontend - Quick Start Guide

## Overview

Complete frontend RBAC implementation with permission-based UI rendering, admin interfaces, and user-friendly error handling.

## Features

✅ **Automatic Permission Loading**: Permissions fetched after login via `/api/auth/me`
✅ **React Context Caching**: Permissions cached in React Context
✅ **Helper Functions**: `useCan()`, `useCanAny()`, `useCanAll()`
✅ **UI Components**: `PermissionGuard`, `PermissionButton` with tooltips
✅ **Admin UI**: Roles management, user role assignment, audit logs viewer
✅ **UX Improvements**: Tooltips on disabled buttons, toast messages for errors

## Quick Start

### 1. Install Dependencies

```bash
npm install @radix-ui/react-tooltip
```

### 2. Use Permission Checks

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

### 3. Use Permission Components

```tsx
import { PermissionButton } from "@/components/permissions/permission-button";
import { PermissionGuard } from "@/components/permissions/permission-guard";

<PermissionGuard permission={PermissionAction.USER_DELETE}>
  <PermissionButton
    permission={PermissionAction.USER_DELETE}
    onClick={handleDelete}
  >
    Delete User
  </PermissionButton>
</PermissionGuard>
```

## Admin UI Pages

### Roles Management
**URL:** `/dashboard/rbac/roles`
**Permission:** `role.manage`

Features:
- Create, edit, delete roles
- Assign permissions via checkboxes
- View role details and user count

### User Role Assignment
**URL:** `/dashboard/rbac/users/[userId]`
**Permission:** `role.manage`

Features:
- View user information
- Assign/remove roles
- View role assignment history

### Audit Logs Viewer
**URL:** `/dashboard/rbac/audit`
**Permission:** `audit.read`

Features:
- View all audit logs
- Filter by action, resource, user, date
- Pagination support

## Components

### PermissionGuard

Conditionally renders children based on permissions:

```tsx
<PermissionGuard
  permission={PermissionAction.USER_DELETE}
  fallback={<p>No permission</p>}
>
  <Button>Delete</Button>
</PermissionGuard>
```

### PermissionButton

Button with automatic permission check and tooltip:

```tsx
<PermissionButton
  permission={PermissionAction.USER_DELETE}
  onClick={handleDelete}
  tooltipMessage="You don't have permission"
>
  Delete
</PermissionButton>
```

## Helper Functions

### useCan

Check single permission:

```tsx
const canDelete = useCan(PermissionAction.USER_DELETE);
```

### useCanAny

Check if user has any of the permissions:

```tsx
const canModify = useCanAny([
  PermissionAction.USER_UPDATE,
  PermissionAction.USER_DELETE,
]);
```

### useCanAll

Check if user has all permissions:

```tsx
const canManage = useCanAll([
  PermissionAction.USER_READ,
  PermissionAction.USER_UPDATE,
]);
```

## Error Handling

### Automatic Toast Messages

API errors automatically show toast messages:

```tsx
import { useApiClient } from "@/lib/api-client";

const { fetch } = useApiClient();

// Errors are automatically shown in toast
const response = await fetch("/api/users/123", {
  method: "DELETE",
});
```

### Manual Error Handling

```tsx
import { useApiErrorHandler } from "@/lib/api-error-handler";

const handleError = useApiErrorHandler();

try {
  // API call
} catch (error) {
  handleError(error); // Shows toast
}
```

## File Structure

```
contexts/
  permissions-context.tsx      # Permissions Context Provider

components/
  permissions/
    permission-guard.tsx       # Conditional rendering component
    permission-button.tsx      # Button with permission check

lib/
  permissions/
    frontend-helpers.ts        # Helper hooks (useCan, etc.)
  api-client.ts                # Enhanced fetch with error handling
  api-error-handler.ts         # Error handler with toast

app/
  api/
    auth/
      me/
        route.ts               # Get user permissions endpoint
  (dashboard)/
    dashboard/
      rbac/
        roles/
          page.tsx             # Roles management page
        users/
          [userId]/
            page.tsx           # User role assignment page
        audit/
          page.tsx             # Audit logs viewer
```

## Examples

See `docs/RBAC_FRONTEND_IMPLEMENTATION.md` for detailed examples and best practices.

## Support

For issues or questions:
- Review `docs/RBAC_FRONTEND_IMPLEMENTATION.md` for complete guide
- Check `docs/RBAC_BACKEND_IMPLEMENTATION.md` for backend details
- See `lib/permissions/frontend-helpers.ts` for helper functions


