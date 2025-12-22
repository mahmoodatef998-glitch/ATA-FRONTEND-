-- Fix database constraints before schema push
-- This will remove problematic constraints that prevent db push

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

