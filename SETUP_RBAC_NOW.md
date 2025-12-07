# 🚀 إعداد نظام RBAC - خطوات فورية

## ⚠️ متطلبات قبل البدء:

### 1. إغلاق Development Server
**مهم جداً:** يجب إغلاق أي development server يعمل حالياً (Ctrl+C في Terminal)

### 2. تشغيل PostgreSQL
تأكد من أن PostgreSQL يعمل على `localhost:5432`

---

## 📋 خطوات التنفيذ (بالترتيب):

### الخطوة 1: إغلاق Development Server
```bash
# إذا كان هناك server يعمل، اضغط Ctrl+C لإغلاقه
```

### الخطوة 2: تشغيل Prisma Generate
```bash
npx prisma generate
```

**إذا ظهر خطأ EPERM:**
- أغلق Prisma Studio إذا كان مفتوحاً
- أغلق أي برامج أخرى تستخدم Prisma
- حاول مرة أخرى

### الخطوة 3: تشغيل Migration
```bash
npx prisma migrate dev --name add_rbac_tables
```

**إذا ظهر خطأ "Can't reach database server":**
- تأكد من أن PostgreSQL يعمل
- تحقق من إعدادات `.env` (DATABASE_URL)
- حاول تشغيل PostgreSQL من Services (Windows) أو من Terminal

### الخطوة 4: Seed البيانات
```bash
npm run prisma:seed:rbac
```

أو:
```bash
npx tsx prisma/seed-rbac.ts
```

---

## ✅ التحقق من النجاح:

### 1. تحقق من الجداول
```bash
npx prisma studio
```

يجب أن ترى الجداول التالية:
- ✅ `roles` - 6 أدوار على الأقل
- ✅ `permissions` - جميع الصلاحيات
- ✅ `role_permissions` - ربط الأدوار بالصلاحيات
- ✅ `user_roles` - فارغ (سيتم ملؤه لاحقاً)

### 2. تحقق من API
بعد تشغيل development server:
```
http://localhost:3005/api/auth/me
```

يجب أن ترى:
```json
{
  "success": true,
  "data": {
    "permissions": ["user.create", "user.read", ...],
    "roles": [...]
  }
}
```

### 3. تحقق من Admin UI
1. سجل دخول كـ Admin
2. انتقل إلى `/dashboard/rbac`
3. يجب أن ترى Roles & Permissions

---

## 🔧 استكشاف الأخطاء:

### خطأ: EPERM في Prisma Generate
**الحل:**
1. أغلق development server
2. أغلق Prisma Studio
3. حاول مرة أخرى

### خطأ: Can't reach database server
**الحل:**
1. تحقق من أن PostgreSQL يعمل:
   ```bash
   # Windows
   # افتح Services وابحث عن "postgresql"
   # أو
   # افتح Command Prompt كـ Administrator
   net start postgresql-x64-XX  # استبدل XX برقم الإصدار
   ```

2. تحقق من `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/ata_crm?schema=public"
   ```

### خطأ: Migration فشل
**الحل:**
- تأكد من أن قاعدة البيانات موجودة
- تحقق من الصلاحيات
- حاول حذف migration folder وإعادة المحاولة

---

## 📝 ملاحظات مهمة:

1. **لا تشغل development server** أثناء تنفيذ migrations
2. **تأكد من backup** قاعدة البيانات قبل Migration (اختياري)
3. **بعد Migration**، أعد تشغيل development server
4. **Permissions** ستُحمّل تلقائياً بعد login

---

## 🎯 بعد الإعداد:

1. ✅ أعد تشغيل development server
2. ✅ سجل دخول كـ Admin
3. ✅ انتقل إلى `/dashboard/rbac`
4. ✅ اختبر النظام

---

## 📞 الدعم:

إذا استمرت المشاكل:
1. راجع `RBAC_SETUP_INSTRUCTIONS.md`
2. تحقق من Console للأخطاء
3. تحقق من Database connection


