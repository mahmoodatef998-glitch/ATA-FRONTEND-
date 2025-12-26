-- Fix Row Level Security (RLS) Policies before schema push
-- This will drop policies that depend on auth_id column

-- Drop all policies that depend on auth_id
DO $$ 
BEGIN
    -- Drop policy: users_self
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'users_self'
    ) THEN
        DROP POLICY IF EXISTS "users_self" ON "users";
        RAISE NOTICE 'Dropped policy users_self';
    END IF;
    
    -- Drop policy: orders_company
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'orders' 
        AND policyname = 'orders_company'
    ) THEN
        DROP POLICY IF EXISTS "orders_company" ON "orders";
        RAISE NOTICE 'Dropped policy orders_company';
    END IF;
    
    -- Drop policy: quotations_company
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'quotations' 
        AND policyname = 'quotations_company'
    ) THEN
        DROP POLICY IF EXISTS "quotations_company" ON "quotations";
        RAISE NOTICE 'Dropped policy quotations_company';
    END IF;
    
    -- Drop policy: order_histories_company
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'order_histories' 
        AND policyname = 'order_histories_company'
    ) THEN
        DROP POLICY IF EXISTS "order_histories_company" ON "order_histories";
        RAISE NOTICE 'Dropped policy order_histories_company';
    END IF;
    
    -- Drop policy: notifications_user
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'notifications' 
        AND policyname = 'notifications_user'
    ) THEN
        DROP POLICY IF EXISTS "notifications_user" ON "notifications";
        RAISE NOTICE 'Dropped policy notifications_user';
    END IF;
    
    -- Drop policy: roles_company
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'roles' 
        AND policyname = 'roles_company'
    ) THEN
        DROP POLICY IF EXISTS "roles_company" ON "roles";
        RAISE NOTICE 'Dropped policy roles_company';
    END IF;
    
    -- Drop policy: role_permissions_company
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'role_permissions' 
        AND policyname = 'role_permissions_company'
    ) THEN
        DROP POLICY IF EXISTS "role_permissions_company" ON "role_permissions";
        RAISE NOTICE 'Dropped policy role_permissions_company';
    END IF;
    
    -- Drop policy: user_roles_access
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_roles' 
        AND policyname = 'user_roles_access'
    ) THEN
        DROP POLICY IF EXISTS "user_roles_access" ON "user_roles";
        RAISE NOTICE 'Dropped policy user_roles_access';
    END IF;
END $$;

-- Drop constraint if it exists
DO $$ 
BEGIN
    -- Drop the constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_auth_id_key'
    ) THEN
        ALTER TABLE "users" DROP CONSTRAINT "users_auth_id_key";
        RAISE NOTICE 'Dropped constraint users_auth_id_key';
    END IF;
    
    -- Drop the index if it exists (as a standalone index)
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'users_auth_id_key'
    ) THEN
        DROP INDEX IF EXISTS "users_auth_id_key";
        RAISE NOTICE 'Dropped index users_auth_id_key';
    END IF;
END $$;

-- Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "userId" INTEGER,
    "userName" TEXT,
    "userRole" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" INTEGER,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Create indexes for audit_logs if they don't exist
CREATE INDEX IF NOT EXISTS "audit_logs_companyId_idx" ON "audit_logs"("companyId");
CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "audit_logs_resource_idx" ON "audit_logs"("resource");
CREATE INDEX IF NOT EXISTS "audit_logs_resourceId_idx" ON "audit_logs"("resourceId");
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "audit_logs_userRole_idx" ON "audit_logs"("userRole");

-- Add foreign key constraints for audit_logs
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'audit_logs_companyId_fkey'
    ) THEN
        ALTER TABLE "audit_logs" 
        ADD CONSTRAINT "audit_logs_companyId_fkey" 
        FOREIGN KEY ("companyId") 
        REFERENCES "companies"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'audit_logs_userId_fkey'
    ) THEN
        ALTER TABLE "audit_logs" 
        ADD CONSTRAINT "audit_logs_userId_fkey" 
        FOREIGN KEY ("userId") 
        REFERENCES "users"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
    END IF;
END $$;

