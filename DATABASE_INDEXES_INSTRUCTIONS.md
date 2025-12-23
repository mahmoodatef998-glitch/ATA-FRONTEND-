# 📋 تعليمات تنفيذ Database Indexes

**التاريخ:** 22 ديسمبر 2025  
**المشكلة:** `ERROR: 42703: column "company_id" does not exist`

---

## 🔍 المشكلة

Prisma قد يستخدم إما:
- **camelCase:** `companyId`, `userId`, `clientId`
- **snake_case:** `company_id`, `user_id`, `client_id`

---

## ✅ الحل

### الخطوة 1: تحقق من أسماء الأعمدة

**افتح Supabase SQL Editor وانسخ:**

```sql
-- Check actual column names
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'orders'
  AND column_name LIKE '%company%'
ORDER BY column_name;
```

**النتيجة ستكون:**
- إما `companyId` (camelCase)
- أو `company_id` (snake_case)

---

### الخطوة 2: استخدم SQL Script المناسب

#### إذا كانت الأعمدة camelCase:
```
استخدم: DATABASE_INDEXES_FIXED.sql
```

#### إذا كانت الأعمدة snake_case:
```
استخدم: DATABASE_INDEXES_SNAKE_CASE.sql
```

---

## 🚀 الطريقة السريعة

### 1. تحقق من أسماء الأعمدة:
```sql
-- Run this first
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('orders', 'tasks', 'notifications', 'users')
  AND column_name LIKE '%company%' OR column_name LIKE '%user%'
ORDER BY table_name, column_name;
```

### 2. استخدم SQL Script المناسب:

#### Option A: camelCase (إذا كانت `companyId`)
```sql
-- Use DATABASE_INDEXES_FIXED.sql
CREATE INDEX IF NOT EXISTS idx_orders_company_status 
ON orders("companyId", status);
```

#### Option B: snake_case (إذا كانت `company_id`)
```sql
-- Use DATABASE_INDEXES_SNAKE_CASE.sql
CREATE INDEX IF NOT EXISTS idx_orders_company_status 
ON orders(company_id, status);
```

---

## 📝 الملفات المتاحة

1. **`CHECK_COLUMN_NAMES.sql`** - للتحقق من أسماء الأعمدة
2. **`DATABASE_INDEXES_FIXED.sql`** - للـ camelCase (`companyId`)
3. **`DATABASE_INDEXES_SNAKE_CASE.sql`** - للـ snake_case (`company_id`)
4. **`DATABASE_INDEXES_AUTO.sql`** - يحاول كلا النوعين

---

## 🔧 الحل السريع

### إذا كنت غير متأكد، استخدم هذا:

```sql
-- Try camelCase first (with quotes)
DO $$
BEGIN
    CREATE INDEX IF NOT EXISTS idx_orders_company_status 
    ON orders("companyId", status);
EXCEPTION WHEN OTHERS THEN
    -- If fails, try snake_case
    CREATE INDEX IF NOT EXISTS idx_orders_company_status 
    ON orders(company_id, status);
END $$;
```

---

## ✅ بعد التنفيذ

### تحقق من النتيجة:
```sql
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('orders', 'tasks', 'notifications', 'users')
ORDER BY tablename, indexname;
```

---

**آخر تحديث:** 22 ديسمبر 2025  
**الحالة:** ✅ جاهز للتنفيذ

