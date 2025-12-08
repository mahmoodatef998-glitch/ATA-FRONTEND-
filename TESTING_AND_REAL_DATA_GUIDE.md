# 🧪 دليل الاختبار وإنشاء البيانات الحقيقية - ATA CRM

**التاريخ:** ديسمبر 2024

---

## 🎯 متى يمكنك استخدام بيانات حقيقية؟

### ✅ **الآن! (في Development)**

يمكنك استخدام بيانات حقيقية في Development للاختبار، لكن:

**⚠️ تحذيرات:**
- لا تستخدم بيانات حساسة جداً (مثل كلمات مرور مهمة)
- استخدم نسخة من البيانات الحقيقية
- تأكد من أن Database محلي (ليس Production)

### ✅ **في Staging Environment (موصى به)**

**Staging = بيئة مشابهة لـ Production لكن للاختبار**

**المميزات:**
- بيئة مشابهة لـ Production
- يمكن اختبار كل شيء بأمان
- لا يؤثر على Production

### ⚠️ **في Production (بعد الاختبار الكامل)**

**فقط بعد:**
- ✅ اختبار شامل في Development
- ✅ اختبار شامل في Staging
- ✅ تأكد من أن كل شيء يعمل
- ✅ Backup للبيانات

---

## 👥 كيفية إنشاء حسابات للموظفين

### الطريقة 1: استخدام Prisma Studio (أسهل)

#### الخطوة 1: فتح Prisma Studio
```bash
npm run prisma:studio
```

#### الخطوة 2: إنشاء مستخدم جديد
1. افتح: http://localhost:5556
2. اذهب إلى `users` table
3. اضغط "Add record"
4. املأ البيانات:
   - `name`: اسم الموظف
   - `email`: بريده الإلكتروني
   - `password`: **لا تملأه هنا!** (يجب Hash أولاً)
   - `role`: اختر الدور (ADMIN, OPERATIONS_MANAGER, HR, etc.)
   - `companyId`: ID الشركة
   - `accountStatus`: APPROVED

#### الخطوة 3: Hash Password
**لا يمكن إدخال Password مباشرة!**

استخدم الطريقة 2 أو 3 أدناه.

---

### الطريقة 2: استخدام Script (موصى به)

#### إنشاء Script لإنشاء مستخدم

**إنشاء ملف:** `scripts/create-user.ts`

```typescript
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const name = process.env.USER_NAME || "User Name";
  const email = process.env.USER_EMAIL || "user@example.com";
  const password = process.env.USER_PASSWORD || "Password123!";
  const role = (process.env.USER_ROLE || "TECHNICIAN") as UserRole;
  const companyId = parseInt(process.env.COMPANY_ID || "1");

  // Validate password
  if (password.length < 8) {
    console.error("❌ Password must be at least 8 characters!");
    process.exit(1);
  }

  // Check if email already exists
  const existing = await prisma.users.findUnique({
    where: { email },
  });

  if (existing) {
    console.error(`❌ User with email ${email} already exists!`);
    process.exit(1);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.users.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      companyId,
      accountStatus: "APPROVED",
    },
  });

  console.log("✅ User created successfully!");
  console.log(`   ID: ${user.id}`);
  console.log(`   Name: ${user.name}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Password: [HIDDEN]`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

#### استخدام Script

```bash
# Windows PowerShell
$env:USER_NAME="Ahmed Mohamed"
$env:USER_EMAIL="ahmed@company.com"
$env:USER_PASSWORD="Ahmed123!"
$env:USER_ROLE="OPERATIONS_MANAGER"
$env:COMPANY_ID="1"

tsx scripts/create-user.ts
```

```bash
# Linux/Mac
export USER_NAME="Ahmed Mohamed"
export USER_EMAIL="ahmed@company.com"
export USER_PASSWORD="Ahmed123!"
export USER_ROLE="OPERATIONS_MANAGER"
export COMPANY_ID="1"

tsx scripts/create-user.ts
```

---

### الطريقة 3: استخدام API (للمستخدمين المتقدمين)

#### إنشاء API Route

**الملف موجود:** `app/api/team/members/create/route.ts`

**الاستخدام:**
```bash
POST /api/team/members/create
Content-Type: application/json

