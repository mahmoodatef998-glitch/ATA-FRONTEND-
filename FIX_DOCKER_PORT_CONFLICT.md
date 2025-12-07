# 🔧 إصلاح مشكلة Port 5432 في Docker

## ❌ المشكلة:
```
(HTTP code 500) server error - failed to set up container networking: 
driver failed programming external connectivity on endpoint my-postgres: 
Bind for 0.0.0.0:5432 failed: port is already allocated
```

---

## 🔍 السبب:
- Container `ata-crm-postgres` يعمل بالفعل على Port 5432
- Container `my-postgres` محاول يبدأ على نفس Port (محجوز)

---

## ✅ الحل:

### 1. حذف Container `my-postgres` القديم:

```bash
docker rm -f my-postgres
```

### 2. استخدام Container `ata-crm-postgres` الموجود:

Container `ata-crm-postgres` يعمل بالفعل على Port 5432 ✅

---

## 📝 التحقق من DATABASE_URL:

تأكد من أن ملف `.env` يحتوي على:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ata_crm"
```

أو:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/your_database_name"
```

---

## 🔍 التحقق من الحالة:

### 1. فحص Containers:

```bash
docker ps
```

يجب أن ترى:
```
CONTAINER ID   IMAGE     STATUS         PORTS
xxx            postgres  Up X minutes   0.0.0.0:5432->5432/tcp
```

### 2. فحص الاتصال:

```bash
docker exec ata-crm-postgres pg_isready -U postgres
```

يجب أن ترى:
```
/var/run/postgresql:5432 - accepting connections
```

---

## ⚠️ إذا أردت استخدام Container آخر:

### خيار 1: استخدام Port مختلف

```bash
docker run -d \
  --name my-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ata_crm \
  -p 5433:5432 \
  postgres:latest
```

ثم غيّر `DATABASE_URL` إلى:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/ata_crm"
```

### خيار 2: إيقاف Container الحالي

```bash
docker stop ata-crm-postgres
docker start my-postgres
```

---

## ✅ بعد الإصلاح:

1. **تحقق من Container:**
   ```bash
   docker ps
   ```

2. **تحقق من DATABASE_URL في .env**

3. **أعد تشغيل Next.js:**
   ```bash
   npm run dev
   ```

---

## 📝 ملاحظات:

- **Port 5432** هو الـ Port الافتراضي لـ PostgreSQL
- **Container واحد فقط** يمكنه استخدام Port 5432 في نفس الوقت
- **استخدم Port مختلف** (مثل 5433) إذا أردت تشغيل Container آخر

