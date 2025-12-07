# 🔧 إصلاح Container HTTP 500 Error

## ❌ المشكلة:
Container `my-postgres` يفشل في التشغيل ويعطي HTTP 500 error.

---

## 🔍 الأسباب المحتملة:

1. **Docker Desktop API Error**
   - Docker Desktop قد يحتاج إعادة تشغيل
   - قد يكون هناك مشكلة في Docker Engine

2. **Container Corrupted**
   - Container قد يكون تالف
   - قد يكون هناك مشكلة في البيانات

3. **Port Conflict**
   - Port 5432 قد يكون مستخدم من قبل process آخر
   - قد يكون هناك conflict مع container آخر

---

## ✅ الحلول:

### الحل 1: استخدام my-postgres18 (تم تطبيقه) ⭐

**تم تغيير DATABASE_URL تلقائياً:**
- من: `localhost:5432` 
- إلى: `localhost:5433`

**الآن:**
1. أوقف Next.js Server (Ctrl+C)
2. شغله مرة أخرى: `npm run dev`

---

### الحل 2: إعادة تشغيل Docker Desktop

1. أغلق Docker Desktop تماماً
2. افتحه مرة أخرى
3. انتظر حتى يبدأ بالكامل (Engine running)
4. حاول تشغيل `my-postgres` مرة أخرى

---

### الحل 3: حذف وإعادة إنشاء Container

```bash
# أوقف Container (إذا كان يعمل)
docker stop my-postgres

# احذف Container
docker rm my-postgres

# أنشئ Container جديد
docker run -d \
  --name my-postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -e POSTGRES_DB=ata_crm \
  -p 5432:5432 \
  postgres:18
```

**أو من Docker Desktop:**
1. احذف Container `my-postgres`
2. أنشئ Container جديد:
   - Image: `postgres:18`
   - Name: `my-postgres`
   - Port: `5432:5432`
   - Environment:
     - `POSTGRES_PASSWORD=postgres123`
     - `POSTGRES_DB=ata_crm`

---

### الحل 4: فحص Logs

```bash
# عرض آخر 50 سطر من Logs
docker logs my-postgres --tail 50

# عرض Logs بشكل مستمر
docker logs -f my-postgres
```

---

## 🎯 الحل المطبق:

**تم استخدام الحل 1** (تغيير DATABASE_URL):
- ✅ أسرع وأسهل
- ✅ لا يحتاج إعادة تشغيل Docker
- ✅ يستخدم Container الذي يعمل بالفعل

---

## 📝 بعد الإصلاح:

1. ✅ DATABASE_URL يستخدم Port 5433
2. ✅ يستخدم my-postgres18 الذي يعمل
3. ✅ Next.js Server يجب أن يعمل الآن

---

## ⚠️ ملاحظة:

إذا أردت العودة لاستخدام Port 5432 لاحقاً:
1. أصلح Container `my-postgres`
2. غيّر DATABASE_URL مرة أخرى إلى `:5432`

---

## 🔍 التحقق:

بعد إعادة تشغيل Next.js Server، تحقق من:
- ✅ لا توجد أخطاء Database connection
- ✅ السيرفر يعمل بشكل طبيعي
- ✅ يمكنك تسجيل الدخول


