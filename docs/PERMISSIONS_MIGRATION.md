# Permissions Migration Guide

## Overview

The permissions system has been migrated to use granular dot notation. This document explains the changes and how to migrate existing code.

## New Permission Structure

### Users
- `user.create` - Create new users
- `user.read` - View users
- `user.update` - Update user details
- `user.delete` - Delete users
- `role.manage` - Assign and manage roles

### Clients
- `client.create` - Create new clients
- `client.read` - View clients
- `client.update` - Update client details
- `client.delete` - Delete clients

### Leads
- `lead.create` - Create new leads
- `lead.read` - View leads
- `lead.update` - Update lead details
- `lead.delete` - Delete leads
- `lead.move_stage` - Move leads between stages

### Tasks
- `task.create` - Create new tasks
- `task.read` - View tasks
- `task.update` - Update task details
- `task.delete` - Delete tasks
- `task.assign` - Assign tasks to users
- `task.complete` - Mark tasks as completed
- `task.comment` - Add comments to tasks
- `task.change_priority` - Change task priority

### Attendance
- `attendance.clock` - Check-in/check-out
- `attendance.read` - View attendance records
- `attendance.manage` - Manage attendance (update, approve, delete)

### Finance
- `invoice.create` - Create invoices
- `invoice.read` - View invoices
- `invoice.update` - Update invoices
- `invoice.delete` - Delete invoices
- `payment.record` - Record payments
- `finance.reports` - View financial reports

### HR
- `hr.view` - View HR information
- `hr.manage` - Manage HR operations
- `payroll.manage` - Manage payroll

### Reports
- `report.view` - View reports
- `report.generate` - Generate reports

### Files
- `file.upload` - Upload files
- `file.read` - Read/view files
- `file.delete` - Delete files

### System
- `setting.view` - View system settings
- `setting.update` - Update system settings
- `audit.read` - View audit logs

## Backward Compatibility

The old permission names are still available and mapped to the new permissions:

### Legacy Mappings

| Old Permission | New Permission |
|---------------|----------------|
| `team.members.create` | `user.create` |
| `team.members.read` | `user.read` |
| `team.members.update` | `user.update` |
| `team.members.delete` | `user.delete` |
| `team.members.assign_role` | `role.manage` |
| `attendance.create` | `attendance.clock` |
| `attendance.read.own` | `attendance.read` |
| `attendance.read.all` | `attendance.read` |
| `attendance.update` | `attendance.manage` |
| `attendance.approve` | `attendance.manage` |
| `attendance.delete` | `attendance.manage` |
| `tasks.create` | `task.create` |
| `tasks.read.own` | `task.read` |
| `tasks.read.all` | `task.read` |
| `tasks.update.own` | `task.update` |
| `tasks.update.all` | `task.update` |
| `tasks.delete` | `task.delete` |
| `tasks.mark_completed` | `task.complete` |
| `tasks.assign` | `task.assign` |

## Migration Steps

### 1. Update Permission Checks

**Before:**
```typescript
import { PermissionAction } from "@/lib/permissions/role-permissions";

if (hasPermission(role, PermissionAction.TEAM_MEMBERS_CREATE)) {
  // ...
}
```

**After (Recommended):**
```typescript
import { PermissionAction } from "@/lib/permissions/role-permissions";

if (hasPermission(role, PermissionAction.USER_CREATE)) {
  // ...
}
```

**Or (Backward Compatible):**
```typescript
// Old permission names still work
if (hasPermission(role, PermissionAction.TEAM_MEMBERS_CREATE)) {
  // ...
}
```

### 2. Update API Routes

**Before:**
```typescript
const session = await requirePermission(PermissionAction.TEAM_MEMBERS_UPDATE);
```

**After:**
```typescript
const session = await requirePermission(PermissionAction.USER_UPDATE);
```

### 3. Update Frontend Components

**Before:**
```typescript
const canUpdate = usePermission(PermissionAction.TEAM_MEMBERS_UPDATE);
```

**After:**
```typescript
const canUpdate = usePermission(PermissionAction.USER_UPDATE);
```

## Role Permissions Summary

### Admin
- Full access to all permissions

### Operations Manager
- Users: Read, Update, Role Management (except Admin)
- Clients: Full access
- Leads: Full access
- Tasks: Full access
- Attendance: Full access
- Finance: Read, Update, Payment Record, Reports
- Reports: View, Generate
- Files: Upload, Read
- System: View only

### Accountant
- Users: Read only
- Clients: Read, Update
- Leads: Read, Update
- Attendance: Full access
- Finance: Full access
- Reports: View, Generate
- Files: Upload, Read
- System: View only

### HR
- Users: Read, Update, Delete, Role Management (except Admin)
- Attendance: Full access
- Tasks: Read, Update, Assign, Comment
- HR: Full access
- Reports: View
- Files: Upload, Read

### Supervisor
- Tasks: Full access
- Attendance: Clock, Read
- Leads: Read, Update, Move Stage
- Reports: View
- Files: Upload, Read

### Technician
- Attendance: Clock, Read
- Tasks: Read, Comment
- Files: Read

## Testing

After migration, test all permission checks:

1. Verify Admin has all permissions
2. Verify each role has correct permissions
3. Verify backward compatibility with old permission names
4. Test API routes with new permissions
5. Test frontend components with new permissions

## Support

For questions or issues, refer to:
- `docs/RBAC_SYSTEM.md` - Full RBAC documentation
- `lib/permissions/role-permissions.ts` - Permission definitions
- `lib/rbac/README.md` - RBAC module overview


