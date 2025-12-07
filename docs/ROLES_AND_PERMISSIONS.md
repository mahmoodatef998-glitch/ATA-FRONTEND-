# نظام الأدوار والصلاحيات - Our Team Module

## نظرة عامة

تم تنفيذ نظام شامل للأدوار والصلاحيات داخل قسم "Our Team" يتحكم في الوصول إلى الوظائف المختلفة بناءً على دور المستخدم.

## الأدوار المتاحة (5 أدوار)

### 1. HR (موارد بشرية)
**الوصول الكامل في قسم Our Team فقط**

**الصلاحيات:**
- ✅ إنشاء، قراءة، تحديث، حذف أعضاء الفريق
- ✅ تعيين الأدوار للمستخدمين (ما عدا Admin)
- ✅ عرض وإدارة حضور جميع المستخدمين
- ✅ عرض وإدارة مهام جميع المستخدمين
- ❌ لا يمكن الوصول إلى الأقسام الأخرى خارج Our Team

### 2. Operations Manager (مدير العمليات)
**نفس صلاحيات HR**

**الصلاحيات:**
- ✅ إنشاء، قراءة، تحديث، حذف أعضاء الفريق
- ✅ تعيين الأدوار للمستخدمين (ما عدا Admin)
- ✅ عرض وإدارة حضور جميع المستخدمين
- ✅ عرض وإدارة مهام جميع المستخدمين
- ❌ لا يمكن الوصول إلى الأقسام الأخرى خارج Our Team

### 3. Supervisor (مشرف)
**إدارة محدودة للمهام**

**الصلاحيات:**
- ✅ إنشاء مهام للفنيين فقط
- ✅ تحديد المهام كمكتملة عند انتهاء الفني
- ✅ عرض مهام اليوم وتاريخ المهام
- ✅ عرض ملخص حضور الفنيين (قراءة فقط)
- ❌ لا يمكن تعديل أو حذف أعضاء الفريق
- ❌ لا يمكن تعيين الأدوار
- ❌ لا يمكن تعديل الحضور
- ❌ لا يمكن الوصول إلى الأقسام الأخرى

### 4. Technician (فني)
**دور أساسي للفنيين**

**الصلاحيات:**
- ✅ تسجيل الحضور (Check-in / Check-out)
- ✅ عرض المهام اليومية المخصصة له
- ✅ تحديث حالة المهمة إلى "قيد التنفيذ" أو "يحتاج مراجعة"
- ✅ عرض حضوره الشهري في تبويب Attendance (قراءة فقط)
- ❌ لا يمكن إنشاء مهام
- ❌ لا يمكن تحديد المهام كمكتملة (هذا للمشرف)
- ❌ لا يمكن الوصول إلى بيانات المستخدمين الآخرين
- ❌ لا يمكن الوصول إلى الأقسام الأخرى

### 5. Admin (مدير)
**الوصول الكامل للموقع**

**الصلاحيات:**
- ✅ الوصول الكامل لجميع أقسام النظام
- ✅ جميع صلاحيات كل دور
- ✅ CRUD كامل على المستخدمين، المهام، الحضور، الإعدادات
- ✅ إنشاء/تعديل/حذف الأدوار والصلاحيات
- ✅ وصول غير مقيد على مستوى النظام

## هيكل نظام الصلاحيات

### Permission Actions

```typescript
enum PermissionAction {
  // Team Members Management
  TEAM_MEMBERS_CREATE
  TEAM_MEMBERS_READ
  TEAM_MEMBERS_UPDATE
  TEAM_MEMBERS_DELETE
  TEAM_MEMBERS_ASSIGN_ROLE

  // Attendance Management
  ATTENDANCE_CREATE
  ATTENDANCE_READ_OWN
  ATTENDANCE_READ_ALL
  ATTENDANCE_UPDATE
  ATTENDANCE_APPROVE
  ATTENDANCE_DELETE

  // Tasks Management
  TASKS_CREATE
  TASKS_READ_OWN
  TASKS_READ_ALL
  TASKS_UPDATE_OWN
  TASKS_UPDATE_ALL
  TASKS_DELETE
  TASKS_MARK_COMPLETED
  TASKS_ASSIGN

  // User Approval
  USER_APPROVAL_READ
  USER_APPROVAL_APPROVE
  USER_APPROVAL_REJECT

  // System Access
  ACCESS_DASHBOARD
  ACCESS_ORDERS
  ACCESS_CLIENTS
  ACCESS_SETTINGS
}
```

## الاستخدام في الكود

### Backend (API Routes)

```typescript
import { requirePermission, PermissionAction } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  // التحقق من الصلاحية
  const session = await requirePermission(PermissionAction.TEAM_MEMBERS_CREATE);
  
  // الكود هنا...
}
```

### Frontend (React Components)

```typescript
import { usePermission, PermissionGuard, PermissionAction } from "@/lib/permissions";

function MyComponent() {
  const canCreate = usePermission(PermissionAction.TEAM_MEMBERS_CREATE);
  
  return (
    <PermissionGuard action={PermissionAction.TEAM_MEMBERS_CREATE}>
      <Button>Create Member</Button>
    </PermissionGuard>
  );
}
```

## الحماية

### Backend Protection
- جميع API routes محمية بـ `requirePermission`
- التحقق من الصلاحيات يتم على مستوى الـ middleware
- لا يمكن تجاوز الحماية حتى مع استدعاء API مباشرة

### Frontend Protection
- الأزرار والعناصر المخفية بناءً على الصلاحيات
- الحماية على مستوى المكونات باستخدام `PermissionGuard`
- إخفاء/تعطيل الإجراءات المحظورة

## الملفات الرئيسية

- `lib/permissions/role-permissions.ts` - تعريف الصلاحيات والأدوار
- `lib/permissions/middleware.ts` - middleware للتحقق من الصلاحيات
- `lib/permissions/hooks.ts` - React hooks للواجهة
- `lib/permissions/components.tsx` - مكونات UI محمية
- `lib/permissions/index.ts` - تصدير موحد

## إضافة أدوار جديدة

1. إضافة الدور إلى `UserRole` enum في `prisma/schema.prisma`
2. إضافة الصلاحيات في `ROLE_PERMISSIONS` في `lib/permissions/role-permissions.ts`
3. تحديث API routes للتحقق من الصلاحيات الجديدة
4. تحديث الواجهات لإظهار/إخفاء العناصر بناءً على الصلاحيات

## الاختبار

يجب اختبار كل دور للتأكد من:
- ✅ الصلاحيات الممنوحة تعمل بشكل صحيح
- ✅ الصلاحيات المحظورة لا يمكن الوصول إليها
- ✅ الحماية تعمل على مستوى Backend و Frontend
- ✅ الرسائل الخطأ واضحة ومفيدة

