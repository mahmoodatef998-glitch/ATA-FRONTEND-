-- Database Indexes for Performance Optimization (Auto-detect version)
-- This script tries both camelCase and snake_case
-- Run this if you're not sure which naming convention is used

-- First, let's check the actual column names
DO $$
DECLARE
    col_name text;
BEGIN
    -- Check orders table
    SELECT column_name INTO col_name
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'orders'
      AND column_name IN ('companyId', 'company_id')
    LIMIT 1;
    
    RAISE NOTICE 'Orders company column: %', col_name;
END $$;

-- Orders indexes (try both)
DO $$
BEGIN
    -- Try camelCase first
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_orders_company_status 
        ON orders("companyId", status);
        RAISE NOTICE 'Created index with camelCase';
    EXCEPTION WHEN OTHERS THEN
        -- Try snake_case
        BEGIN
            CREATE INDEX IF NOT EXISTS idx_orders_company_status 
            ON orders(company_id, status);
            RAISE NOTICE 'Created index with snake_case';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error creating index: %', SQLERRM;
        END;
    END;
END $$;

-- For now, let's use a simpler approach - check existing indexes first
-- Then create only the ones that don't exist

-- Check what indexes already exist
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename = 'orders'
ORDER BY indexname;

