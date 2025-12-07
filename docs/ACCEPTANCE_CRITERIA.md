# RBAC System - Acceptance Criteria

## Overview

This document defines the acceptance criteria for the Role-Based Access Control (RBAC) system implementation. All criteria must be met for the system to be considered complete and production-ready.

---

## 1. Admin Role

### 1.1 Role Management
- ✅ **AC-ADMIN-001**: Admin can create new roles via `/api/rbac/roles` (POST)
- ✅ **AC-ADMIN-002**: Admin can edit existing roles via `/api/rbac/roles/[id]` (PATCH)
- ✅ **AC-ADMIN-003**: Admin can delete roles via `/api/rbac/roles/[id]` (DELETE)
- ✅ **AC-ADMIN-004**: Admin can assign permissions to roles via role edit UI
- ✅ **AC-ADMIN-005**: Admin can view all roles and their permissions in `/dashboard/rbac/roles`

### 1.2 Permission Assignment
- ✅ **AC-ADMIN-006**: Admin can assign any permission to any role
- ✅ **AC-ADMIN-007**: Admin can remove permissions from roles
- ✅ **AC-ADMIN-008**: Changes to role permissions are reflected immediately (cache invalidation)

### 1.3 User Role Assignment
- ✅ **AC-ADMIN-009**: Admin can assign roles to users via `/api/rbac/users/[userId]/roles` (POST)
- ✅ **AC-ADMIN-010**: Admin can remove roles from users via `/api/rbac/users/[userId]/roles` (DELETE)
- ✅ **AC-ADMIN-011**: Admin can view user's assigned roles in user profile page

### 1.4 Audit Logs
- ✅ **AC-ADMIN-012**: Admin can view audit logs via `/api/rbac/audit-logs` (GET)
- ✅ **AC-ADMIN-013**: Audit logs record role assignment changes
- ✅ **AC-ADMIN-014**: Audit logs record permission edits
- ✅ **AC-ADMIN-015**: Audit logs record user creation/deletion

**Test Cases:**
```typescript
// AC-ADMIN-001
POST /api/rbac/roles
Body: { name: "custom_role", displayName: "Custom Role", permissions: ["user.read"] }
Expected: 201 Created, role created

// AC-ADMIN-004
PATCH /api/rbac/roles/1
Body: { permissions: ["user.read", "user.create"] }
Expected: 200 OK, permissions updated
```

---

## 2. Operations Manager Role

### 2.1 Task Management
- ✅ **AC-OM-001**: Operations Manager can create tasks via `/api/tasks` (POST)
- ✅ **AC-OM-002**: Operations Manager can read all tasks
- ✅ **AC-OM-003**: Operations Manager can update tasks
- ✅ **AC-OM-004**: Operations Manager can assign tasks to any user
- ✅ **AC-OM-005**: Operations Manager can mark tasks as complete

### 2.2 Client Management
- ✅ **AC-OM-006**: Operations Manager can create clients via `/api/clients` (POST)
- ✅ **AC-OM-007**: Operations Manager can read clients
- ✅ **AC-OM-008**: Operations Manager can update clients
- ✅ **AC-OM-009**: Operations Manager **CANNOT** delete clients (no `client.delete` permission)

### 2.3 Invoice Management
- ✅ **AC-OM-010**: Operations Manager **CANNOT** delete invoices (no `invoice.delete` permission)
- ✅ **AC-OM-011**: Operations Manager can view invoices (if `invoice.read` is assigned)

### 2.4 Restricted Actions
- ✅ **AC-OM-012**: Operations Manager **CANNOT** manage roles (no `role.manage` permission)
- ✅ **AC-OM-013**: Operations Manager **CANNOT** delete users (no `user.delete` permission)
- ✅ **AC-OM-014**: Operations Manager **CANNOT** update system settings (no `setting.update` permission)

**Test Cases:**
```typescript
// AC-OM-001
POST /api/tasks
Headers: { Authorization: "Bearer <om_token>" }
Body: { title: "New Task", assignedTo: 5 }
Expected: 201 Created

// AC-OM-009
DELETE /api/clients/1
Headers: { Authorization: "Bearer <om_token>" }
Expected: 403 Forbidden, "Insufficient permissions. Required: client.delete"
```

---

## 3. Accountant Role

### 3.1 Invoice Management
- ✅ **AC-ACC-001**: Accountant can create invoices via `/api/invoices` (POST)
- ✅ **AC-ACC-002**: Accountant can read invoices
- ✅ **AC-ACC-003**: Accountant can update invoices
- ✅ **AC-ACC-004**: Accountant **CANNOT** delete invoices (no `invoice.delete` permission)

### 3.2 Payment Management
- ✅ **AC-ACC-005**: Accountant can record payments via `/api/payments` (POST)
- ✅ **AC-ACC-006**: Accountant can view finance reports

### 3.3 Client Access
- ✅ **AC-ACC-007**: Accountant can read clients (read-only)
- ✅ **AC-ACC-008**: Accountant **CANNOT** create/update/delete clients

