# Role-Based Access Control (RBAC) System Documentation

## Overview

The RBAC system provides granular access control for the ATA CRM project. It enables administrators to manage permissions for different user roles and track critical actions through audit logging.

## Architecture

### Components

1. **Permission System** (`lib/permissions/`)
   - `role-permissions.ts`: Defines all permissions and role mappings
   - `hooks.ts`: React hooks for frontend permission checks
   - `components.tsx`: UI components with permission guards
   - `middleware.ts`: Backend permission middleware

2. **Audit Logging** (`lib/rbac/`)
   - `audit-logger.ts`: Service for creating and querying audit logs
   - Tracks all critical actions (role changes, deletions, etc.)

3. **Admin UI** (`app/(dashboard)/dashboard/rbac/`)
   - Role management interface
   - Permission viewer
   - Audit log viewer

4. **API Routes** (`app/api/rbac/`)
   - `/api/rbac/roles`: Role and permission management
   - `/api/rbac/audit-logs`: Audit log queries

## Roles

### 1. Admin
**Full system access**
- All team member operations (create, read, update, delete)
- All attendance operations
- All task operations
- All order operations
- All client operations
- All invoice operations
- All quotation operations
- System settings access
- Audit log access
- Reports access

### 2. Operations Manager
**Operations and team management**
- Team member read/update (no delete)
- Full attendance management
- Task creation and management
- Full order management
- Full client management
- Full quotation management
- Dashboard access
- **Cannot**: Delete users, access settings, delete orders/invoices

### 3. Accountant
**Financial and attendance management**
- Attendance management (full access)
- Team members (read-only)
- Orders (read and update)
- Clients (read and update)
- Invoices (full access)
- Quotations (read)
- Reports (view and export)
- **Cannot**: Delete users, delete orders/invoices, access settings

### 4. HR
**Human resources management**
- Team member management (read, update, delete, assign roles - except Admin)
- Full attendance management
- Task read and assignment
- **Cannot**: Create team members, access CRM modules

### 5. Supervisor
**Task and attendance supervision**
- Task creation and management
- Task assignment and completion
- Attendance check-in/out
- Attendance viewing
- **Cannot**: Manage team members, access CRM modules

### 6. Technician
**Basic operations**
- Attendance check-in/out
- Own attendance viewing
- Own tasks viewing (read-only)
- **Cannot**: Create tasks, update tasks, access other modules

## Permissions

### Permission Actions

#### Team Members
- `team.members.create`: Create new team members
- `team.members.read`: View team members
- `team.members.update`: Update team member details
- `team.members.delete`: Delete team members
- `team.members.assign_role`: Assign roles to team members

#### Attendance
- `attendance.create`: Check-in/check-out
- `attendance.read.own`: View own attendance
- `attendance.read.all`: View all attendance records
- `attendance.update`: Update attendance records
- `attendance.approve`: Approve attendance requests
- `attendance.delete`: Delete attendance records

#### Tasks
- `tasks.create`: Create new tasks
- `tasks.read.own`: View own tasks
- `tasks.read.all`: View all tasks
- `tasks.update.own`: Update own tasks
- `tasks.update.all`: Update any task
- `tasks.delete`: Delete tasks
- `tasks.mark_completed`: Mark tasks as completed
- `tasks.assign`: Assign tasks to users

#### Orders
- `orders.create`: Create new orders
- `orders.read`: View orders
- `orders.update`: Update orders
- `orders.delete`: Delete orders
- `orders.update_status`: Update order status
- `orders.update_stage`: Update order stage
- `orders.view_all`: View all orders

#### Clients
- `clients.create`: Create new clients
- `clients.read`: View clients
- `clients.update`: Update clients
- `clients.delete`: Delete clients
- `clients.approve`: Approve client accounts
- `clients.reject`: Reject client accounts

#### Invoices
- `invoices.create`: Create invoices
- `invoices.read`: View invoices
- `invoices.update`: Update invoices
- `invoices.delete`: Delete invoices
- `invoices.send`: Send invoices
- `invoices.mark_paid`: Mark invoices as paid

