# 🔧 إصلاح مشكلة جدول `user_roles`

## ❌ المشكلة:
```
Invalid `prisma.users.findUnique()` invocation:
The table `public.user_roles` does not exist in the current database.
```

**السبب:** Migration `add_rbac_tables` لم تطبق بشكل صحيح على قاعدة البيانات.

---

## ✅ الحل المطبق:

### 1️⃣ تطبيق Migration يدوياً:

تم تطبيق migration `add_rbac_tables` يدوياً على قاعدة البيانات:

```sql
-- تم إنشاء الجداول التالية:
- roles
- permissions
- role_permissions
- user_roles
```

### 2️⃣ تسجيل Migration في Prisma:

```bash
npx prisma migrate resolve --applied add_rbac_tables
```

---

## 📊 الجداول المنشأة:

### ✅ `user_roles`
- **الأعمدة:** `id`, `userId`, `roleId`, `assignedBy`, `assignedAt`, `expiresAt`, `isActive`
- **الوظيفة:** ربط المستخدمين بالأدوار

### ✅ `roles`
- **الأعمدة:** `id`, `name`, `displayName`, `description`, `isSystem`, `companyId`, `createdAt`, `updatedAt`
- **الوظيفة:** تخزين الأدوار

### ✅ `permissions`
- **الأعمدة:** `id`, `name`, `displayName`, `description`, `category`, `resource`, `action`, `createdAt`, `updatedAt`
- **الوظيفة:** تخزين الصلاحيات

### ✅ `role_permissions`
- **الأعمدة:** `id`, `roleId`, `permissionId`, `createdAt`
- **الوظيفة:** ربط الأدوار بالصلاحيات

---

## 🔍 التحقق من الحالة:

### فحص الجداول:
```bash
docker exec ata-crm-postgres psql -U postgres -d ata_crm -c "\dt" | findstr "user_roles|roles|permissions"
```

### فحص جدول محدد:
```bash
docker exec ata-crm-postgres psql -U postgres -d ata_crm -c "\d user_roles"
```

---

## 🚀 الخطوات التالية:

### 1. إعادة تشغيل Next.js Server:
```bash
npm run dev
```

### 2. التحقق من عمل النظام:
- يجب أن يعمل بدون أخطاء
- يجب أن يعمل نظام RBAC بشكل صحيح

---

## ⚠️ ملاحظات:

1. **Migration تم تطبيقه يدوياً** لأن Prisma كان يحتاج baseline
2. **تم تسجيل Migration** في Prisma لتجنب تكرار التطبيق
3. **جميع الجداول موجودة** وجاهزة للاستخدام

---

## ✅ بعد الإصلاح:

- ✅ جدول `user_roles` موجود
- ✅ جميع جداول RBAC موجودة
- ✅ Migration مسجل في Prisma
- ✅ جاهز لتشغيل Next.js Server

---

## 🔍 إذا استمرت المشكلة:

### 1. تحقق من Prisma Client:
```bash
npx prisma generate
```

### 2. تحقق من الاتصال:
```bash
npx prisma db pull
```

### 3. أعد تشغيل Server:
```bash
npm run dev
```

