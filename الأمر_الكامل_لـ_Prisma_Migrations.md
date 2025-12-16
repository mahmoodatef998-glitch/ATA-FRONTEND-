# 🗄️ الأمر الكامل لـ Prisma Migrations على Railway

**المسار الكامل خطوة بخطوة**

---

## 📋 الخطوات الكاملة:

### 1. افتح PowerShell

- اضغط `Win + X`
- اختر "Windows PowerShell" أو "Terminal"

---

### 2. اذهب إلى مجلد المشروع

```powershell
cd "E:\coding\ATA CRM PROJECT\ata-crm-backend"
```

---

### 3. تأكد من أنك في المجلد الصحيح

```powershell
pwd
```

يجب أن ترى:
```
E:\coding\ATA CRM PROJECT\ata-crm-backend
```

---

### 4. تأكد من ربط Railway

```powershell
railway link
```

إذا كان مربوط بالفعل، سترى:
```
Project aware-heart linked successfully! 🎉
```

---

### 5. شغّل Prisma Migrations

```powershell
railway run npx prisma migrate deploy
```

---

## 🎯 الأمر الكامل (نسخ ولصق):

```powershell
cd "E:\coding\ATA CRM PROJECT\ata-crm-backend"
railway run npx prisma migrate deploy
```

---

## 📝 إذا لم يعمل:

### جرب مع تحديد Service:

```powershell
railway run --service ATA-BACKEND- npx prisma migrate deploy
```

---

## ✅ ما يجب أن تراه بعد تشغيل الأمر:

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

## ⚠️ إذا توقف الأمر:

1. انتظر 30-60 ثانية
2. إذا لم يكتمل، اضغط `Ctrl + C` لإلغائه
3. جرب الحل البديل (SQL Editor)

---

**✅ جاهز!** انسخ الأمر وألصقه في PowerShell!

