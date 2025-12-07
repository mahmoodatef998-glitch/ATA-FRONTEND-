# 🔧 إصلاح مشكلة الاتصال بقاعدة البيانات

## ❌ المشكلة:
```
Database `ata_crm` does not exist
Invalid `prisma.$queryRaw()` invocation
```

**السبب:** `DATABASE_URL` في ملف `.env` كان يشير إلى Port 5433 بدلاً من Port 5432.

---

## ✅ الحل المطبق:

### 1️⃣ تصحيح DATABASE_URL:

**قبل:**
```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5433/ata_crm"
```

**بعد:**
```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/ata_crm"
```

---

## 📊 الوضع الحالي:

### Container: `ata-crm-postgres`
- **Status:** Running (healthy)
- **Port:** 5432 ✅
- **Database:** `ata_crm` ✅
- **Username:** `postgres`
- **Password:** `postgres123`

---

## 🔍 التحقق من الحالة:

### 1. فحص Container:
```bash
docker ps --filter "name=ata-crm-postgres"
```

### 2. فحص قاعدة البيانات:
```bash
docker exec ata-crm-postgres psql -U postgres -c "\l" | findstr "ata_crm"
```

### 3. التحقق من الاتصال:
```bash
docker exec ata-crm-postgres psql -U postgres -d ata_crm -c "SELECT version();"
```

---

## 🚀 الخطوات التالية:

### 1. إغلاق Next.js Server (إن كان يعمل):
```bash
# اضغط Ctrl+C في Terminal الذي يعمل فيه Server
```

### 2. توليد Prisma Client:
```bash
npx prisma generate
```

### 3. تشغيل Migrations (إن لم تكن مطبقة):
```bash
npx prisma migrate deploy
```

### 4. إعادة تشغيل Next.js Server:
```bash
npm run dev
```

---

## ⚠️ ملاحظات مهمة:

1. **Port 5432** = Container `ata-crm-postgres` (ATA CRM)
2. **Port 5433** = Container `postgres-alrabei` (مشروع العقارات)
3. **تأكد من استخدام Port الصحيح** في `DATABASE_URL`

---

## ✅ بعد الإصلاح:

- ✅ `DATABASE_URL` مصحح إلى Port 5432
- ✅ قاعدة البيانات `ata_crm` موجودة
- ✅ Migrations مطبقة
- ✅ جاهز لتشغيل Next.js Server

---

## 🔍 إذا استمرت المشكلة:

### 1. تحقق من Container:
```bash
docker ps
```

### 2. تحقق من DATABASE_URL:
```bash
# في PowerShell
Get-Content .env | Select-String "DATABASE_URL"
```

### 3. أعد تشغيل Container:
```bash
docker restart ata-crm-postgres
```

### 4. تحقق من الاتصال:
```bash
docker exec ata-crm-postgres pg_isready -U postgres
```
