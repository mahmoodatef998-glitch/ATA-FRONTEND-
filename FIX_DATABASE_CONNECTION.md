# 🔧 إصلاح خطأ Database Connection

## ❌ الخطأ:

```
Error querying the database: FATAL: Tenant or user not found
```

**المشكلة:** Database URL أو Credentials غير صحيحة

---

## ✅ الحل السريع:

### **الخطوة 1: تحقق من Database URL**

**في Supabase Dashboard:**
1. اذهب إلى: https://supabase.com/dashboard
2. اختر Project
3. Settings → Database
4. Connection String → **URI** (Direct connection)

**انسخ الـ URL الصحيح**

---

### **الخطوة 2: تحقق من Password**

**في Supabase Dashboard:**
1. Settings → Database
2. Database Password
3. إذا نسيت Password:
   - Reset Database Password
   - انسخ Password الجديد

---

### **الخطوة 3: استخدم Database URL الصحيح**

**الـ URL يجب أن يكون بهذا الشكل:**
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

**مثال:**
```
postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres
```

---

### **الخطوة 4: اختبر الاتصال**

**شغّل:**
```bash
TEST_DATABASE_CONNECTION.bat
```

**أو يدوياً:**
```powershell
$env:DIRECT_URL="postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres"
npx prisma db execute --stdin --schema=prisma/schema.prisma
```

---

## 🔍 التحقق من Database URL:

### **الطريقة 1: من Supabase Dashboard**

1. **Supabase Dashboard** → Project
2. **Settings** → **Database**
3. **Connection String** → **URI**
4. **Copy** → استخدمه في `DIRECT_URL`

---

### **الطريقة 2: من Supabase SQL Editor**

1. **Supabase Dashboard** → **SQL Editor**
2. شغّل:
   ```sql
   SELECT current_database(), current_user;
   ```
3. إذا عمل، Database متاح

---

## 📝 تحديث Database URL في Scripts:

### **في CHECK_ADMIN_EXISTS.bat:**

```batch
set DIRECT_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

**استبدل:**
- `[PROJECT_REF]` → Project Reference من Supabase
- `[PASSWORD]` → Database Password

---

## 🎯 خطوات الإصلاح الكاملة:

### **1. احصل على Database URL الصحيح:**

**من Supabase:**
- Settings → Database → Connection String → URI

### **2. حدث CHECK_ADMIN_EXISTS.bat:**

```batch
set DIRECT_URL=[YOUR_DATABASE_URL_HERE]
```

### **3. اختبر الاتصال:**

```bash
TEST_DATABASE_CONNECTION.bat
```

### **4. شغّل Check Admin:**

```bash
CHECK_ADMIN_EXISTS.bat
```

---

## ⚠️ ملاحظات مهمة:

### **1. Direct URL vs Pooler URL:**

**Direct URL (للـ Scripts):**
```
postgresql://postgres.[REF]:[PASS]@db.[REF].supabase.co:5432/postgres
```

**Pooler URL (للـ Production):**
```
postgresql://postgres.[REF]:[PASS]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**للـ Scripts: استخدم Direct URL**

---

### **2. Password Special Characters:**

**إذا كان Password يحتوي على `@` أو `#`:**
- URL encode: `@` → `%40`, `#` → `%23`

---

### **3. Network Access:**

**تأكد من:**
- Database متاح من IP الخاص بك
- لا توجد firewall blocks
- Supabase Project نشط

---

## 🆘 إذا استمر الخطأ:

### **1. تحقق من Supabase Status:**

- اذهب إلى: https://status.supabase.com/
- تحقق من Service Status

### **2. تحقق من Project Status:**

- Supabase Dashboard → Project
- تحقق من Project نشط

### **3. Reset Database Password:**

1. Supabase Dashboard → Settings → Database
2. Reset Database Password
3. انسخ Password الجديد
4. حدث `DIRECT_URL`

---

## 📋 Checklist:

```
☐ 1. Database URL صحيح من Supabase
☐ 2. Password صحيح
☐ 3. Project نشط في Supabase
☐ 4. Network access متاح
☐ 5. TEST_DATABASE_CONNECTION.bat يعمل
☐ 6. CHECK_ADMIN_EXISTS.bat يعمل
```

---

## 🎯 الحل السريع (Copy & Paste):

**1. احصل على Database URL من Supabase:**
- Settings → Database → Connection String → URI

**2. حدث CHECK_ADMIN_EXISTS.bat:**
```batch
set DIRECT_URL=[YOUR_URL_HERE]
```

**3. شغّل:**
```bash
CHECK_ADMIN_EXISTS.bat
```

---

**آخر تحديث:** 22 ديسمبر 2025

