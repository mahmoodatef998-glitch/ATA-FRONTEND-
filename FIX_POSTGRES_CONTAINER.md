# 🔧 إصلاح مشكلة PostgreSQL Container

## 📊 الوضع الحالي:

من Docker Desktop:
- ✅ **my-postgres18**: Running على Port **5433:5432**
- ⚠️ **my-postgres**: Stopped على Port **5432:5432**

## ❌ المشكلة:

- DATABASE_URL في `.env` يستخدم `localhost:5432`
- لكن Container المتصل بـ Port 5432 (`my-postgres`) متوقف
- Container الذي يعمل (`my-postgres18`) مربوط بـ Port 5433

---

## ✅ الحلول:

### الحل 1: تشغيل my-postgres (موصى به) ⭐

هذا الحل أفضل لأنه يستخدم Port 5432 الموجود في DATABASE_URL.

#### من Docker Desktop:
1. افتح Docker Desktop
2. اذهب إلى **Containers**
3. ابحث عن **my-postgres**
4. اضغط على زر **Play/Start** (▶️)
5. انتظر حتى Status يصبح **Running**

#### من Command Line:
```bash
docker start my-postgres
```

#### بعد التشغيل:
```bash
# أوقف Next.js Server (Ctrl+C)
# ثم شغله مرة أخرى
npm run dev
```

---

### الحل 2: استخدام my-postgres18 (Port 5433)

إذا أردت استخدام Container الذي يعمل بالفعل:

#### 1. غير DATABASE_URL في `.env`:

**من:**
```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/ata_crm"
```

**إلى:**
```env
DATABASE_URL="postgresql://postgres:postgres123@localhost:5433/ata_crm"
```

#### 2. أعد تشغيل Next.js Server:
```bash
npm run dev
```

---

## 🎯 الحل الموصى به:

**استخدم الحل 1** (تشغيل my-postgres) لأنه:
- ✅ لا يحتاج تغيير في `.env`
- ✅ يستخدم Port 5432 الموجود بالفعل
- ✅ أسرع وأسهل

---

## ✅ بعد الإصلاح:

1. ✅ Container `my-postgres` يعمل (Running)
2. ✅ Port 5432 مربوط
3. ✅ DATABASE_URL صحيح
4. ✅ Next.js Server يعمل

---

## 🔍 التحقق:

بعد تشغيل Container، تحقق من:
```bash
# عرض Containers
docker ps

# يجب أن ترى my-postgres في القائمة مع Status: Up
```

---

## ⚠️ ملاحظة:

إذا كان لديك Containerين مختلفين:
- `my-postgres` - للاستخدام العام (Port 5432)
- `my-postgres18` - لاختبارات أخرى (Port 5433)

تأكد من تشغيل `my-postgres` للاستخدام مع Next.js.


