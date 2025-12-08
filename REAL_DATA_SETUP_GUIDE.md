# 👥 دليل إنشاء البيانات الحقيقية - ATA CRM

**متى وكيف تنشئ حسابات حقيقية للموظفين**

---

## 🎯 متى يمكنك استخدام بيانات حقيقية؟

### ✅ **الآن (في Development)**

**يمكنك استخدام بيانات حقيقية في Development للاختبار:**

**✅ آمن عندما:**
- Database محلي (على جهازك)
- لا يوجد اتصال بالإنترنت
- للاختبار فقط

**⚠️ تحذيرات:**
- لا تستخدم كلمات مرور مهمة جداً
- استخدم نسخة من البيانات الحقيقية
- لا ترفع Database إلى Git

### ✅ **في Staging (موصى به)**

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

### الطريقة 1: استخدام Frontend (أسهل) ⭐

#### الخطوات:
1. سجّل دخول كـ Admin أو HR
2. اذهب إلى: `/team/members`
3. اضغط "Add Team Member"
4. املأ النموذج:
   - Name: اسم الموظف
   - Email: بريده الإلكتروني
   - Password: كلمة مرور قوية
   - Role: اختر الدور
   - Phone: رقم الهاتف (اختياري)
5. اضغط "Create"

**✅ المميزات:**
- سهل جداً
- لا يحتاج Terminal
- Validation تلقائي
- Password Hashing تلقائي

---

### الطريقة 2: استخدام Script (للمستخدمين المتقدمين)

#### الخطوة 1: إعداد Environment Variables

**Windows PowerShell:**
```powershell
$env:USER_NAME="Ahmed Mohamed"
$env:USER_EMAIL="ahmed@company.com"
$env:USER_PASSWORD="Ahmed123!"
$env:USER_ROLE="OPERATIONS_MANAGER"
$env:COMPANY_ID="1"
$env:USER_PHONE="+971501234567"  # اختياري
```

**Linux/Mac:**
```bash
export USER_NAME="Ahmed Mohamed"
export USER_EMAIL="ahmed@company.com"
export USER_PASSWORD="Ahmed123!"
export USER_ROLE="OPERATIONS_MANAGER"
export COMPANY_ID="1"
export USER_PHONE="+971501234567"  # اختياري
```

#### الخطوة 2: تشغيل Script

```bash
npm run create:user
```

**أو:**

```bash
tsx scripts/create-user.ts
```

#### الخطوة 3: التحقق

```
✅ User created successfully!
   ID: 5
   Name: Ahmed Mohamed
   Email: ahmed@company.com
   Role: OPERATIONS_MANAGER
   Company: ATA Generators & Parts
   Status: APPROVED
```

---

### الطريقة 3: استخدام Prisma Studio

#### الخطوات:
1. افتح Prisma Studio:
   ```bash
   npm run prisma:studio
   ```

2. اذهب إلى `users` table
3. اضغط "Add record"
4. املأ البيانات:
   - `name`: اسم الموظف
   - `email`: بريده الإلكتروني
   - `password`: **لا تملأه!** (يجب Hash أولاً)
   - `role`: اختر الدور
   - `companyId`: ID الشركة
   - `accountStatus`: APPROVED

5. **لـ Password:**
   - استخدم bcrypt online tool: https://bcrypt-generator.com/
   - أدخل Password
   - انسخ الـ Hash
   - Paste في حقل `password`

**⚠️ تحذير:** هذه الطريقة معقدة، استخدم الطريقة 1 أو 2.

---

## 📋 الأدوار المتاحة

### 1. ADMIN
```bash
USER_ROLE="ADMIN"
```
**الصلاحيات:** كل شيء

### 2. OPERATIONS_MANAGER
```bash
USER_ROLE="OPERATIONS_MANAGER"
```
**الصلاحيات:** إدارة الطلبات، المهام، الفريق

### 3. HR
```bash
USER_ROLE="HR"
```
**الصلاحيات:** إدارة الموظفين، الأدوار، Attendance

### 4. ACCOUNTANT
```bash
USER_ROLE="ACCOUNTANT"
```
**الصلاحيات:** Overview، Purchase Orders، Payments

### 5. SUPERVISOR
```bash
USER_ROLE="SUPERVISOR"
```
**الصلاحيات:** إدارة المهام، الفريق