#### Quotations
- `quotations.create`: Create quotations
- `quotations.read`: View quotations
- `quotations.update`: Update quotations
- `quotations.delete`: Delete quotations
- `quotations.send`: Send quotations
- `quotations.accept`: Accept quotations
- `quotations.reject`: Reject quotations

#### System Access
- `access.dashboard`: Access main dashboard
- `access.orders`: Access orders module
- `access.clients`: Access clients module
- `access.settings`: Access system settings

#### Audit & Reports
- `audit.read`: View audit logs
- `reports.view`: View reports
- `reports.export`: Export reports

## Usage

### Backend Permission Checks

```typescript
import { requirePermission } from "@/lib/permissions/middleware";
import { PermissionAction } from "@/lib/permissions/role-permissions";

// In API route
const session = await requirePermission(PermissionAction.ORDERS_DELETE);
```

### Frontend Permission Checks

```typescript
import { usePermission } from "@/lib/permissions/hooks";
import { PermissionAction } from "@/lib/permissions/role-permissions";

// In component
const canDelete = usePermission(PermissionAction.ORDERS_DELETE);

{canDelete && <Button onClick={handleDelete}>Delete</Button>}
```

### Permission Guards

```typescript
import { PermissionGuard } from "@/lib/permissions/components";
import { PermissionAction } from "@/lib/permissions/role-permissions";

<PermissionGuard action={PermissionAction.ORDERS_DELETE}>
  <Button>Delete Order</Button>
</PermissionGuard>
```

## Audit Logging

### Tracked Actions

The system automatically logs:
- User creation, updates, deletions
- Role changes
- Password changes
- Account status changes
- Attendance updates and deletions
- Task operations
- Order operations
- Client operations
- Invoice operations
- Quotation operations
- Settings changes

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
  details: {
    oldRole: "TECHNICIAN",
    newRole: "SUPERVISOR",
  },
  ...auditContext,
});
```

### Querying Audit Logs

```typescript
import { getAuditLogs } from "@/lib/rbac/audit-logger";

const result = await getAuditLogs({
  companyId: 1,
  action: AuditAction.USER_ROLE_CHANGED,
  startDate: new Date("2024-01-01"),
  limit: 50,
  offset: 0,
});
```

## Database Schema

### audit_logs Table

```prisma
model audit_logs {
  id          Int       @id @default(autoincrement())
  companyId   Int
  userId      Int?
  userName    String?
  userRole    UserRole?
  action      String
  resource    String
  resourceId  Int?
  details     Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime  @default(now())
  companies   companies @relation(...)
  users       users?    @relation(...)
  
  @@index([companyId])
  @@index([userId])
  @@index([action])
  @@index([resource])
  @@index([resourceId])
  @@index([createdAt])
}
```

## Admin UI

Access the RBAC management interface at `/dashboard/rbac` (Admin only).

### Features

1. **Roles & Permissions Tab**
   - View all roles and their permissions
   - Expand/collapse role details
   - See permission count per role
   - Permissions grouped by category

2. **Audit Logs Tab**
   - View all audit log entries
   - Filter by user, action, resource
   - View detailed information
   - See IP address and user agent

## Migration Guide

### Adding New Permissions

1. Add permission to `PermissionAction` enum in `lib/permissions/role-permissions.ts`
2. Add permission to appropriate roles in `ROLE_PERMISSIONS`
3. Update documentation

### Adding New Audit Actions

1. Add action to `AuditAction` enum in `lib/rbac/audit-logger.ts`
2. Add resource to `AuditResource` enum if needed
3. Add audit logging in relevant API routes

## Security Considerations

1. **Role Assignment**: Only Admins can assign Admin role
2. **Self-Protection**: Users cannot delete or modify their own critical attributes through team management endpoints
3. **Company Isolation**: All operations are scoped to user's company
4. **Audit Trail**: All critical actions are logged with full context

## Testing

Run tests with:
```bash
npm test
```

Test files:
- `__tests__/rbac/permissions.test.ts`
- `__tests__/rbac/audit-logger.test.ts`

## Support

For issues or questions, contact the development team or refer to the main project documentation.


