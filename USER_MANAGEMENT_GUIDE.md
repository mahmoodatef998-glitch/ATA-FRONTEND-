# 👥 دليل شامل - إدارة المستخدمين والأدوار (Roles)

**التاريخ:** 22 ديسمبر 2025  
**الهدف:** شرح كيفية إنشاء وتعديل المستخدمين وتعيين الأدوار

---

## 📋 جدول المحتويات

1. [الأدوار المتاحة (Roles)](#الأدوار-المتاحة)
2. [إنشاء حساب Admin جديد](#إنشاء-حساب-admin-جديد)
3. [تغيير بيانات Admin الحالي](#تغيير-بيانات-admin-الحالي)
4. [إنشاء مستخدمين بأدوار مختلفة](#إنشاء-مستخدمين-بأدوار-مختلفة)
5. [تغيير Role لمستخدم موجود](#تغيير-role-لمستخدم-موجود)
6. [إنشاء RBAC Role جديد](#إنشاء-rbac-role-جديد)
7. [Scripts جاهزة للاستخدام](#scripts-جاهزة-للاستخدام)

---

## 🎭 الأدوار المتاحة (Roles)

### الأدوار في النظام:

```
1. ADMIN                    - مدير النظام (صلاحيات كاملة)
2. OPERATIONS_MANAGER       - مدير العمليات
3. ACCOUNTANT               - محاسب
4. SUPERVISOR               - مشرف
5. TECHNICIAN               - فني
6. FACTORY_SUPERVISOR       - مشرف المصنع
7. HR                       - موارد بشرية
8. SALES_REP                - مندوب مبيعات
9. CLIENT                   - عميل (للعملاء الذين لديهم حساب)
```

### الصلاحيات (مبسطة):

| Role | الصلاحيات |
|------|-----------|
| **ADMIN** | ✅ كل شيء (Full Access) |
| **OPERATIONS_MANAGER** | ✅ إدارة الطلبات، الفرق، المهام |
| **ACCOUNTANT** | ✅ المدفوعات، الفواتير، التقارير المالية |
| **SUPERVISOR** | ✅ إدارة الفنيين، المهام، الحضور |
| **TECHNICIAN** | ✅ المهام المخصصة، تحديث الحالة |
| **FACTORY_SUPERVISOR** | ✅ إدارة المصنع، الإنتاج |
| **HR** | ✅ إدارة الموظفين، الحضور |
| **SALES_REP** | ✅ المبيعات، العملاء، الطلبات |
| **CLIENT** | ✅ عرض طلباته فقط |

---

## 🔐 إنشاء حساب Admin جديد

### الطريقة 1: استخدام Script (موصى به) ⭐

#### **خطوات التنفيذ:**

**1. افتح PowerShell في مجلد المشروع**

**2. حدد Database URL:**
```powershell
$env:DIRECT_URL="postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres"
```

**3. حدد بيانات Admin الجديد:**
```powershell
$env:USER_NAME="Admin Name"
$env:USER_EMAIL="admin@yourcompany.com"
$env:USER_PASSWORD="YourStrongPassword123!"
$env:USER_ROLE="ADMIN"
$env:COMPANY_ID="1"
```

**4. شغّل Script:**
```powershell
npx tsx scripts/create-user.ts
```

**مثال كامل:**
```powershell
# Set Database
$env:DIRECT_URL="postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres"

# Create Admin
$env:USER_NAME="Mahmood Atef"
$env:USER_EMAIL="mahmood@ata.com"
$env:USER_PASSWORD="MySecurePassword123!"
$env:USER_ROLE="ADMIN"
$env:COMPANY_ID="1"

# Run Script
npx tsx scripts/create-user.ts
```

**النتيجة:**
```
✅ User created successfully!
   ID: 1
   Name: Mahmood Atef
   Email: mahmood@ata.com
   Role: ADMIN
   Company: ATA Generators & Parts
   Status: APPROVED

📝 Login credentials:
   Email: mahmood@ata.com
   Password: MySecurePassword123!
```

---

### الطريقة 2: استخدام Batch File (أسهل) ⭐⭐⭐

**سأنشئ ملف batch جاهز:**

```batch
@echo off
echo ========================================
echo   Create New Admin User
echo ========================================
echo.

set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres

echo Enter Admin Details:
echo.

set /p USER_NAME="Name: "
set /p USER_EMAIL="Email: "
set /p USER_PASSWORD="Password (min 8 chars): "
set USER_ROLE=ADMIN
set COMPANY_ID=1

echo.
echo Creating admin user...
echo.

call npx tsx scripts/create-user.ts

echo.
pause
```

---

## 🔄 تغيير بيانات Admin الحالي

### الطريقة 1: تحديث Admin الموجود

**خطوات التنفيذ:**

**1. حدد Database URL:**
```powershell
$env:DIRECT_URL="postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres"
```

**2. حدد البيانات الجديدة:**
```powershell
$env:ADMIN_EMAIL="newadmin@yourcompany.com"
$env:ADMIN_PASSWORD="NewPassword123!"
$env:ADMIN_NAME="New Admin Name"
```

**3. شغّل Script:**
```powershell
npx tsx scripts/update-admin.ts
```

**مثال كامل:**
```powershell
# Set Database
$env:DIRECT_URL="postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres"

# Update Admin
$env:ADMIN_EMAIL="admin@ata.com"
$env:ADMIN_PASSWORD="NewSecurePassword123!"
$env:ADMIN_NAME="ATA Admin"

# Run Script
npx tsx scripts/update-admin.ts
```

**النتيجة:**
```
✅ Admin updated successfully!
   ID: 1
   Email: admin@ata.com
   Name: ATA Admin
   Role: ADMIN

📝 Next steps:
   1. Log out from current session
   2. Log in with new credentials
   3. Verify all permissions work correctly
```

---

## 👤 إنشاء مستخدمين بأدوار مختلفة

### مثال 1: إنشاء Operations Manager

```powershell
$env:DIRECT_URL="postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres"

$env:USER_NAME="Ahmed Ali"
$env:USER_EMAIL="ahmed@ata.com"
$env:USER_PASSWORD="Ahmed123!"
$env:USER_ROLE="OPERATIONS_MANAGER"
$env:COMPANY_ID="1"

npx tsx scripts/create-user.ts
```

---

### مثال 2: إنشاء Accountant

```powershell
$env:DIRECT_URL="postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres"

$env:USER_NAME="Sara Mohamed"
$env:USER_EMAIL="sara@ata.com"
$env:USER_PASSWORD="Sara123!"
$env:USER_ROLE="ACCOUNTANT"
$env:COMPANY_ID="1"

npx tsx scripts/create-user.ts
```

---

### مثال 3: إنشاء Supervisor

```powershell
$env:DIRECT_URL="postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres"

$env:USER_NAME="Omar Hassan"
$env:USER_EMAIL="omar@ata.com"
$env:USER_PASSWORD="Omar123!"
$env:USER_ROLE="SUPERVISOR"
$env:COMPANY_ID="1"

npx tsx scripts/create-user.ts
```

---

### مثال 4: إنشاء Technician

```powershell
$env:DIRECT_URL="postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres"

$env:USER_NAME="Khalid Ibrahim"
$env:USER_EMAIL="khalid@ata.com"
$env:USER_PASSWORD="Khalid123!"
$env:USER_ROLE="TECHNICIAN"
$env:COMPANY_ID="1"
$env:USER_PHONE="+971501234567"

npx tsx scripts/create-user.ts
```

---

### مثال 5: إنشاء HR

```powershell
$env:DIRECT_URL="postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres"

$env:USER_NAME="Fatima Ali"
$env:USER_EMAIL="fatima@ata.com"
$env:USER_PASSWORD="Fatima123!"
$env:USER_ROLE="HR"
$env:COMPANY_ID="1"

npx tsx scripts/create-user.ts
```

---

## 🔄 تغيير Role لمستخدم موجود

### الطريقة 1: استخدام Prisma Studio (أسهل)

**1. شغّل Prisma Studio:**
```powershell
$env:DIRECT_URL="postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres"
npx prisma studio
```

**2. افتح:**
- http://localhost:5555
- اذهب إلى `users` table
- ابحث عن المستخدم
- Edit → Role → اختر Role جديد
- Save

---

### الطريقة 2: استخدام Script (سأنشئه)

**سأنشئ script جديد لتغيير Role:**

```typescript
// scripts/change-user-role.ts
```

---

## 📝 Scripts جاهزة للاستخدام

### 1. CREATE_ADMIN.bat (إنشاء Admin جديد)

```batch
@echo off
echo ========================================
echo   Create New Admin User
echo ========================================
echo.

set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres

set /p USER_NAME="Enter Admin Name: "
set /p USER_EMAIL="Enter Admin Email: "
set /p USER_PASSWORD="Enter Password (min 8 chars): "
set USER_ROLE=ADMIN
set COMPANY_ID=1

echo.
echo Creating admin user...
call npx tsx scripts/create-user.ts

echo.
pause
```

---

### 2. UPDATE_ADMIN.bat (تحديث Admin)

```batch
@echo off
echo ========================================
echo   Update Admin User
echo ========================================
echo.

set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres

set /p ADMIN_EMAIL="Enter New Email: "
set /p ADMIN_PASSWORD="Enter New Password (min 12 chars): "
set /p ADMIN_NAME="Enter New Name: "

echo.
echo Updating admin...
call npx tsx scripts/update-admin.ts

echo.
pause
```

---

### 3. CREATE_USER.bat (إنشاء أي مستخدم)

```batch
@echo off
echo ========================================
echo   Create New User
echo ========================================
echo.

set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres

set /p USER_NAME="Enter Name: "
set /p USER_EMAIL="Enter Email: "
set /p USER_PASSWORD="Enter Password (min 8 chars): "
echo.
echo Available Roles:
echo   1. ADMIN
echo   2. OPERATIONS_MANAGER
echo   3. ACCOUNTANT
echo   4. SUPERVISOR
echo   5. TECHNICIAN
echo   6. FACTORY_SUPERVISOR
echo   7. HR
echo.
set /p ROLE_CHOICE="Select Role (1-7): "

if "%ROLE_CHOICE%"=="1" set USER_ROLE=ADMIN
if "%ROLE_CHOICE%"=="2" set USER_ROLE=OPERATIONS_MANAGER
if "%ROLE_CHOICE%"=="3" set USER_ROLE=ACCOUNTANT
if "%ROLE_CHOICE%"=="4" set USER_ROLE=SUPERVISOR
if "%ROLE_CHOICE%"=="5" set USER_ROLE=TECHNICIAN
if "%ROLE_CHOICE%"=="6" set USER_ROLE=FACTORY_SUPERVISOR
if "%ROLE_CHOICE%"=="7" set USER_ROLE=HR

set COMPANY_ID=1

echo.
echo Creating user...
call npx tsx scripts/create-user.ts

echo.
pause
```

---

## ⚠️ ملاحظات مهمة

### 1. Password Requirements:
```
✅ Minimum 8 characters (للمستخدمين العاديين)
✅ Minimum 12 characters (لـ Admin - في update-admin.ts)
✅ يفضل: Mix of letters, numbers, symbols
```

### 2. Email Requirements:
```
✅ يجب أن يكون unique (لا يوجد مستخدم آخر بنفس الإيميل)
✅ يجب أن يحتوي على @
✅ سيتم تحويله إلى lowercase تلقائياً
```

### 3. Account Status:
```
✅ المستخدمين الجدد من scripts: APPROVED تلقائياً
✅ يمكن تغيير Status من Dashboard أو Prisma Studio
```

### 4. Company ID:
```
✅ Default: 1
✅ إذا كان لديك companies متعددة، غيّر COMPANY_ID
```

---

## 🧪 اختبار بعد الإنشاء

### 1. تسجيل الدخول:
```
URL: https://ata-frontend.vercel.app/login
Email: [الإيميل الذي أنشأته]
Password: [الباسورد الذي حددته]
```

### 2. التحقق من الصلاحيات:
- ✅ Dashboard يفتح
- ✅ Role يظهر في Profile
- ✅ الصلاحيات تعمل حسب Role

---

## 📋 Checklist سريع

### عند إنشاء Admin جديد:
```
☐ حدد DIRECT_URL
☐ حدد USER_NAME
☐ حدد USER_EMAIL (unique)
☐ حدد USER_PASSWORD (min 8 chars)
☐ شغّل create-user.ts
☐ جرب Login
☐ تحقق من الصلاحيات
```

### عند تحديث Admin:
```
☐ حدد DIRECT_URL
☐ حدد ADMIN_EMAIL الجديد
☐ حدد ADMIN_PASSWORD الجديد (min 12 chars)
☐ حدد ADMIN_NAME الجديد
☐ شغّل update-admin.ts
☐ Logout من الجلسة الحالية
☐ Login بالبيانات الجديدة
```

---

## 🆘 حل المشاكل الشائعة

### ❌ Error: "User with email already exists"
```
الحل: استخدم إيميل مختلف أو update-admin.ts لتحديث المستخدم الموجود
```

### ❌ Error: "Company with ID not found"
```
الحل: تحقق من COMPANY_ID - استخدم Prisma Studio لمعرفة Company IDs
```

### ❌ Error: "Invalid role"
```
الحل: تأكد من استخدام Role صحيح من القائمة:
ADMIN, OPERATIONS_MANAGER, ACCOUNTANT, SUPERVISOR, 
TECHNICIAN, FACTORY_SUPERVISOR, HR
```

### ❌ Error: "Password too short"
```
الحل: Password يجب أن يكون 8+ characters (12+ للـ Admin في update)
```

---

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تحقق من Database URL
2. تحقق من Environment Variables
3. راجع Error Messages
4. استخدم Prisma Studio للتحقق من البيانات

---

**آخر تحديث:** 22 ديسمبر 2025  
**الحالة:** ✅ جاهز للاستخدام

