# 🔧 إصلاح Database Schema - Missing Columns

## ❌ المشكلة:
```
The column `users.accountStatus` does not exist in the current database.
```

**المشكلة:** Database schema غير محدث - Migrations لم يتم تشغيلها

---

## ✅ الحل السريع:

### **الخطوة 1: شغّل Migrations**

**شغّل:**
```bash
RUN_MIGRATIONS.bat
```

**أو يدوياً:**
```powershell
$env:DIRECT_URL="postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
npx prisma migrate deploy
npx prisma generate
```

---

### **الخطوة 2: إذا فشل migrate deploy**

**جرب db push:**
```powershell
$env:DIRECT_URL="postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
npx prisma db push
npx prisma generate
```

---

### **الخطوة 3: تحقق من Admin**

**بعد Migrations:**
```bash
CHECK_ADMIN_EXISTS.bat
```

---

## 📋 خطوات كاملة:

### **1. شغّل Migrations:**
```bash
RUN_MIGRATIONS.bat
```

### **2. إذا نجح:**
```bash
CHECK_ADMIN_EXISTS.bat
```

### **3. إذا لم يوجد Admin:**
```bash
CREATE_ADMIN.bat
```

---

## ⚠️ ملاحظات مهمة:

### **1. Pooler vs Direct Connection:**

**للـ Migrations:**
- يمكن استخدام Pooler Connection
- أو Direct Connection (أفضل للـ migrations)

**إذا فشل Pooler:**
```batch
set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres
```

---

### **2. Schema Sync:**

**بعد Migrations:**
- Schema سيتم تحديثه
- جميع الأعمدة ستكون موجودة
- Prisma Client سيتم تحديثه

---

## 🎯 جرب الآن:

```bash
RUN_MIGRATIONS.bat
```

**بعدها:**
```bash
CHECK_ADMIN_EXISTS.bat
```

---

**آخر تحديث:** 22 ديسمبر 2025

