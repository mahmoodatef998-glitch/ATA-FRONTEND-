# 🔧 إصلاح مشكلة الاتصال بـ PostgreSQL على Port 5433

## ❌ المشكلة:
```
PostgreSQL: Connection failed
Invalid `prisma.$queryRaw()` invocation
```

---

## ✅ الحلول:

### الحل 1: تشغيل Container من Docker Desktop ⭐

1. **افتح Docker Desktop**
2. **ابحث عن Container `my-postgres18`**
3. **اضغط Play (▶️) لتشغيله**
4. **انتظر حتى Status = Running**
5. **أعد تشغيل Next.js Server**

---

### الحل 2: تشغيل Container من Terminal

```bash
# تشغيل Container
docker start my-postgres18

# التحقق من الحالة
docker ps --filter "name=my-postgres18"

# إذا كان Container غير موجود، أنشئه:
docker run -d \
  --name my-postgres18 \
  -e POSTGRES_PASSWORD=postgres123 \
  -e POSTGRES_DB=ata_crm \
  -p 5433:5432 \
  postgres:18
```

---

### الحل 3: التحقق من DATABASE_URL

تأكد من أن `.env` يحتوي على:

```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5433/ata_crm"
```

**ملاحظة:** يجب أن يكون Port `5433` (وليس `5432`)

---

### الحل 4: إعادة تشغيل Next.js Server

بعد تشغيل Container:

1. **أوقف Next.js Server** (Ctrl+C)
2. **شغّله مرة أخرى:**
   ```bash
   npm run dev
   ```

---

## 🔍 التحقق من الحالة:

```bash
# فحص Container
docker ps --filter "name=my-postgres18"

# فحص Logs
docker logs my-postgres18 --tail 20

# اختبار الاتصال
docker exec -it my-postgres18 psql -U postgres -d ata_crm -c "SELECT 1;"
```

---

## ⚠️ إذا استمرت المشكلة:

1. **تحقق من أن Docker Desktop يعمل**
2. **تحقق من أن Port 5433 غير مستخدم من قبل process آخر**
3. **أعد تشغيل Docker Desktop**
4. **احذف Container وأنشئه من جديد** (إذا لزم الأمر)

---

## 📝 ملاحظات:

- **Port 5433** = `my-postgres18` Container
- **Port 5432** = `my-postgres` Container (قد يكون متوقفاً)
- تأكد من استخدام Port الصحيح في `DATABASE_URL`


