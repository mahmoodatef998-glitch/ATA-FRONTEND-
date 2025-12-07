# تعليمات إعداد نظام RBAC

## الخطوات المطلوبة

### 1. تثبيت Dependencies ✅
تم تثبيت `@radix-ui/react-tooltip` بنجاح.

### 2. إعداد قاعدة البيانات

#### أ. تأكد من تشغيل PostgreSQL
```bash
# تأكد أن قاعدة البيانات تعمل على localhost:5432
```

#### ب. تشغيل Prisma Generate
```bash
npx prisma generate
```

**ملاحظة:** إذا ظهرت رسالة خطأ `EPERM`، أغلق أي برامج تستخدم Prisma (مثل Prisma Studio) وحاول مرة أخرى.

#### ج. تشغيل Migration
```bash
npx prisma migrate dev --name add_rbac_tables
```

هذا سينشئ الجداول التالية:
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`

#### د. Seed البيانات
```bash
npx tsx prisma/seed-rbac.ts
```

هذا سيملأ:
- جميع الصلاحيات (user.create, task.assign, etc.)
- الأدوار النظامية (admin, operation_manager, accountant, hr, supervisor, technician)
- ربط الأدوار بالصلاحيات

### 3. التحقق من التثبيت

#### أ. تحقق من الجداول
```bash
npx prisma studio
```

تحقق من وجود الجداول:
- `roles` - يجب أن يحتوي على 6 أدوار على الأقل
- `permissions` - يجب أن يحتوي على جميع الصلاحيات
- `role_permissions` - يجب أن يحتوي على ربط الأدوار بالصلاحيات

#### ب. تحقق من API Endpoint
افتح المتصفح وانتقل إلى:
```
http://localhost:3005/api/auth/me
```

يجب أن ترى JSON response يحتوي على:
- `permissions` array
- `roles` array

#### ج. تحقق من Admin UI
1. سجل دخول كـ Admin
2. انتقل إلى `/dashboard/rbac`
3. يجب أن ترى:
   - Roles & Permissions tab
   - Audit Logs tab
   - أزرار للانتقال إلى Roles Management و Audit Logs

### 4. اختبار النظام

#### أ. اختبار Permission Checks
```tsx
// في أي component
import { useCan } from "@/lib/permissions/frontend-helpers";
import { PermissionAction } from "@/lib/permissions/role-permissions";

const canDelete = useCan(PermissionAction.USER_DELETE);
console.log("Can delete:", canDelete);
```

#### ب. اختبار Admin UI
1. انتقل إلى `/dashboard/rbac/roles`
2. جرب إنشاء role جديد
3. جرب تعديل role موجود
4. انتقل إلى `/dashboard/rbac/audit` وافحص Audit Logs

### 5. استكشاف الأخطاء

#### مشكلة: Prisma Generate فشل
**الحل:**
- أغلق Prisma Studio إذا كان مفتوحاً
- أغلق أي برامج أخرى تستخدم Prisma
- حاول مرة أخرى

#### مشكلة: Migration فشل
**الحل:**
- تأكد من أن PostgreSQL يعمل
- تحقق من إعدادات الاتصال في `.env`
- تأكد من أن قاعدة البيانات موجودة

#### مشكلة: Permissions لا تظهر
**الحل:**
1. تحقق من أن `/api/auth/me` يعمل
2. تحقق من أن `PermissionsProvider` موجود في `components/providers.tsx`
3. افتح Developer Tools وافحص Network tab
4. تحقق من Console للأخطاء

#### مشكلة: Admin UI لا يفتح
**الحل:**
- تأكد من أن المستخدم لديه `role.manage` permission
- تحقق من أن المستخدم هو Admin
- تحقق من Console للأخطاء

## الملفات المهمة

### Backend
- `lib/rbac/permission-service.ts` - خدمة الصلاحيات
- `lib/rbac/authorize.ts` - Authorization middleware
- `app/api/rbac/roles/route.ts` - Roles API
- `app/api/auth/me/route.ts` - Get user permissions

### Frontend
- `contexts/permissions-context.tsx` - Permissions Context
- `lib/permissions/frontend-helpers.ts` - Helper functions
- `components/permissions/permission-button.tsx` - Permission button
- `app/(dashboard)/dashboard/rbac/roles/page.tsx` - Roles management

### Database
- `prisma/schema.prisma` - Database schema
- `prisma/seed-rbac.ts` - Seed script

## الخطوات التالية بعد التثبيت

1. **اختبار الصلاحيات:**
   - سجل دخول كـ Admin وتحقق من جميع الصلاحيات
   - سجل دخول كـ Operations Manager وتحقق من الصلاحيات المحددة
   - سجل دخول كـ Technician وتحقق من الصلاحيات المحدودة

2. **تطبيق الصلاحيات في الكود:**
   - استبدل `requireRole()` بـ `authorize()` في API routes
   - استخدم `PermissionButton` و `PermissionGuard` في Components
   - أضف permission checks في جميع الأماكن الحرجة

3. **مراجعة Audit Logs:**
   - تحقق من أن Audit Logs يتم تسجيلها بشكل صحيح
   - اختبر Audit Logs viewer

## الدعم

إذا واجهت أي مشاكل:
1. راجع `docs/RBAC_BACKEND_IMPLEMENTATION.md`
2. راجع `docs/RBAC_FRONTEND_IMPLEMENTATION.md`
3. راجع `README_RBAC.md` و `README_RBAC_FRONTEND.md`
4. تحقق من Console و Network tabs في Developer Tools


