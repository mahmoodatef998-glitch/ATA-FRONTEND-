# 📍 كيفية تشغيل CHECK_ADMIN_EXISTS.bat

## 🎯 الهدف:
التحقق من وجود حساب Admin في قاعدة البيانات

---

## 📂 أين يوجد الملف؟

**الملف موجود في:**
```
E:\coding\ATA CRM PROJECT\ATA CRM PROJECT\CHECK_ADMIN_EXISTS.bat
```

---

## 🚀 طريقة التشغيل (3 طرق):

### **الطريقة 1: من File Explorer (أسهل) ⭐⭐⭐**

1. **افتح File Explorer:**
   - اضغط `Windows + E`
   - أو افتح أي مجلد

2. **اذهب إلى مجلد المشروع:**
   ```
   E:\coding\ATA CRM PROJECT\ATA CRM PROJECT
   ```

3. **ابحث عن الملف:**
   - ابحث عن: `CHECK_ADMIN_EXISTS.bat`
   - أو ابحث عن أي ملف `.bat`

4. **شغّل الملف:**
   - اضغط **Double Click** (نقرة مزدوجة) على الملف
   - أو **Right Click** → **Run as administrator**

5. **ستفتح نافذة PowerShell/CMD:**
   - سيعرض النتيجة تلقائياً
   - انتظر حتى ينتهي
   - اضغط أي زر لإغلاق النافذة

---

### **الطريقة 2: من PowerShell/CMD**

1. **افتح PowerShell:**
   - اضغط `Windows + X`
   - اختر **Windows PowerShell**
   - أو ابحث عن "PowerShell" في Start Menu

2. **اذهب إلى مجلد المشروع:**
   ```powershell
   cd "E:\coding\ATA CRM PROJECT\ATA CRM PROJECT"
   ```

3. **شغّل الملف:**
   ```powershell
   .\CHECK_ADMIN_EXISTS.bat
   ```

4. **ستظهر النتيجة مباشرة**

---

### **الطريقة 3: من VS Code / Cursor**

1. **افتح المشروع في VS Code/Cursor**

2. **افتح Terminal:**
   - اضغط `Ctrl + ~` (Control + Tilde)
   - أو Terminal → New Terminal

3. **شغّل الملف:**
   ```bash
   .\CHECK_ADMIN_EXISTS.bat
   ```

4. **ستظهر النتيجة في Terminal**

---

## 📋 ما الذي سيحدث عند التشغيل؟

**الملف سيقوم بـ:**

1. ✅ الاتصال بقاعدة البيانات
2. ✅ البحث عن Admin user
3. ✅ عرض جميع المستخدمين
4. ✅ عرض بيانات Login

**مثال على النتيجة:**

```
==================================================
📊 Results:
==================================================

✅ Admin user found (by role):
   ID: 1
   Name: Admin User
   Email: admin@demo.co
   Role: ADMIN
   Status: APPROVED
   Created: 2025-12-22T10:00:00.000Z

==================================================
📋 All users in database (1 total):
==================================================

1. Admin User
   Email: admin@demo.co
   Role: ADMIN
   Status: APPROVED

==================================================
📝 Login Credentials:
==================================================

✅ Use these credentials to login:
   Email: admin@demo.co
   Password: 00243540000
   URL: https://ata-frontend-pied.vercel.app/login

==================================================
```

---

## ⚠️ إذا ظهر خطأ:

### **خطأ: "Cannot find file"**

**الحل:**
1. تأكد أنك في المجلد الصحيح
2. تحقق من وجود الملف:
   ```powershell
   dir CHECK_ADMIN_EXISTS.bat
   ```

### **خطأ: "Database connection failed"**

**الحل:**
- الملف يستخدم Database URL المحدد
- إذا فشل الاتصال، تحقق من:
  1. Database URL صحيح
  2. Database متاح

### **خطأ: "tsx is not recognized"**

**الحل:**
```powershell
npm install -g tsx
# أو
npx tsx scripts/check-admin.ts
```

---

## 🎯 خطوات سريعة (Copy & Paste):

### **من PowerShell:**

```powershell
# 1. اذهب للمجلد
cd "E:\coding\ATA CRM PROJECT\ATA CRM PROJECT"

# 2. شغّل الملف
.\CHECK_ADMIN_EXISTS.bat

# 3. انتظر النتيجة
```

---

## 📸 Screenshot للمساعدة:

**إذا كنت في File Explorer:**
```
ATA CRM PROJECT/
  ├── CHECK_ADMIN_EXISTS.bat  ← اضغط هنا
  ├── CREATE_ADMIN.bat
  ├── UPDATE_ADMIN.bat
  └── ...
```

**اضغط Double Click على `CHECK_ADMIN_EXISTS.bat`**

---

## ✅ بعد التشغيل:

**ستحصل على:**
- ✅ هل يوجد Admin؟
- ✅ بيانات Login
- ✅ جميع المستخدمين

**بعدها:**
- إذا **لا يوجد Admin**: شغّل `CREATE_ADMIN.bat`
- إذا **يوجد Admin**: تحقق من NextAuth في Vercel

---

## 🆘 إذا لم تجد الملف:

**شغّل يدوياً:**

```powershell
# 1. اذهب للمجلد
cd "E:\coding\ATA CRM PROJECT\ATA CRM PROJECT"

# 2. Set Database URL
$env:DIRECT_URL="postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres"

# 3. شغّل Script مباشرة
npx tsx scripts/check-admin.ts
```

---

**آخر تحديث:** 22 ديسمبر 2025


