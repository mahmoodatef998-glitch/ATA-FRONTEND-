-- Database Indexes for Performance Optimization
-- Run this in Supabase SQL Editor to improve query performance
-- Fixed: Uses correct column names (camelCase as Prisma uses)

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_company_status 
ON orders("companyId", status);

CREATE INDEX IF NOT EXISTS idx_orders_company_stage 
ON orders("companyId", stage);

CREATE INDEX IF NOT EXISTS idx_orders_client_id 
ON orders("clientId");

CREATE INDEX IF NOT EXISTS idx_orders_created_at 
ON orders("createdAt" DESC);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_company_status 
ON tasks("companyId", status);

CREATE INDEX IF NOT EXISTS idx_tasks_company_created 
ON tasks("companyId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to 
ON tasks("assignedToId");

CREATE INDEX IF NOT EXISTS idx_tasks_status 
ON tasks(status);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON notifications("userId", read);

CREATE INDEX IF NOT EXISTS idx_notifications_company_read 
ON notifications("companyId", read);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON notifications("createdAt" DESC);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_company_role 
ON users("companyId", role);

CREATE INDEX IF NOT EXISTS idx_users_account_status 
ON users("accountStatus");

CREATE INDEX IF NOT EXISTS idx_users_email 
ON users(email);

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_account_status 
ON clients("accountStatus");

CREATE INDEX IF NOT EXISTS idx_clients_phone 
ON clients(phone);

-- Quotations indexes
CREATE INDEX IF NOT EXISTS idx_quotations_order_id 
ON quotations("orderId");

CREATE INDEX IF NOT EXISTS idx_quotations_accepted 
ON quotations(accepted);

-- Order histories indexes
CREATE INDEX IF NOT EXISTS idx_order_histories_order_id 
ON order_histories("orderId");

CREATE INDEX IF NOT EXISTS idx_order_histories_created_at 
ON order_histories("createdAt" DESC);

-- Purchase orders indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_id 
ON purchase_orders("orderId");

-- Delivery notes indexes
CREATE INDEX IF NOT EXISTS idx_delivery_notes_order_id 
ON delivery_notes("orderId");

-- Work logs indexes
CREATE INDEX IF NOT EXISTS idx_work_logs_task_id 
ON work_logs("taskId");

CREATE INDEX IF NOT EXISTS idx_work_logs_user_id 
ON work_logs("userId");

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('orders', 'tasks', 'notifications', 'users', 'clients', 'quotations', 'order_histories', 'purchase_orders', 'delivery_notes', 'work_logs')
ORDER BY tablename, indexname;


