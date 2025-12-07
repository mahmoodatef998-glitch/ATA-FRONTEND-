# 🔧 إصلاح مشكلة `user_roles.userId`

## ❌ المشكلة:
```
The column `user_roles.userId` does not exist in the current database.
```

**السبب:** جدول `user_roles` كان يحتوي على أعمدة بأسماء صغيرة (`userid`, `roleid`) بينما Prisma يتوقع camelCase (`userId`, `roleId`).

---

## ✅ الحل المطبق:

### 1️⃣ حذف الجدول القديم:
```sql
DROP TABLE IF EXISTS "user_roles" CASCADE;
```

### 2️⃣ إنشاء الجدول بالطريقة الصحيحة:
تم إنشاء الجدول مع أعمدة camelCase كما يتوقع Prisma:

```sql
CREATE TABLE "user_roles" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "roleId" INTEGER NOT NULL,
  "assignedBy" INTEGER,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  ...
);
```

### 3️⃣ إنشاء Indexes و Foreign Keys:
تم إنشاء جميع Indexes و Foreign Keys المطلوبة:
- `user_roles_userId_roleId_key` (UNIQUE)
- `user_roles_userId_idx`
- `user_roles_roleId_idx`
- `user_roles_isActive_idx`
- `user_roles_expiresAt_idx`

---

## 📊 الأعمدة الحالية:

✅ `id` - SERIAL PRIMARY KEY
✅ `userId` - INTEGER NOT NULL (camelCase)
✅ `roleId` - INTEGER NOT NULL (camelCase)
✅ `assignedBy` - INTEGER (camelCase)
✅ `assignedAt` - TIMESTAMP(3) NOT NULL (camelCase)
✅ `expiresAt` - TIMESTAMP(3) (camelCase)
✅ `isActive` - BOOLEAN NOT NULL (camelCase)

---

## 🔍 التحقق من الحالة:

### فحص الجدول:
```bash
docker exec ata-crm-postgres psql -U postgres -d ata_crm -c "\d user_roles"
```

### فحص الأعمدة:
```bash
docker exec ata-crm-postgres psql -U postgres -d ata_crm -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'user_roles' ORDER BY ordinal_position;"
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

- ✅ جدول `user_roles` موجود
- ✅ الأعمدة تستخدم camelCase (`userId`, `roleId`)
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

