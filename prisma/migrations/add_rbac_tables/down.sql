-- Drop RBAC Tables (Down Migration)

-- Drop Foreign Keys first
ALTER TABLE "user_roles" DROP CONSTRAINT IF EXISTS "user_roles_assignedBy_fkey";
ALTER TABLE "user_roles" DROP CONSTRAINT IF EXISTS "user_roles_roleId_fkey";
ALTER TABLE "user_roles" DROP CONSTRAINT IF EXISTS "user_roles_userId_fkey";
ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "role_permissions_permissionId_fkey";
ALTER TABLE "role_permissions" DROP CONSTRAINT IF EXISTS "role_permissions_roleId_fkey";
ALTER TABLE "roles" DROP CONSTRAINT IF EXISTS "roles_companyId_fkey";

-- Drop Tables
DROP TABLE IF EXISTS "user_roles";
DROP TABLE IF EXISTS "role_permissions";
DROP TABLE IF EXISTS "permissions";
DROP TABLE IF EXISTS "roles";