### 6. TECHNICIAN
```bash
USER_ROLE="TECHNICIAN"
```
**الصلاحيات:** عرض مهامه فقط، Check-in/out

---

## 🎯 أمثلة عملية

### مثال 1: إنشاء Operations Manager

```bash
# Windows PowerShell
$env:USER_NAME="Ahmed Mohamed"
$env:USER_EMAIL="ahmed@ata-generators.com"
$env:USER_PASSWORD="Ahmed@2024!"
$env:USER_ROLE="OPERATIONS_MANAGER"
$env:COMPANY_ID="1"

npm run create:user
```

### مثال 2: إنشاء HR Manager

```bash
$env:USER_NAME="Sara Ali"
$env:USER_EMAIL="sara@ata-generators.com"
$env:USER_PASSWORD="Sara@2024!"
$env:USER_ROLE="HR"
$env:COMPANY_ID="1"

npm run create:user
```

### مثال 3: إنشاء Technician

```bash
$env:USER_NAME="Mohamed Hassan"
$env:USER_EMAIL="mohamed@ata-generators.com"
$env:USER_PASSWORD="Mohamed@2024!"
$env:USER_ROLE="TECHNICIAN"
$env:COMPANY_ID="1"

npm run create:user
```

---

## 🔒 متطلبات Password

**Password يجب أن يكون:**
- ✅ 8+ حرف على الأقل (موصى به: 12+)
- ✅ يحتوي على أحرف كبيرة وصغيرة
- ✅ يحتوي على أرقام
- ✅ يحتوي على رموز خاصة (!@#$%^&*)

**أمثلة جيدة:**
- `Ahmed@2024!`
- `Sara#2024!`
- `Mohamed$2024!`

**أمثلة سيئة:**
- `password123` ❌
- `12345678` ❌
- `ahmed` ❌

---

## 📋 Checklist لإنشاء موظف

### قبل الإنشاء:
- [ ] قررت Email الموظف
- [ ] قررت Password قوي
- [ ] قررت الدور المناسب
- [ ] عرفت Company ID

### بعد الإنشاء:
- [ ] الموظف تم إنشاؤه بنجاح
- [ ] Status = APPROVED
- [ ] يمكنه Login
- [ ] الصلاحيات صحيحة

---

## 🧪 اختبار الحساب الجديد

### 1. Login Test
1. افتح: http://localhost:3005/login
2. سجّل دخول بالبيانات الجديدة
3. تحقق من أن Login نجح

### 2. Permissions Test
1. تحقق من الصفحات المتاحة
2. تحقق من الأزرار الظاهرة
3. جرب الوصول لصفحات غير مصرح بها (يجب أن ترفض)

### 3. Features Test
1. جرب الميزات المتاحة للدور
2. تحقق من أن كل شيء يعمل

---

## 📝 سجل الموظفين

**احتفظ بسجل لجميع الموظفين:**

| Name | Email | Role | Created | Status |
|------|-------|------|---------|--------|
| Admin | admin@company.com | ADMIN | 2024-12-01 | ✅ |
| Ahmed | ahmed@company.com | OPERATIONS_MANAGER | 2024-12-01 | ✅ |
| Sara | sara@company.com | HR | 2024-12-01 | ✅ |

---

## 🔄 تحديث بيانات موظف

### من Frontend:
1. اذهب إلى `/team/members`
2. اضغط على الموظف
3. اضغط "Edit"
4. غيّر البيانات
5. Save

### من Script:
```bash
# Update admin (مثال)
npm run update:admin
```

---

## 🗑️ حذف موظف

### من Frontend:
1. اذهب إلى `/team/members`
2. اضغط على الموظف
3. اضغط "Delete"
4. Confirm

**⚠️ تحذير:** الحذف نهائي! تأكد قبل الحذف.

---

## 📚 الملفات المرجعية

- **`TESTING_AND_REAL_DATA_GUIDE.md`** - دليل شامل
- **`TESTING_CHECKLIST.md`** - Checklist للاختبار
- **`ADMIN_SETUP_PRODUCTION.md`** - إعداد Admin

---

**تم إعداد الدليل بواسطة:** AI Assistant  
**التاريخ:** ديسمبر 2024

