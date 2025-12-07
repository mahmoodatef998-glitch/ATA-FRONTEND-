# Role Permissions Reference

This document defines the exact permissions assigned to each role in the system.

## 1. Admin

**All permissions (*)**, including:
- `role.manage` - Manage roles and permissions
- `audit.read` - View audit logs
- All other permissions in the system

### Full Permission List:
- **Users**: `user.create`, `user.read`, `user.update`, `user.delete`, `role.manage`
- **Clients**: `client.create`, `client.read`, `client.update`, `client.delete`
- **Leads**: `lead.create`, `lead.read`, `lead.update`, `lead.delete`, `lead.move_stage`
- **Tasks**: `task.create`, `task.read`, `task.update`, `task.delete`, `task.assign`, `task.complete`, `task.comment`, `task.change_priority`
- **Attendance**: `attendance.clock`, `attendance.read`, `attendance.manage`
- **Finance**: `invoice.create`, `invoice.read`, `invoice.update`, `invoice.delete`, `payment.record`, `finance.reports`
- **HR**: `hr.view`, `hr.manage`, `payroll.manage`
- **Reports**: `report.view`, `report.generate`
- **Files**: `file.upload`, `file.read`, `file.delete`
- **System**: `setting.view`, `setting.update`, `audit.read`

---

## 2. Operations Manager

### Permissions:
- **Clients**: `client.create`, `client.read`, `client.update`
- **Leads**: `lead.*` (all lead permissions)
  - `lead.create`, `lead.read`, `lead.update`, `lead.delete`, `lead.move_stage`
- **Tasks**: `task.*` (all task permissions)
  - `task.create`, `task.read`, `task.update`, `task.delete`, `task.assign`, `task.complete`, `task.comment`, `task.change_priority`
- **Attendance**: `attendance.read`
- **Reports**: `report.view`, `report.generate`
- **Files**: `file.read`, `file.upload`
- **System**: `setting.view` (view only)

### Forbidden:
- ❌ `role.manage` - Cannot manage roles
- ❌ `user.delete` - Cannot delete users
- ❌ `invoice.delete` - Cannot delete invoices
- ❌ `setting.update` - Cannot update system settings

---

## 3. Accountant

### Permissions:
- **Invoices**: `invoice.create`, `invoice.read`, `invoice.update`
- **Payment**: `payment.record`
- **Finance Reports**: `finance.reports`
- **Clients**: `client.read`

### Forbidden:
- ❌ `task.*` - No task permissions
- ❌ `hr.manage` - Cannot manage HR
- ❌ `role.manage` - Cannot manage roles

---

## 4. HR

### Permissions:
- **HR**: `hr.view`, `hr.manage`
- **Attendance**: `attendance.read`, `attendance.manage`
- **Users**: `user.read`, `user.update` (employee profiles only)
- **Files**: `file.read`, `file.upload` (employee documents)

### Forbidden:
- ❌ `payment.record` - Cannot record payments
- ❌ `role.manage` - Cannot manage roles

---

## 5. Supervisor

### Permissions:
- **Tasks**: 
  - `task.create` - Create tasks
  - `task.read` - View tasks
  - `task.update` - Update tasks
  - `task.assign` - Assign tasks (only to technicians)
  - `task.comment` - Comment on tasks (for supervised technicians)
  - `task.complete` - Complete tasks (for supervised technicians)
- **Attendance**: `attendance.read` (team only)
- **Clients**: `client.read`

### Forbidden:
- ❌ `client.create` - Cannot create clients
- ❌ `finance.*` - No finance permissions
- ❌ `role.manage` - Cannot manage roles

---

## 6. Technician

### Permissions:
- **Tasks**: 
  - `task.read` - Read assigned tasks only
  - `task.update` - Update status/photos
  - `task.comment` - Add comments
- **Attendance**: `attendance.clock` (own attendance only)
- **Files**: `file.upload` (task attachments)

### Forbidden:
- ❌ View other employees' data
- ❌ `finance.*` - No finance permissions
- ❌ `role.manage` - Cannot manage roles

---

## Permission Matrix

| Permission | Admin | Operations Manager | Accountant | HR | Supervisor | Technician |
|------------|-------|-------------------|------------|----|-----------|-----------| 
| `user.create` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `user.read` | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `user.update` | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `user.delete` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `role.manage` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `client.create` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `client.read` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| `client.update` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `client.delete` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `lead.*` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `task.*` | ✅ | ✅ | ❌ | ❌ | ✅* | ✅* |
| `attendance.clock` | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `attendance.read` | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| `attendance.manage` | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `invoice.create` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `invoice.read` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `invoice.update` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `invoice.delete` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `payment.record` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `finance.reports` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `hr.view` | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `hr.manage` | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `report.view` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `report.generate` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `file.upload` | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| `file.read` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `file.delete` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `setting.view` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `setting.update` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `audit.read` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

*Supervisor has full task permissions, Technician has limited task permissions (read assigned, update status/photos, comment)

---

## Notes

1. **Operations Manager** cannot delete users, invoices, or update system settings, but has full access to leads and tasks.

2. **Accountant** has limited permissions focused on financial operations and client viewing only.

3. **HR** can manage employee profiles and attendance but cannot manage roles or record payments.

4. **Supervisor** can assign tasks only to technicians and can complete tasks for supervised technicians.

5. **Technician** has very limited permissions - can only view and update their own assigned tasks and clock their own attendance.

6. All roles are forbidden from `role.manage` except Admin.

---

## Implementation

These permissions are enforced at:
- **Backend**: API route middleware (`lib/permissions/middleware.ts`)
- **Frontend**: React hooks and components (`lib/permissions/hooks.ts`, `lib/permissions/components.tsx`)

For more details, see:
- `docs/RBAC_SYSTEM.md` - Full RBAC documentation
- `docs/PERMISSIONS_MIGRATION.md` - Migration guide
- `lib/permissions/role-permissions.ts` - Source code


