# RBAC Module

## Overview

This module provides a comprehensive Role-Based Access Control (RBAC) system for the ATA CRM project.

## Features

✅ **Granular Permissions**: Fine-grained control over user actions
✅ **Audit Logging**: Complete audit trail for critical actions
✅ **Admin UI**: User-friendly interface for managing roles and permissions
✅ **Backend & Frontend Enforcement**: Permissions enforced at both API and UI levels
✅ **Backward Compatible**: Existing functionality remains unchanged

## Quick Start

### Using Permissions in Backend

```typescript
import { requirePermission } from "@/lib/permissions/middleware";
import { PermissionAction } from "@/lib/permissions/role-permissions";

export async function DELETE(request: NextRequest) {
  const session = await requirePermission(PermissionAction.ORDERS_DELETE);
  // Your code here
}
```

### Using Permissions in Frontend

```typescript
import { usePermission } from "@/lib/permissions/hooks";
import { PermissionAction } from "@/lib/permissions/role-permissions";

function MyComponent() {
  const canDelete = usePermission(PermissionAction.ORDERS_DELETE);
  
  return (
    <>
      {canDelete && <Button onClick={handleDelete}>Delete</Button>}
    </>
  );
}
```

### Creating Audit Logs

```typescript
import { createAuditLog, AuditAction, AuditResource, getAuditContext } from "@/lib/rbac/audit-logger";

const auditContext = getAuditContext(request);
await createAuditLog({
  companyId: session.user.companyId,
  userId: session.user.id,
  userName: session.user.name,
  userRole: session.user.role,
  action: AuditAction.USER_ROLE_CHANGED,
  resource: AuditResource.USER,
  resourceId: userId,
  details: { oldRole: "TECHNICIAN", newRole: "SUPERVISOR" },
  ...auditContext,
});
```

## Files Structure

```
lib/
├── rbac/
│   ├── audit-logger.ts      # Audit logging service
│   └── README.md            # This file
├── permissions/
│   ├── role-permissions.ts  # Permission definitions
│   ├── hooks.ts             # React hooks
│   ├── components.tsx        # UI components
│   └── middleware.ts        # Backend middleware
app/
├── api/
│   └── rbac/
│       ├── roles/route.ts       # Role management API
│       └── audit-logs/route.ts  # Audit logs API
└── (dashboard)/
    └── dashboard/
        └── rbac/
            └── page.tsx         # Admin UI
```

## Next Steps

1. Run database migration: `npx prisma migrate dev`
2. Generate Prisma client: `npx prisma generate`
3. Access admin UI: `/dashboard/rbac` (Admin only)
4. Review documentation: `docs/RBAC_SYSTEM.md`

## Support

For detailed documentation, see `docs/RBAC_SYSTEM.md`.