{
  "name": "Ahmed Mohamed",
  "email": "ahmed@company.com",
  "password": "Ahmed123!",
  "role": "OPERATIONS_MANAGER",
  "phone": "+971501234567"
}
```

**من Frontend:**
- اذهب إلى `/team/members`
- اضغط "Add Team Member"
- املأ النموذج

---

## 🧪 كيفية اختبار المشروع قبل Production

### المرحلة 1: اختبار الوظائف الأساسية (30 دقيقة)

#### 1.1 Authentication & Authorization
- [ ] Login كـ Admin
- [ ] Login كـ Operations Manager
- [ ] Login كـ HR
- [ ] Login كـ Technician
- [ ] Logout يعمل
- [ ] Session لا تنتهي قبل الوقت المحدد

#### 1.2 RBAC System
- [ ] Admin يمكنه الوصول لكل شيء
- [ ] Operations Manager يمكنه إدارة الطلبات والمهام
- [ ] HR يمكنه إدارة الموظفين فقط
- [ ] Technician يمكنه فقط عرض مهامه
- [ ] الصلاحيات تعمل بشكل صحيح

#### 1.3 Order Management
- [ ] إنشاء طلب جديد
- [ ] عرض جميع الطلبات
- [ ] تحديث حالة الطلب
- [ ] رفع Quotation
- [ ] إرسال Quotation للعميل
- [ ] قبول/رفض Quotation من العميل

#### 1.4 Team Management
- [ ] عرض جميع الموظفين
- [ ] إضافة موظف جديد
- [ ] تعديل بيانات موظف
- [ ] حذف موظف
- [ ] تعيين أدوار للموظفين

#### 1.5 Attendance System
- [ ] Check-in
- [ ] Check-out
- [ ] عرض Attendance Records
- [ ] Approval للـ Attendance Requests (Admin)

#### 1.6 Tasks Management
- [ ] إنشاء Task
- [ ] تعيين Task لموظف
- [ ] تحديث Task Status
- [ ] عرض Tasks

---

### المرحلة 2: اختبار الأداء (15 دقيقة)

#### 2.1 Database Performance
```bash
# افتح Prisma Studio
npm run prisma:studio

# تحقق من:
- [ ] Queries سريعة (< 1 ثانية)
- [ ] لا توجد N+1 queries
- [ ] Indexes موجودة
```

#### 2.2 Frontend Performance
- [ ] الصفحات تفتح بسرعة
- [ ] لا توجد delays في Loading
- [ ] Images تحمّل بسرعة
- [ ] Bundle Size معقول

#### 2.3 API Performance
```bash
# Test API endpoints
curl http://localhost:3005/api/health
curl http://localhost:3005/api/dashboard/analytics
```

---

### المرحلة 3: اختبار الأمان (20 دقيقة)

#### 3.1 Authentication Security
- [ ] Password Hashing يعمل
- [ ] Session Management صحيح
- [ ] Logout يمسح Session

#### 3.2 Authorization Security
- [ ] المستخدمون لا يمكنهم الوصول لصفحات غير مصرح بها
- [ ] API Routes محمية
- [ ] RBAC يعمل بشكل صحيح

#### 3.3 Input Validation
- [ ] Forms ترفض بيانات غير صحيحة
- [ ] SQL Injection محمي (Prisma)
- [ ] XSS محمي

---

### المرحلة 4: اختبار التكامل (20 دقيقة)

#### 4.1 Email Notifications
- [ ] Order Confirmation Email
- [ ] Quotation Ready Email
- [ ] Status Update Email

#### 4.2 Real-time Updates
- [ ] Notifications تظهر فوراً
- [ ] Socket.io يعمل
- [ ] Real-time Updates تعمل

#### 4.3 File Uploads
- [ ] رفع Quotations
- [ ] رفع Purchase Orders
- [ ] رفع Delivery Notes
- [ ] تحميل الملفات

---

### المرحلة 5: اختبار User Experience (15 دقيقة)

#### 5.1 Navigation
- [ ] جميع الروابط تعمل
- [ ] Navigation سلس
- [ ] Breadcrumbs صحيحة

#### 5.2 Responsive Design
- [ ] يعمل على Desktop
- [ ] يعمل على Tablet
- [ ] يعمل على Mobile

#### 5.3 Dark Mode
- [ ] Dark Mode يعمل
- [ ] التبديل سلس
- [ ] الألوان واضحة

---

## 📋 Checklist شامل للاختبار

### ✅ Authentication & Authorization
- [ ] Login جميع الأدوار
- [ ] Logout يعمل
- [ ] Session Management
- [ ] RBAC Permissions

### ✅ Order Management
- [ ] Create Order
- [ ] View Orders
- [ ] Update Order Status
- [ ] Upload Quotation
- [ ] Send Quotation
- [ ] Accept/Reject Quotation

### ✅ Team Management
- [ ] View Members
- [ ] Add Member
- [ ] Edit Member
- [ ] Delete Member
- [ ] Assign Roles

### ✅ Attendance System
- [ ] Check-in
- [ ] Check-out
- [ ] View Attendance
- [ ] Approve Requests

### ✅ Tasks Management
- [ ] Create Task
- [ ] Assign Task
- [ ] Update Task
- [ ] View Tasks

### ✅ Performance
- [ ] Fast Loading
- [ ] No N+1 Queries
- [ ] API Response Time < 1s

### ✅ Security
- [ ] Password Hashing
- [ ] Authorization Works
- [ ] Input Validation

### ✅ Integration
- [ ] Email Notifications
- [ ] Real-time Updates
- [ ] File Uploads

### ✅ UX
- [ ] Navigation Works
- [ ] Responsive Design
- [ ] Dark Mode

---

## 🚀 خطوات الاختبار السريع

### 1. إنشاء بيانات اختبار

```bash
# إنشاء Admin حقيقي
npm run update:admin

