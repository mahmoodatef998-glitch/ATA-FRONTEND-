# 🔧 إصلاح مشكلة Prisma Environment Variables

## ❌ المشكلة:
```
Error: Schema engine error:
FATAL: Tenant or user not found
```

**المشكلة:** Prisma يقرأ Database URL من ملف `.env` أو `schema.prisma` وليس من Environment Variable

---

## ✅ الحل:

### **الخطوة 1: تحقق من ملف `.env`**

**إذا كان موجوداً:**
1. افتح `.env`
2. ابحث عن `DATABASE_URL`
3. حدثه بالـ URL الصحيح:
   ```
   DATABASE_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

---

### **الخطوة 2: تحقق من `schema.prisma`**

**في `prisma/schema.prisma`:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**يجب أن يكون `env("DATABASE_URL")` - لا URL مباشر**

---

### **الخطوة 3: شغّل Migrations مع Environment Variable**

**الملفات محدثة الآن لاستخدام `DATABASE_URL`:**

```bash
RUN_MIGRATIONS.bat
```

**الآن يستخدم:**
- `DIRECT_URL` → يضعه في `DATABASE_URL`
- Prisma يقرأ من `DATABASE_URL`

---

## 🎯 خطوات سريعة:

### **1. حدث `.env` (إذا موجود):**
```
DATABASE_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### **2. شغّل Migrations:**
```bash
RUN_MIGRATIONS.bat
```

---

## ⚠️ ملاحظات مهمة:

### **1. Prisma يقرأ من:**
1. Environment Variable `DATABASE_URL`
2. ملف `.env` في root
3. `schema.prisma` (إذا كان URL مباشر)

**الأولوية:** Environment Variable > `.env` > `schema.prisma`

---

### **2. Pooler vs Direct:**

**للـ Migrations:**
- Pooler Connection: `aws-1-ap-southeast-1.pooler.supabase.com:6543`
- Direct Connection: `db.xvpjqmftyqipyqomnkgm.supabase.co:5432`

**للـ Migrations: Direct Connection أفضل**

---

## 🎯 جرب الآن:

```bash
RUN_MIGRATIONS.bat
```

**إذا فشل، جرب Direct Connection:**

**في `RUN_MIGRATIONS.bat`:**
```batch
set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres
```

---

**آخر تحديث:** 22 ديسمبر 2025

