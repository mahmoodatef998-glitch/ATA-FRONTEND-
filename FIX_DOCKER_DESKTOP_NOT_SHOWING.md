# 🔧 إصلاح مشكلة عدم ظهور Container في Docker Desktop

## ❌ المشكلة:
Container `ata-crm-postgres` موجود ويعمل، لكن لا يظهر في Docker Desktop.

---

## ✅ الحلول:

### 1️⃣ تحديث Docker Desktop (Refresh)

1. **افتح Docker Desktop**
2. **اضغط F5** أو **Right Click → Refresh**
3. **تحقق من Containers tab**

---

### 2️⃣ إعادة تشغيل Docker Desktop

1. **اضغط Right Click على أيقونة Docker** في System Tray (أسفل يمين الشاشة)
2. **اختر "Restart Docker Desktop"**
3. **انتظر حتى يبدأ (30-60 ثانية)**
4. **افتح Docker Desktop مرة أخرى**

---

### 3️⃣ البحث في Docker Desktop

1. **افتح Docker Desktop**
2. **اذهب إلى Containers tab**
3. **استخدم Search Box** وابحث عن:
   - `ata-crm-postgres`
   - أو `ata-crm`
   - أو `postgres`

---

### 4️⃣ التحقق من Filters

1. **افتح Docker Desktop**
2. **اذهب إلى Containers tab**
3. **تحقق من Filters:**
   - تأكد من أن "All" أو "Running" مفعل
   - لا تستخدم Filter يخفي Container

---

### 5️⃣ التحقق من Terminal

شغّل هذا الأمر في Terminal للتحقق:

```bash
docker ps
```

يجب أن ترى:
```
CONTAINER ID   IMAGE                 STATUS         PORTS
xxx            postgres:16-alpine     Up X minutes   0.0.0.0:5432->5432/tcp
```

---

## 🔍 معلومات Container:

- **الاسم:** `ata-crm-postgres`
- **Image:** `postgres:16-alpine`
- **Port:** `5432`
- **Status:** `Running (healthy)`

---

## ✅ التحقق من الحالة:

### من Terminal:
```bash
# فحص جميع Containers
docker ps -a

# فحص Container محدد
docker ps --filter "name=ata-crm-postgres"

# فحص التفاصيل
docker inspect ata-crm-postgres
```

---

## 🚀 إذا لم يظهر بعد:

### 1. إعادة إنشاء Container:

```bash
# إيقاف وحذف Container القديم
docker stop ata-crm-postgres
docker rm ata-crm-postgres

# إعادة إنشائه من docker-compose
docker-compose up -d
```

### 2. التحقق من docker-compose.yml:

تأكد من أن ملف `docker-compose.yml` موجود ويحتوي على:

```yaml
services:
  postgres:
    container_name: ata-crm-postgres
    ...
```

---

## 📝 ملاحظات:

- **Container موجود ويعمل** ✅
- **المشكلة في Docker Desktop UI فقط** (قد يحتاج Refresh)
- **استخدم Terminal** للتحقق من الحالة

---

## ✅ بعد الإصلاح:

1. **تحقق من Docker Desktop** - يجب أن ترى Container
2. **تحقق من Port 5432** - يجب أن يكون متاح
3. **أعد تشغيل Next.js:**
   ```bash
   npm run dev
   ```

