# 🗄️ خطوات تنفيذ Prisma Migrations - خطوة بخطوة

**دليل شامل مع جميع المسارات والأوامر**

---

## 📋 الخطوات الكاملة:

### **الخطوة 1: افتح PowerShell**

1. اضغط `Win + X` على لوحة المفاتيح
2. اختر **"Windows PowerShell"** أو **"Terminal"**
3. انتظر حتى يفتح PowerShell

---

### **الخطوة 2: اذهب إلى مجلد المشروع**

في PowerShell، اكتب:

```powershell
cd "E:\coding\ATA CRM PROJECT\ata-crm-backend"
```

ثم اضغط **Enter**

**يجب أن ترى:**
```
PS E:\coding\ATA CRM PROJECT\ata-crm-backend>
```

---

### **الخطوة 3: تأكد من أنك في المجلد الصحيح**

اكتب:

```powershell
pwd
```

اضغط **Enter**

**يجب أن ترى:**
```
Path
----
E:\coding\ATA CRM PROJECT\ata-crm-backend
```

---

### **الخطوة 4: تحقق من ربط Railway (اختياري)**

اكتب:

```powershell
railway link
```

اضغط **Enter**

**إذا كان مربوط بالفعل، سترى:**
```
Project aware-heart linked successfully! 🎉
```

**إذا لم يكن مربوط:**
- اختر المشروع: **"aware-heart"**
- اختر Environment: **"production"**
- اختر Service: **"ATA-BACKEND-"**

---

### **الخطوة 5: شغّل Prisma Migrations**

اكتب:

```powershell
railway run npx prisma migrate deploy
```

اضغط **Enter**

---

### **الخطوة 6: انتظر النتيجة**

**يجب أن ترى:**

```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "postgres", schema "public" at "..."

✅ Applied migration: 20251103101743_init
✅ Applied migration: 20251104082904_add_quotation_files_and_client_accounts
✅ Applied migration: 20251104104103_add_client_comment_to_quotations
✅ Applied migration: add_hr_role
✅ Applied migration: add_rbac_tables

All migrations have been successfully applied.
```

---

## 🎯 الأوامر الكاملة (نسخ ولصق):

### **الطريقة 1: خطوة بخطوة**

```powershell
cd "E:\coding\ATA CRM PROJECT\ata-crm-backend"
railway run npx prisma migrate deploy
```

---

### **الطريقة 2: في سطر واحد**

```powershell
cd "E:\coding\ATA CRM PROJECT\ata-crm-backend"; railway run npx prisma migrate deploy
```

---

## ⚠️ إذا توقف الأمر:

### **المشكلة:**
الأمر يتوقف عند:
```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "postgres", schema "public" at "..."
```

### **الحل:**

1. **انتظر 30-60 ثانية** (قد يستغرق وقتاً)

2. **إذا لم يكتمل:**
   - اضغط `Ctrl + C` لإلغاء الأمر
   - جرب الحل البديل أدناه

---

## 🔄 الحل البديل: استخدام Prisma محلياً

إذا لم يعمل `railway run`، جرب:

```powershell
cd "E:\coding\ATA CRM PROJECT\ata-crm-backend"
$env:DIRECT_URL="postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres"
$env:DATABASE_URL="postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
npx prisma migrate deploy
```

**⚠️ ملاحظة:** قد لا يعمل من جهازك إذا كان Supabase يمنع الاتصال المباشر.

---

## ✅ Checklist:

- [ ] فتحت PowerShell
- [ ] ذهبت إلى مجلد المشروع
- [ ] تحققت من المسار (`pwd`)
- [ ] شغّلت `railway run npx prisma migrate deploy`
- [ ] انتظرت النتيجة
- [ ] رأيت رسائل "✅ Applied migration"

---

## 📝 ملاحظات مهمة:

1. **المسار:** `E:\coding\ATA CRM PROJECT\ata-crm-backend`
2. **الأمر:** `railway run npx prisma migrate deploy`
3. **الوقت المتوقع:** 1-3 دقائق
4. **النتيجة المتوقعة:** رسائل "✅ Applied migration"

---

## 🆘 إذا واجهت مشكلة:

### **المشكلة 1: "railway: command not found"**

**الحل:**
```powershell
npm install -g @railway/cli
railway login
```

---

### **المشكلة 2: "Project not linked"**

**الحل:**
```powershell
railway link
```

---

### **المشكلة 3: الأمر يتوقف ولا يكتمل**

**الحل:**
- انتظر 60 ثانية
- إذا لم يكتمل، استخدم الحل البديل (Prisma محلياً)
- أو استخدم Supabase SQL Editor

---

## 🎯 الخلاصة:

**الأوامر الأساسية:**

```powershell
# 1. اذهب إلى المجلد
cd "E:\coding\ATA CRM PROJECT\ata-crm-backend"

# 2. شغّل Migrations
railway run npx prisma migrate deploy
```

---

**✅ جاهز!** اتبع الخطوات بالترتيب وأخبرني بالنتيجة! 🚀