### 3.4 Restricted Actions
- ✅ **AC-ACC-009**: Accountant **CANNOT** manage tasks (no `task.*` permissions)
- ✅ **AC-ACC-010**: Accountant **CANNOT** manage HR (no `hr.manage` permission)
- ✅ **AC-ACC-011**: Accountant **CANNOT** manage roles (no `role.manage` permission)

**Test Cases:**
```typescript
// AC-ACC-001
POST /api/invoices
Headers: { Authorization: "Bearer <accountant_token>" }
Body: { clientId: 1, amount: 1000 }
Expected: 201 Created

// AC-ACC-009
POST /api/tasks
Headers: { Authorization: "Bearer <accountant_token>" }
Expected: 403 Forbidden, "Insufficient permissions. Required: task.create"
```

---

## 4. HR Role

### 4.1 Employee Management
- ✅ **AC-HR-001**: HR can view employee profiles (read users)
- ✅ **AC-HR-002**: HR can update employee profiles
- ✅ **AC-HR-003**: HR **CANNOT** create/delete users (no `user.create`, `user.delete` permissions)

### 4.2 Attendance Management
- ✅ **AC-HR-004**: HR can read attendance records
- ✅ **AC-HR-005**: HR can manage attendance (approve, edit, delete)

### 4.3 File Management
- ✅ **AC-HR-006**: HR can read employee documents
- ✅ **AC-HR-007**: HR can upload employee documents

### 4.4 Restricted Actions
- ✅ **AC-HR-008**: HR **CANNOT** record payments (no `payment.record` permission)
- ✅ **AC-HR-009**: HR **CANNOT** manage roles (no `role.manage` permission)

**Test Cases:**
```typescript
// AC-HR-002
PATCH /api/team/members/5
Headers: { Authorization: "Bearer <hr_token>" }
Body: { name: "Updated Name" }
Expected: 200 OK

// AC-HR-008
POST /api/payments
Headers: { Authorization: "Bearer <hr_token>" }
Expected: 403 Forbidden
```

---

## 5. Supervisor Role

### 5.1 Task Assignment
- ✅ **AC-SUP-001**: Supervisor can create tasks
- ✅ **AC-SUP-002**: Supervisor can assign tasks **ONLY to technicians** (contextual check)
- ✅ **AC-SUP-003**: Supervisor **CANNOT** assign tasks to non-technicians
- ✅ **AC-SUP-004**: Supervisor can mark tasks as complete (for supervised technicians)

### 5.2 Task Management
- ✅ **AC-SUP-005**: Supervisor can read tasks
- ✅ **AC-SUP-006**: Supervisor can update tasks
- ✅ **AC-SUP-007**: Supervisor can comment on tasks

### 5.3 Attendance
- ✅ **AC-SUP-008**: Supervisor can read attendance (team only)

### 5.4 Restricted Actions
- ✅ **AC-SUP-009**: Supervisor **CANNOT** create clients (no `client.create` permission)
- ✅ **AC-SUP-010**: Supervisor **CANNOT** access finance (no finance permissions)
- ✅ **AC-SUP-011**: Supervisor **CANNOT** manage roles (no `role.manage` permission)

**Test Cases:**
```typescript
// AC-SUP-002
POST /api/tasks
Headers: { Authorization: "Bearer <supervisor_token>" }
Body: { title: "Task", assignedTo: <technician_id> }
Expected: 201 Created

// AC-SUP-003
POST /api/tasks
Headers: { Authorization: "Bearer <supervisor_token>" }
Body: { title: "Task", assignedTo: <non_technician_id> }
Expected: 403 Forbidden, "Supervisors can only assign tasks to technicians"
```

---

## 6. Technician Role

### 6.1 Task Management
- ✅ **AC-TECH-001**: Technician can read **only assigned tasks**
- ✅ **AC-TECH-002**: Technician can update task status/photos
- ✅ **AC-TECH-003**: Technician can comment on assigned tasks
- ✅ **AC-TECH-004**: Technician **CANNOT** create/assign/delete tasks

### 6.2 Attendance
- ✅ **AC-TECH-005**: Technician can clock in/out (own attendance only)

### 6.3 File Management
- ✅ **AC-TECH-006**: Technician can upload task attachments

### 6.4 Restricted Actions
- ✅ **AC-TECH-007**: Technician **CANNOT** view other employees' data
- ✅ **AC-TECH-008**: Technician **CANNOT** access finance
- ✅ **AC-TECH-009**: Technician **CANNOT** manage roles

**Test Cases:**
```typescript
// AC-TECH-001
GET /api/tasks
Headers: { Authorization: "Bearer <technician_token>" }
Expected: 200 OK, only tasks where assignedTo = technician_id

// AC-TECH-004
POST /api/tasks
Headers: { Authorization: "Bearer <technician_token>" }
Expected: 403 Forbidden, "Insufficient permissions. Required: task.create"
```

---

## 7. Audit Logging

