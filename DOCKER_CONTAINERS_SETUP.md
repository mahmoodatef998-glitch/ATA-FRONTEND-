# 🐳 إعداد Docker Containers للمشاريع

## 📊 الوضع الحالي:

### ✅ Container 1: `ata-crm-postgres` (المشروع العادي)
- **Status:** Running
- **Port:** 5432
- **Image:** postgres:16-alpine
- **Database:** ata_crm
- **Username:** postgres
- **Password:** postgres123

**DATABASE_URL:**
```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/ata_crm"
```

---

### ✅ Container 2: `postgres-alrabei` (مشروع العقارات - rabea)
- **Status:** Running
- **Port:** 5433
- **Image:** postgres:15
- **Database:** alrabei
- **Username:** postgres
- **Password:** postgres123

**DATABASE_URL:**
```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5433/alrabei"
```

---

## 🔧 الأوامر المفيدة:

### فحص جميع Containers:
```bash
docker ps -a
```

### فحص Container محدد:
```bash
docker ps --filter "name=ata-crm-postgres"
docker ps --filter "name=postgres-alrabei"
```

### إيقاف Container:
```bash
docker stop ata-crm-postgres
docker stop postgres-alrabei
```

### تشغيل Container:
```bash
docker start ata-crm-postgres
docker start postgres-alrabei
```

### إعادة تشغيل Container:
```bash
docker restart ata-crm-postgres
docker restart postgres-alrabei
```

### فحص الاتصال:
```bash
# للمشروع العادي
docker exec ata-crm-postgres pg_isready -U postgres

# لمشروع العقارات
docker exec postgres-alrabei pg_isready -U postgres
```

---

## ⚠️ ملاحظات مهمة:

1. **Ports مختلفة:**
   - المشروع العادي: Port 5432
   - مشروع العقارات: Port 5433

2. **لا يمكن استخدام نفس Port:**
   - إذا أردت تشغيل Container آخر، استخدم Port مختلف (5434, 5435, إلخ)

3. **DATABASE_URL:**
   - تأكد من استخدام Port الصحيح في ملف `.env` لكل مشروع

---

## 🚀 تشغيل Containers تلقائياً:

### استخدام docker-compose (للمشروع العادي):
```bash
docker-compose up -d
```

### تشغيل Container يدوياً:
```bash
# المشروع العادي
docker start ata-crm-postgres

# مشروع العقارات
docker start postgres-alrabei
```

---

## 🔍 التحقق من الحالة:

### فحص Ports المستخدمة:
```bash
# Windows PowerShell
netstat -ano | findstr ":5432"
netstat -ano | findstr ":5433"
```

### فحص Containers:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

---

## ✅ بعد الإعداد:

1. **تحقق من Containers:**
   ```bash
   docker ps
   ```

2. **تحقق من DATABASE_URL في .env:**
   - للمشروع العادي: Port 5432
   - لمشروع العقارات: Port 5433

3. **أعد تشغيل Next.js:**
   ```bash
   npm run dev
   ```