# إنشاء موظفين
tsx scripts/create-user.ts  # (مع Environment Variables)
```

### 2. اختبار كل ميزة

اتبع `TESTING_CHECKLIST.md` (سيتم إنشاؤه)

### 3. اختبار الأداء

```bash
# Build المشروع
npm run build

# Start Production Mode
npm start

# Test
curl http://localhost:3005/api/health
```

### 4. اختبار الأمان

- جرب الوصول لصفحات غير مصرح بها
- جرب API calls بدون authentication
- تحقق من Password Hashing

---

## 📝 سيناريوهات اختبار موصى بها

### السيناريو 1: دورة حياة طلب كاملة
1. عميل يسجّل حساب
2. عميل ينشئ طلب
3. Admin يوافق على الطلب
4. Operations Manager يرفع Quotation
5. Quotation يُرسل للعميل
6. عميل يقبل Quotation
7. Admin ينشئ Purchase Order
8. Order يتم تسليمه

### السيناريو 2: إدارة موظف كاملة
1. HR يضيف موظف جديد
2. HR يعيّن دور للموظف
3. الموظف يسجّل دخول
4. الموظف يعمل Check-in
5. Supervisor ينشئ Task للموظف
6. الموظف يكمل Task
7. الموظف يعمل Check-out

### السيناريو 3: اختبار الصلاحيات
1. Admin: يمكنه كل شيء ✅
2. Operations Manager: يمكنه إدارة الطلبات والمهام ✅
3. HR: يمكنه إدارة الموظفين فقط ✅
4. Technician: يمكنه فقط عرض مهامه ✅

---

## 🎯 متى تكون جاهز للإنتاج؟

### ✅ جاهز عندما:
- [ ] جميع الاختبارات تمر بنجاح
- [ ] لا توجد أخطاء في Console
- [ ] الأداء جيد
- [ ] الأمان محقق
- [ ] UX جيد
- [ ] البيانات الحقيقية جاهزة

---

## 📚 الملفات المرجعية

- **`TESTING_CHECKLIST.md`** - Checklist شامل للاختبار
- **`ADMIN_SETUP_PRODUCTION.md`** - إعداد Admin الحقيقي
- **`PRODUCTION_CHECKLIST.md`** - Checklist قبل Production

---

**تم إعداد الدليل بواسطة:** AI Assistant  
**التاريخ:** ديسمبر 2024

