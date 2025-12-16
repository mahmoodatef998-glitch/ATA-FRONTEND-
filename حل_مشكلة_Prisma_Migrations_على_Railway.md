# 🔧 حل مشكلة Prisma Migrations على Railway

**المشكلة:** `railway run npx prisma migrate status` يتوقف ولا يكمل

---

## 🔍 السبب:

`railway run` يستخدم `DATABASE_URL` (Pooler - port 6543) للمايجريشنز، لكن المايجريشنز تحتاج `DIRECT_URL` (Direct - port 5432).

---

## ✅ الحل:

### الطريقة 1: استخدام DIRECT_URL مباشرة

شغّل:
```bash
railway run --env DIRECT_URL="postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres" npx prisma migrate deploy
```

---

### الطريقة 2: التحقق من Environment Variables في Railway

1. افتح Railway Dashboard
2. Service → "ATA-BACKEND-" → Settings → Variables
3. تأكد من وجود:
   - `DATABASE_URL` = Pooler URL (port 6543)
   - `DIRECT_URL` = Direct URL (port 5432)

---

### الطريقة 3: استخدام Prisma مع DIRECT_URL

شغّل:
```bash
railway run env DIRECT_URL="postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres" npx prisma migrate deploy
```

---

## 🎯 الحل الأسهل:

### استخدم Railway Dashboard → Shell (إن وجد)

أو استخدم الأمر التالي مع تحديد DIRECT_URL:

```bash
railway run --env DIRECT_URL="postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres" npx prisma migrate deploy
```

---

## 📝 ملاحظة:

- `DATABASE_URL` = للاستخدام العادي (Pooler)
- `DIRECT_URL` = للمايجريشنز فقط (Direct)

---

**✅ جرب الطريقة 1 أو 3!**

