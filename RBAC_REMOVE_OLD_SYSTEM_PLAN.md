# 📋 خطة حذف النظام القديم للصلاحيات

## ✅ التحليل

### النظام القديم (`lib/permissions.ts`) مستخدم في:

#### API Routes (15+ ملف):
1. `app/api/orders/route.ts` - `Permission.VIEW_ORDERS`
2. `app/api/orders/[id]/route.ts` - `Permission.VIEW_ORDERS`
3. `app/api/orders/[id]/stage/route.ts` - `Permission.UPDATE_MANUFACTURING_STAGE`, `Permission.UPDATE_ORDERS`
4. `app/api/orders/[id]/payment/route.ts` - `Permission.VIEW_PAYMENTS`, `Permission.CREATE_PAYMENTS`
5. `app/api/orders/export/route.ts` - `Permission.VIEW_ORDERS`
6. `app/api/tasks/route.ts` - `Permission.CREATE_TASKS`
7. `app/api/tasks/[id]/route.ts` - `Permission.UPDATE_TASKS`
8. `app/api/worklogs/route.ts` - `Permission.VIEW_WORKLOGS`, `Permission.SUBMIT_WORKLOGS`
9. `app/api/worklogs/[id]/approve/route.ts` - `Permission.APPROVE_WORKLOGS`
10. `app/api/overtime/[id]/approve/route.ts` - `Permission.APPROVE_OVERTIME`
11. `app/api/kpi/route.ts` - `Permission.VIEW_KPI`
12. `app/api/kpi/team/route.ts` - `Permission.VIEW_KPI`
13. `app/api/users/route.ts` - يستخدم `Permission` (يحتاج فحص)
14. `app/api/dashboard/analytics/route.ts` - `Permission.VIEW_ORDERS`
15. `app/api/dashboard/calendar/route.ts` - `Permission.VIEW_ORDERS`

#### Components:
1. `components/dashboard/order-details-tabs.tsx` - يستخدم `Permission` enum في عدة أماكن

---

## ✅ الخلاصة

**نعم، يمكن حذف النظام القديم!** 

**الأسباب:**
1. ✅ النظام الجديد يغطي جميع الوظائف
2. ✅ Migration Map موجود للتحويل
3. ✅ `lib/auth-helpers.ts` يدعم النظامين (يمكن تحديثه)
4. ✅ النظام الجديد أفضل (قاعدة بيانات، audit logging، feature flag)

---

## 🔧 خطة التنفيذ

### المرحلة 1: تحديث API Routes

**استبدال:**
```typescript
// القديم
import { Permission } from "@/lib/permissions";
await requirePermission(Permission.VIEW_ORDERS);

// الجديد
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { authorize } from "@/lib/rbac/authorize";
await authorize(PermissionAction.LEAD_READ);
```

**أو استخدام Migration:**
```typescript
import { Permission, migratePermission } from "@/lib/permissions/migration-map";
import { authorize } from "@/lib/rbac/authorize";
await authorize(migratePermission(Permission.VIEW_ORDERS));
```

### المرحلة 2: تحديث Components

**استبدال:**
```typescript
// القديم
import { Permission } from "@/lib/permissions";
checkPermission(Permission.VIEW_ORDERS);

// الجديد
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { useCan } from "@/lib/permissions/frontend-helpers";
const canView = useCan(PermissionAction.LEAD_READ);
```

### المرحلة 3: حذف النظام القديم

بعد تحديث جميع الاستخدامات:
1. حذف `lib/permissions.ts`
2. تحديث `lib/auth-helpers.ts` لإزالة دعم النظام القديم
3. حذف `lib/permissions/migration-map.ts` (بعد التأكد)

---

## ⚠️ تحذيرات

1. **لا تحذف `lib/permissions.ts` قبل تحديث جميع الاستخدامات**
2. **اختبر كل API route بعد التحديث**
3. **اختبر Components بعد التحديث**
4. **احتفظ بـ Migration Map حتى التأكد من عدم الحاجة**

---

## 📝 Checklist

### API Routes:
- [ ] `app/api/orders/route.ts`
- [ ] `app/api/orders/[id]/route.ts`
- [ ] `app/api/orders/[id]/stage/route.ts`
- [ ] `app/api/orders/[id]/payment/route.ts`
- [ ] `app/api/orders/export/route.ts`
- [ ] `app/api/tasks/route.ts`
- [ ] `app/api/tasks/[id]/route.ts`
- [ ] `app/api/worklogs/route.ts`
- [ ] `app/api/worklogs/[id]/approve/route.ts`
- [ ] `app/api/overtime/[id]/approve/route.ts`
- [ ] `app/api/kpi/route.ts`
- [ ] `app/api/kpi/team/route.ts`
- [ ] `app/api/users/route.ts`
- [ ] `app/api/dashboard/analytics/route.ts`
- [ ] `app/api/dashboard/calendar/route.ts`

### Components:
- [ ] `components/dashboard/order-details-tabs.tsx`

### Library Files:
- [ ] `lib/auth-helpers.ts` (إزالة دعم النظام القديم)
- [ ] حذف `lib/permissions.ts`
- [ ] حذف `lib/permissions/migration-map.ts` (اختياري)

---

## 🎯 التوصية

**نعم، احذف النظام القديم** بعد:
1. تحديث جميع API routes
2. تحديث Components
3. الاختبار الشامل
4. التأكد من عدم وجود استخدامات أخرى

**الفائدة:**
- ✅ كود أنظف
- ✅ نظام واحد فقط
- ✅ أسهل في الصيانة
- ✅ أداء أفضل (لا حاجة لـ migration)


