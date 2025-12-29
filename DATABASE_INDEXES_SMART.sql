-- Smart Database Indexes Script
-- Automatically detects column naming convention and creates indexes
-- Run this in Supabase SQL Editor

-- Function to create index with correct column names
DO $$
DECLARE
    company_col text;
    user_col text;
    client_col text;
    order_col text;
    task_col text;
    created_at_col text;
BEGIN
    -- Detect column names for orders table
    SELECT column_name INTO company_col
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'orders'
      AND column_name IN ('companyId', 'company_id')
    LIMIT 1;
    
    SELECT column_name INTO client_col
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'orders'
      AND column_name IN ('clientId', 'client_id')
    LIMIT 1;
    
    SELECT column_name INTO created_at_col
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'orders'
      AND column_name IN ('createdAt', 'created_at')
    LIMIT 1;
    
    RAISE NOTICE 'Detected columns - company: %, client: %, created_at: %', company_col, client_col, created_at_col;
    
    -- Create orders indexes
    IF company_col IS NOT NULL THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_orders_company_status ON orders(%I, status)', company_col);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_orders_company_stage ON orders(%I, stage)', company_col);
    END IF;
    
    IF client_col IS NOT NULL THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(%I)', client_col);
    END IF;
    
    IF created_at_col IS NOT NULL THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(%I DESC)', created_at_col);
    END IF;
    
    -- Detect for tasks table
    SELECT column_name INTO company_col
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'tasks'
      AND column_name IN ('companyId', 'company_id')
    LIMIT 1;
    
    SELECT column_name INTO created_at_col
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'tasks'
      AND column_name IN ('createdAt', 'created_at')
    LIMIT 1;
    
    SELECT column_name INTO task_col
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'tasks'
      AND column_name IN ('assignedToId', 'assigned_to_id')
    LIMIT 1;
    
    -- Create tasks indexes
    IF company_col IS NOT NULL THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_tasks_company_status ON tasks(%I, status)', company_col);
        IF created_at_col IS NOT NULL THEN
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_tasks_company_created ON tasks(%I, %I DESC)', company_col, created_at_col);
        END IF;
    END IF;
    
    IF task_col IS NOT NULL THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(%I)', task_col);
    END IF;
    
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    
    -- Detect for notifications table
    SELECT column_name INTO company_col
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'notifications'
      AND column_name IN ('companyId', 'company_id')
    LIMIT 1;
    
    SELECT column_name INTO user_col
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'notifications'
      AND column_name IN ('userId', 'user_id')
    LIMIT 1;
    
    SELECT column_name INTO created_at_col
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'notifications'
      AND column_name IN ('createdAt', 'created_at')
    LIMIT 1;
    
    -- Create notifications indexes
    IF user_col IS NOT NULL THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(%I, read)', user_col);
    END IF;
    
    IF company_col IS NOT NULL THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_notifications_company_read ON notifications(%I, read)', company_col);
    END IF;
    
    IF created_at_col IS NOT NULL THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(%I DESC)', created_at_col);
    END IF;
    
    -- Detect for users table
    SELECT column_name INTO company_col
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'users'
      AND column_name IN ('companyId', 'company_id')
    LIMIT 1;
    
    -- Create users indexes
    IF company_col IS NOT NULL THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_users_company_role ON users(%I, role)', company_col);
    END IF;
    
    -- Users accountStatus (check both naming conventions)
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_users_account_status ON users("accountStatus");
    EXCEPTION WHEN OTHERS THEN
        CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
    END;
    
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    
    -- Clients indexes (check both naming conventions)
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_clients_account_status ON clients("accountStatus");
    EXCEPTION WHEN OTHERS THEN
        CREATE INDEX IF NOT EXISTS idx_clients_account_status ON clients(account_status);
    END;
    
    CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
    
    -- ✅ Performance: Indexes for fast search in clients
    CREATE INDEX IF NOT EXISTS idx_clients_name_search ON clients USING gin(to_tsvector('english', "name"));
    CREATE INDEX IF NOT EXISTS idx_clients_email_search ON clients("email");
    
    -- ✅ Performance: Indexes for orders search optimization
    IF company_col IS NOT NULL AND created_at_col IS NOT NULL THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_orders_company_created ON orders(%I, %I DESC)', company_col, created_at_col);
    END IF;
    
    IF company_col IS NOT NULL THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_orders_company_status_stage ON orders(%I, status, stage)', company_col);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_orders_company_client_created ON orders(%I, %I, %I DESC)', company_col, client_col, created_at_col);
    END IF;
    
    -- Quotations indexes
    SELECT column_name INTO order_col
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'quotations'
      AND column_name IN ('orderId', 'order_id')
    LIMIT 1;
    
    IF order_col IS NOT NULL THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_quotations_order_id ON quotations(%I)', order_col);
    END IF;
    
    CREATE INDEX IF NOT EXISTS idx_quotations_accepted ON quotations(accepted);
    
    -- Order histories indexes
    SELECT column_name INTO order_col
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'order_histories'
      AND column_name IN ('orderId', 'order_id')
    LIMIT 1;
    
    SELECT column_name INTO created_at_col
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'order_histories'
      AND column_name IN ('createdAt', 'created_at')
    LIMIT 1;
    
    IF order_col IS NOT NULL THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_order_histories_order_id ON order_histories(%I)', order_col);
    END IF;
    
    IF created_at_col IS NOT NULL THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_order_histories_created_at ON order_histories(%I DESC)', created_at_col);
    END IF;
    
    -- Purchase orders indexes
    SELECT column_name INTO order_col
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'purchase_orders'
      AND column_name IN ('orderId', 'order_id')
    LIMIT 1;
    
    IF order_col IS NOT NULL THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_id ON purchase_orders(%I)', order_col);
    END IF;
    
    -- ✅ Performance: Index for PO number search
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON purchase_orders("poNumber");
    EXCEPTION WHEN OTHERS THEN
        CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON purchase_orders(po_number);
    END;
    
    -- Delivery notes indexes
    SELECT column_name INTO order_col
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'delivery_notes'
      AND column_name IN ('orderId', 'order_id')
    LIMIT 1;
    
    IF order_col IS NOT NULL THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_delivery_notes_order_id ON delivery_notes(%I)', order_col);
    END IF;
    
    -- ✅ Performance: Index for DN number search
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_delivery_notes_dn_number ON delivery_notes("dnNumber");
    EXCEPTION WHEN OTHERS THEN
        CREATE INDEX IF NOT EXISTS idx_delivery_notes_dn_number ON delivery_notes(dn_number);
    END;
    
    -- Work logs indexes
    SELECT column_name INTO task_col
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'work_logs'
      AND column_name IN ('taskId', 'task_id')
    LIMIT 1;
    
    SELECT column_name INTO user_col
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'work_logs'
      AND column_name IN ('userId', 'user_id')
    LIMIT 1;
    
    IF task_col IS NOT NULL THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_work_logs_task_id ON work_logs(%I)', task_col);
    END IF;
    
    IF user_col IS NOT NULL THEN
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_work_logs_user_id ON work_logs(%I)', user_col);
    END IF;
    
    RAISE NOTICE 'All indexes created successfully!';
END $$;

-- Verify indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('orders', 'tasks', 'notifications', 'users', 'clients', 'quotations', 'order_histories', 'purchase_orders', 'delivery_notes', 'work_logs')
ORDER BY tablename, indexname;

