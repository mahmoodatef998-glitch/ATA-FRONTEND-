-- Database Indexes for Performance Optimization
-- Run this in Supabase SQL Editor to improve query performance

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_company_status 
ON orders(company_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_company_stage 
ON orders(company_id, stage);

CREATE INDEX IF NOT EXISTS idx_orders_client_id 
ON orders(client_id);

CREATE INDEX IF NOT EXISTS idx_orders_created_at 
ON orders(created_at DESC);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_company_status 
ON tasks(company_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_company_created 
ON tasks(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to 
ON tasks(assigned_to_id);

CREATE INDEX IF NOT EXISTS idx_tasks_status 
ON tasks(status);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON notifications(user_id, read);

CREATE INDEX IF NOT EXISTS idx_notifications_company_read 
ON notifications(company_id, read);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON notifications(created_at DESC);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_company_role 
ON users(company_id, role);

CREATE INDEX IF NOT EXISTS idx_users_account_status 
ON users(account_status);

CREATE INDEX IF NOT EXISTS idx_users_email 
ON users(email);

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_account_status 
ON clients(account_status);

CREATE INDEX IF NOT EXISTS idx_clients_phone 
ON clients(phone);

-- Quotations indexes
CREATE INDEX IF NOT EXISTS idx_quotations_order_id 
ON quotations(order_id);

CREATE INDEX IF NOT EXISTS idx_quotations_accepted 
ON quotations(accepted);

-- Order histories indexes
CREATE INDEX IF NOT EXISTS idx_order_histories_order_id 
ON order_histories(order_id);

CREATE INDEX IF NOT EXISTS idx_order_histories_created_at 
ON order_histories(created_at DESC);

-- Purchase orders indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_id 
ON purchase_orders(order_id);

-- Delivery notes indexes
CREATE INDEX IF NOT EXISTS idx_delivery_notes_order_id 
ON delivery_notes(order_id);

-- Work logs indexes
CREATE INDEX IF NOT EXISTS idx_work_logs_task_id 
ON work_logs(task_id);

CREATE INDEX IF NOT EXISTS idx_work_logs_user_id 
ON work_logs(user_id);

-- Attendance indexes (already exist, but listed for reference)
-- idx_attendance_user_id
-- idx_attendance_company_id
-- idx_attendance_date
-- idx_attendance_user_id_date
-- idx_attendance_company_id_date

-- Verify indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('orders', 'tasks', 'notifications', 'users', 'clients', 'quotations', 'order_histories')
ORDER BY tablename, indexname;

