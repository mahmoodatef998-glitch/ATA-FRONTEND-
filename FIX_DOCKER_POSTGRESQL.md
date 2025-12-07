# 🐳 إصلاح PostgreSQL على Docker Desktop

## ❌ المشكلة:
PostgreSQL يعمل على Docker Desktop لكن السيرفر لا يتصل به.

---

## 🔧 الحلول:

### 1. التحقق من Docker Desktop:

#### الخطوة 1: افتح Docker Desktop
- تأكد من أن Docker Desktop يعمل
- تحقق من أن Status: Running في الأسفل

#### الخطوة 2: تحقق من PostgreSQL Container
1. افتح Docker Desktop
2. اذهب إلى **Containers**
3. ابحث عن container يحتوي على `postgres` في الاسم
4. تحقق من Status:
   - ✅ **Running** = يعمل
   - ⚠️ **Exited** = متوقف (اضغط **Start**)

---

### 2. تشغيل PostgreSQL Container:

#### من Docker Desktop:
1. افتح Docker Desktop
2. اذهب إلى **Containers**
3. ابحث عن PostgreSQL container
4. اضغط **Start** (إذا كان متوقفاً)

#### من Command Line:
```bash
# عرض جميع containers
docker ps -a

# عرض فقط PostgreSQL containers
docker ps -a --filter "name=postgres"

# تشغيل container (استبدل <container-name> بالاسم الصحيح)
docker start <container-name>

# مثال:
docker start postgres
# أو
docker start postgresql
# أو
docker start postgres-15
```

---

### 3. التحقق من Port Mapping:

PostgreSQL في Docker يجب أن يكون مربوط بـ Port 5432:

```bash
# عرض Port mapping
docker ps --filter "name=postgres" --format "table {{.Names}}\t{{.Ports}}"
```

يجب أن ترى شيء مثل:
```
NAMES      PORTS
postgres   0.0.0.0:5432->5432/tcp
```

---

### 4. التحقق من DATABASE_URL:

افتح ملف `.env` وتأكد من:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

**مثال صحيح:**
```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/ata_crm"
```

**تأكد من:**
- ✅ Username صحيح (عادة `postgres`)
- ✅ Password صحيح
- ✅ Database name صحيح
- ✅ Host: `localhost` (ليس `127.0.0.1`)
- ✅ Port: `5432`

---

### 5. اختبار الاتصال:

```bash
# اختبار الاتصال من Command Line
docker exec -it <container-name> psql -U postgres -d ata_crm

# أو من خارج Docker
psql -h localhost -p 5432 -U postgres -d ata_crm
```

---

## 🚀 خطوات سريعة:

### 1. شغل Docker Desktop

### 2. شغل PostgreSQL Container:
```bash
docker start <postgres-container-name>
```

### 3. تحقق من DATABASE_URL في `.env`

### 4. أعد تشغيل Next.js Server:
```bash
npm run dev
```

---

## ⚠️ مشاكل شائعة:

### 1. Container متوقف:
```bash
# شغله
docker start <container-name>

# تحقق من Logs
docker logs <container-name>
```

### 2. Port 5432 مستخدم:
```bash
# تحقق من Port
netstat -ano | findstr ":5432"

# إذا كان مستخدم، غير Port في docker-compose.yml أو docker run
```

### 3. DATABASE_URL خاطئ:
- تحقق من Username/Password
- تحقق من Database name
- تأكد من `localhost` وليس `127.0.0.1`

### 4. Docker Desktop غير مشغل:
- افتح Docker Desktop
- انتظر حتى يبدأ بالكامل
- تحقق من Status: Running

---

## 📋 مثال docker-compose.yml:

إذا كنت تستخدم docker-compose:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    container_name: postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
      POSTGRES_DB: ata_crm
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## ✅ بعد الإصلاح:

1. ✅ PostgreSQL Container يعمل
2. ✅ Port 5432 مربوط
3. ✅ DATABASE_URL صحيح
4. ✅ Next.js Server يعمل

---

## 🔍 إذا استمرت المشكلة:

1. تحقق من Docker Desktop Logs
2. تحقق من Container Logs: `docker logs <container-name>`
3. تحقق من Next.js Server Logs
4. أعد تشغيل Docker Desktop