### 7.1 Role Assignment Events
- ✅ **AC-AUDIT-001**: Audit log created when role is assigned to user
- ✅ **AC-AUDIT-002**: Audit log created when role is removed from user
- ✅ **AC-AUDIT-003**: Audit log includes: userId, roleId, assignedBy, timestamp

### 7.2 Permission Edits
- ✅ **AC-AUDIT-004**: Audit log created when permissions are added to role
- ✅ **AC-AUDIT-005**: Audit log created when permissions are removed from role

### 7.3 User Management
- ✅ **AC-AUDIT-006**: Audit log created when user is created
- ✅ **AC-AUDIT-007**: Audit log created when user is deleted
- ✅ **AC-AUDIT-008**: Audit log created when user role is changed

### 7.4 Attendance Edits
- ✅ **AC-AUDIT-009**: Audit log created when attendance is edited (if applicable)

### 7.5 Invoice Deletion
- ✅ **AC-AUDIT-010**: Audit log created when invoice is deleted

**Test Cases:**
```typescript
// AC-AUDIT-001
POST /api/rbac/users/5/roles
Body: { roleId: 2 }
Expected: 201 Created, audit log entry created

// Verify audit log
GET /api/rbac/audit-logs?action=USER_ROLE_ASSIGNED
Expected: 200 OK, log entry present
```

---

## 8. Frontend UI

### 8.1 Button Visibility
- ✅ **AC-UI-001**: Buttons are **hidden** if user lacks permission
- ✅ **AC-UI-002**: Buttons are **visible** if user has permission
- ✅ **AC-UI-003**: Disabled buttons show tooltip: "You don't have permission"

### 8.2 Permission Guards
- ✅ **AC-UI-004**: `<PermissionGuard>` component hides children if no permission
- ✅ **AC-UI-005**: `<PermissionButton>` disables button if no permission

### 8.3 Toast Messages
- ✅ **AC-UI-006**: Toast message shown when backend returns 403 Forbidden
- ✅ **AC-UI-007**: Toast message is user-friendly (not technical error)

**Test Cases:**
```typescript
// AC-UI-001
// Render component as non-admin user
<PermissionButton permission="user.create">Create User</PermissionButton>
Expected: Button not rendered (hidden)

// AC-UI-003
// Render component as user without permission
<PermissionButton permission="user.delete">Delete</PermissionButton>
Expected: Button disabled with tooltip "You don't have permission"
```

---

## 9. API Endpoints Documentation

### 9.1 OpenAPI/Postman
- ✅ **AC-DOC-001**: All RBAC endpoints documented in OpenAPI format
- ✅ **AC-DOC-002**: All RBAC endpoints available in Postman collection
- ✅ **AC-DOC-003**: Documentation includes: request/response examples, error codes, permissions required

**Endpoints to Document:**
- `GET /api/rbac/roles`
- `POST /api/rbac/roles`
- `PATCH /api/rbac/roles/[id]`
- `DELETE /api/rbac/roles/[id]`
- `GET /api/rbac/permissions`
- `GET /api/rbac/users/[userId]/roles`
- `POST /api/rbac/users/[userId]/roles`
- `DELETE /api/rbac/users/[userId]/roles`
- `GET /api/rbac/audit-logs`

---

## 10. Feature Flag

### 10.1 RBAC_ENABLED Flag
- ✅ **AC-FLAG-001**: System respects `RBAC_ENABLED=true/false` in `.env`
- ✅ **AC-FLAG-002**: When `RBAC_ENABLED=false`, legacy role checks are used
- ✅ **AC-FLAG-003**: When `RBAC_ENABLED=true`, RBAC checks are used
- ✅ **AC-FLAG-004**: Feature flag can be toggled without code changes (env only)

**Test Cases:**
```typescript
// AC-FLAG-001
// Set RBAC_ENABLED=false in .env
// Restart server
// Make API request
Expected: Legacy role check used

// AC-FLAG-003
// Set RBAC_ENABLED=true in .env
// Restart server
// Make API request
Expected: RBAC permission check used
```

---

## Testing Checklist

### Backend Tests
- [ ] Unit tests for `authorize()` function
- [ ] Unit tests for `getUserPermissions()`
- [ ] Integration tests for role assignment
- [ ] Integration tests for permission checks
- [ ] Integration tests for audit logging

### Frontend Tests
- [ ] Unit tests for `useCan()` hook
- [ ] Unit tests for `<PermissionGuard>` component
- [ ] Unit tests for `<PermissionButton>` component
- [ ] E2E tests for button visibility based on permissions

### Manual Testing
- [ ] Test each role's permissions (Admin, OM, Accountant, HR, Supervisor, Technician)
- [ ] Test contextual checks (supervisor assigning to technicians)
- [ ] Test audit log creation
- [ ] Test feature flag toggle
- [ ] Test cache invalidation

---

## Sign-off

- [ ] All acceptance criteria met
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Code reviewed
- [ ] Ready for production

**Reviewed by:** _______________  
**Date:** _______________  
**Status:** ☐ Approved  ☐ Needs Revision


