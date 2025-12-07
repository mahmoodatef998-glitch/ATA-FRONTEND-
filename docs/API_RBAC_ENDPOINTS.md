# RBAC API Endpoints Documentation

## Base URL
```
http://localhost:3005/api
```

## Authentication
All endpoints require authentication via NextAuth session cookie or Bearer token.

---

## 1. Get Current User Permissions

### `GET /api/auth/me`

Returns current user information including permissions and roles.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "ADMIN",
    "companyId": 1,
    "permissions": [
      "user.create",
      "user.read",
      "user.update",
      "user.delete",
      "role.manage",
      ...
    ],
    "roles": [
      {
        "name": "ADMIN",
        "id": 0,
        "isDefault": true
      }
    ]
  }
}
```

---

## 2. Roles Management

### `GET /api/rbac/roles`

Get all roles with their permissions.

**Permission Required:** `role.manage`

**Query Parameters:**
- `includeSystem` (boolean, optional): Include system roles
- `companyOnly` (boolean, optional): Show only company roles

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "admin",
      "displayName": "Admin",
      "description": "Full system access",
      "isSystem": true,
      "companyId": null,
      "permissions": [
        {
          "id": 1,
          "name": "user.create",
          "displayName": "Create User"
        }
      ],
      "userCount": 5,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### `POST /api/rbac/roles`

Create a new role.

**Permission Required:** `role.manage`

**Request Body:**
```json
{
  "name": "custom_role",
  "displayName": "Custom Role",
  "description": "Custom role description",
  "companyId": 1,
  "permissionIds": [1, 2, 3]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "name": "custom_role",
    "displayName": "Custom Role",
    "description": "Custom role description",
    "isSystem": false,
    "companyId": 1,
    "permissions": [
      {
        "id": 1,
        "name": "user.create"
      }
    ]
  },
  "message": "Role created successfully"
}
```

### `PATCH /api/rbac/roles/[id]`

Update a role.

**Permission Required:** `role.manage`

**Request Body:**
```json
{
  "displayName": "Updated Role Name",
  "description": "Updated description",
  "permissionIds": [1, 2, 3, 4]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "name": "custom_role",
    "displayName": "Updated Role Name",
    "permissions": [...]
  },
  "message": "Role updated successfully"
}
```

### `DELETE /api/rbac/roles/[id]`

Delete a role.

**Permission Required:** `role.manage`

**Response:**
```json
{
  "success": true,
  "message": "Role deleted successfully"
}
```

---

## 3. Permissions Management

### `GET /api/rbac/permissions`

Get all permissions.

**Permission Required:** `role.manage`

**Query Parameters:**
- `category` (string, optional): Filter by category
- `resource` (string, optional): Filter by resource

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "user.create",
      "displayName": "Create User",
      "description": "Create new users",
      "category": "Users",
      "resource": "user",
      "action": "create",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### `POST /api/rbac/permissions`

Create a new permission.

**Permission Required:** `role.manage`

**Request Body:**
```json
{
  "name": "custom.action",
  "displayName": "Custom Action",
  "description": "Perform custom action",
  "category": "Custom",
  "resource": "custom",
  "action": "action"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 100,
    "name": "custom.action",
    "displayName": "Custom Action",
    ...
  },
  "message": "Permission created successfully"
}
```

---

## 4. User Role Assignment

### `GET /api/rbac/users/[userId]/roles`

Get all roles assigned to a user.

**Permission Required:** `role.manage`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "admin",
      "displayName": "Admin",
      "isDefault": false,
      "assignedAt": "2024-01-01T00:00:00.000Z",
      "assignedBy": 1,
      "isActive": true
    }
  ]
}
```

### `POST /api/rbac/users/[userId]/roles`

Assign a role to a user.

**Permission Required:** `role.manage`

**Request Body:**
```json
{
  "roleId": 2,
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 5,
    "roleId": 2,
    "assignedAt": "2024-01-01T00:00:00.000Z",
    "assignedBy": 1,
    "isActive": true
  },
  "message": "Role assigned successfully"
}
```

### `DELETE /api/rbac/users/[userId]/roles`

Remove a role from a user.

**Permission Required:** `role.manage`

**Query Parameters:**
- `roleId` (number, required): Role ID to remove

**Response:**
```json
{
  "success": true,
  "message": "Role removed successfully"
}
```

---

## 5. Audit Logs

### `GET /api/rbac/audit-logs`

Get audit logs.

**Permission Required:** `audit.read`

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `action` (string, optional): Filter by action
- `resourceType` (string, optional): Filter by resource type
- `userId` (number, optional): Filter by user ID
- `startDate` (string, optional): Start date (ISO format)
- `endDate` (string, optional): End date (ISO format)

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "userId": 1,
        "userName": "Admin User",
        "action": "USER_ROLE_ASSIGNED",
        "resourceType": "user",
        "resourceId": 5,
        "details": {
          "roleId": 2,
          "roleName": "Operations Manager"
        },
        "ipAddress": "127.0.0.1",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Insufficient permissions. Required: role.manage"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid role data",
  "details": [
    {
      "path": ["name"],
      "message": "Required"
    }
  ]
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Role not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to create role"
}
```

---

## Postman Collection

Import the following collection:

```json
{
  "info": {
    "name": "ATA CRM - RBAC API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{auth_token}}",
        "type": "string"
      }
    ]
  },
  "item": [
    {
      "name": "Get Current User",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/api/auth/me",
          "host": ["{{base_url}}"],
          "path": ["api", "auth", "me"]
        }
      }
    },
    {
      "name": "Get All Roles",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/api/rbac/roles",
          "host": ["{{base_url}}"],
          "path": ["api", "rbac", "roles"]
        }
      }
    },
    {
      "name": "Create Role",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"custom_role\",\n  \"displayName\": \"Custom Role\",\n  \"description\": \"Custom role description\",\n  \"permissionIds\": [1, 2, 3]\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/rbac/roles",
          "host": ["{{base_url}}"],
          "path": ["api", "rbac", "roles"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3005"
    },
    {
      "key": "auth_token",
      "value": ""
    }
  ]
}
```

---

## OpenAPI Specification

See `docs/openapi-rbac.yaml` for full OpenAPI 3.0 specification.


