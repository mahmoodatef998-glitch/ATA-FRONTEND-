# 🔄 العودة إلى Direct Connection

## ⚠️ المشكلة
Transaction Pooler لا يعمل بشكل صحيح، نعود إلى Direct Connection

---

## ✅ DATABASE_URL الجديد (Direct Connection)

### للـ Vercel Environment Variables:

```
DATABASE_URL=postgresql://postgres:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres
```

**الفرق:**
- ❌ Port `6543` (Transaction Pooler) → ✅ Port `5432` (Direct)
- ❌ Host `pooler.supabase.com` → ✅ Host `db.xvpjqmftyqipyqomnkgm.supabase.co`
- ❌ Parameters `?connection_limit=...` → ✅ بدون Parameters

---

## 📝 خطوات التحديث في Vercel

### 1. افتح Vercel Dashboard
```
https://vercel.com/dashboard
```

### 2. مشروعك → Settings → Environment Variables

### 3. ابحث عن `DATABASE_URL`

### 4. اضغط Edit

### 5. استبدل القيمة القديمة بهذه:

```
postgresql://postgres:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres
```

### 6. Save

### 7. عمل Redeploy:
   - Deployments → آخر deployment → ⋮ → Redeploy

---

## 📝 تحديث ملف .env المحلي

### افتح `.env` واستبدل `DATABASE_URL`:

```bash
DATABASE_URL="postgresql://postgres:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres"
```

---

## ✅ التحقق من التغيير

### قبل (Transaction Pooler):
```
postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?connection_limit=20&pool_timeout=10&connect_timeout=10&sslmode=require
```

### بعد (Direct Connection):
```
postgresql://postgres:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres
```

---

## ⚠️ ملاحظات

1. **Direct Connection** يعمل بشكل أفضل للـ migrations
2. قد يكون أبطأ قليلاً في Production لكنه أكثر استقراراً
3. لا يحتاج Parameters إضافية

---

## 🔍 إذا استمرت المشكلة

تحقق من:
1. ✅ DATABASE_URL محدث في Vercel
2. ✅ تم عمل Redeploy
3. ✅ Password صحيح: `M00243540000m`
4. ✅ Database accessible من Supabase Dashboard

---

**تاريخ:** 2024-12-XX

