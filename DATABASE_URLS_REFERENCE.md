# 📋 مرجع Database URLs - Supabase

## 🔗 أنواع Database URLs:

### **1. Direct Connection (للـ Migrations)**
```
postgresql://postgres:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres
```

**الاستخدام:**
- ✅ Prisma Migrations
- ✅ Schema changes
- ✅ Database setup

**المميزات:**
- ✅ أفضل للـ schema changes
- ✅ اتصال مباشر بدون pooling

---

### **2. Transaction Pooler (للـ Production/Vercel)**
```
postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
```

**الاستخدام:**
- ✅ Vercel Production
- ✅ Frontend API Routes
- ✅ High concurrency

**المميزات:**
- ✅ Connection pooling
- ✅ أفضل للـ production workloads
- ✅ Port: 6543

---

### **3. Session Pooler (للـ Scripts)**
```
postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
```

**الاستخدام:**
- ✅ Local Scripts
- ✅ Admin scripts
- ✅ Database queries

**المميزات:**
- ✅ Connection pooling
- ✅ أفضل للـ queries
- ✅ Port: 5432

---

## 📝 استخدام كل نوع:

### **في Vercel Environment Variables:**

```
DATABASE_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres
```

---

### **في Local Scripts (.bat files):**

**للـ Migrations:**
```batch
set DIRECT_URL=postgresql://postgres:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres
```

**للـ Scripts (Admin, Users, etc.):**
```batch
set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
```

---

## ✅ الملفات المحدثة:

- ✅ `RUN_MIGRATIONS.bat` - Direct Connection
- ✅ `TEST_DATABASE_CONNECTION.bat` - Session Pooler
- ✅ `CHECK_ADMIN_EXISTS.bat` - Session Pooler
- ✅ `CREATE_ADMIN.bat` - Session Pooler
- ✅ `CREATE_ADMIN_NOW.bat` - Session Pooler
- ✅ `UPDATE_ADMIN.bat` - Session Pooler
- ✅ `CREATE_USER.bat` - Session Pooler
- ✅ `CHANGE_USER_ROLE.bat` - Session Pooler
- ✅ `CREATE_NEW_ROLE.bat` - Session Pooler
- ✅ `CREATE_ROLE_SIMPLE.bat` - Session Pooler
- ✅ `SETUP_VERCEL_DATABASE.bat` - Direct Connection
- ✅ `VERCEL_ENV_COPY_PASTE.txt` - Transaction Pooler + Direct

---

## 🎯 ملخص:

| الاستخدام | النوع | URL |
|----------|-------|-----|
| **Migrations** | Direct | `postgresql://postgres:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres` |
| **Production** | Transaction Pooler | `postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres` |
| **Scripts** | Session Pooler | `postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres` |

---

**آخر تحديث:** 22 ديسمبر 2025

