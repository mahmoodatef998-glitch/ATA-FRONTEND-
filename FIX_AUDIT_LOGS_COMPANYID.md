# 🔧 إصلاح مشكلة `audit_logs.companyId`

## ❌ المشكلة:
```
The column `audit_logs.companyId` does not exist in the current database.
```

**السبب:** جدول `audit_logs` كان يحتوي على أعمدة بأسماء صغيرة (`companyid`, `userid`) بينما Prisma يتوقع camelCase (`companyId`, `userId`).

---

## ✅ الحل المطبق:

### 1️⃣ حذف الجدول القديم:
```sql
DROP TABLE IF EXISTS audit_logs CASCADE;
```

### 2️⃣ إنشاء الجدول بالطريقة الصحيحة:
تم إنشاء الجدول مع أعمدة camelCase كما يتوقع Prisma:

```sql
CREATE TABLE "audit_logs" (
  "id" SERIAL PRIMARY KEY,
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
  ...
);
```

### 3️⃣ إنشاء Indexes:
تم إنشاء جميع Indexes المطلوبة:
- `audit_logs_companyId_idx`
- `audit_logs_userId_idx`
- `audit_logs_action_idx`
- `audit_logs_resource_idx`
- `audit_logs_resourceId_idx`
- `audit_logs_createdAt_idx`
- `audit_logs_userRole_idx`

---

## 📊 الأعمدة الحالية:

✅ `id` - SERIAL PRIMARY KEY
✅ `companyId` - INTEGER NOT NULL (camelCase)
✅ `userId` - INTEGER (camelCase)
✅ `userName` - TEXT (camelCase)
✅ `userRole` - TEXT (camelCase)
✅ `action` - TEXT NOT NULL
✅ `resource` - TEXT NOT NULL
✅ `resourceId` - INTEGER (camelCase)
✅ `details` - JSONB
✅ `ipAddress` - TEXT (camelCase)
✅ `userAgent` - TEXT (camelCase)
✅ `createdAt` - TIMESTAMP(3) NOT NULL

---

## 🔍 التحقق من الحالة:

### فحص الجدول:
```bash
docker exec ata-crm-postgres psql -U postgres -d ata_crm -c "\d audit_logs"
```

### فحص الأعمدة:
```bash
docker exec ata-crm-postgres psql -U postgres -d ata_crm -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'audit_logs' ORDER BY ordinal_position;"
```

---

## 🚀 الخطوات التالية:

### 1. إغلاق Next.js Server (إن كان يعمل):
```bash
# اضغط Ctrl+C في Terminal الذي يعمل فيه Server
```

### 2. توليد Prisma Client:
```bash
npx prisma generate
```

### 3. إعادة تشغيل Next.js Server:
```bash
npm run dev
```

---

## ⚠️ ملاحظات مهمة:

1. **PostgreSQL يحول الأسماء إلى صغيرة تلقائياً** ما لم تستخدم علامات اقتباس
2. **Prisma يتوقع camelCase** للأعمدة في Schema
3. **يجب استخدام علامات اقتباس** عند إنشاء الجداول في PostgreSQL للحفاظ على camelCase

---

## ✅ بعد الإصلاح:

- ✅ جدول `audit_logs` موجود
- ✅ الأعمدة تستخدم camelCase (`companyId`, `userId`)
- ✅ جميع Indexes موجودة
- ✅ Foreign Keys موجودة
- ✅ جاهز لتشغيل Next.js Server

---

## 🔍 إذا استمرت المشكلة:

### 1. تحقق من Prisma Client:
```bash
npx prisma generate
```

### 2. تحقق من Schema:
```bash
npx prisma db pull
```

### 3. أعد تشغيل Server:
```bash
npm run dev
```

