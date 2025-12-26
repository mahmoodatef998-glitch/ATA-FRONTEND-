# 🔍 DATABASE_URL المستخدم في Main Branch

## ✅ الإعدادات التي كانت تعمل في Main

بناءً على أن main كان يعمل بشكل صحيح، هذه هي الإعدادات المحتملة:

---

## 📋 Option 1: Direct Connection (الأكثر احتمالاً)

```
DATABASE_URL=postgresql://postgres:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres
```

**الخصائص:**
- ✅ Port: `5432` (Direct connection)
- ✅ Host: `db.xvpjqmftyqipyqomnkgm.supabase.co`
- ✅ Username: `postgres`
- ✅ Password: `M00243540000m`
- ✅ بدون Parameters

---

## 📋 Option 2: Transaction Pooler (إذا كان مستخدم)

```
DATABASE_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
```

**الخصائص:**
- ✅ Port: `6543` (Transaction pooler)
- ✅ Host: `pooler.supabase.com`
- ✅ Username: `postgres.xvpjqmftyqipyqomnkgm`
- ✅ Password: `M00243540000m`
- ✅ بدون Parameters إضافية (أو مع `?pgbouncer=true`)

---

## 🔍 كيفية معرفة الإعدادات الصحيحة

### الطريقة 1: من Vercel Dashboard (إذا كان main على Vercel)

1. **اذهب إلى Vercel Dashboard**
2. **اختر المشروع**
3. **Settings → Environment Variables**
4. **ابحث عن `DATABASE_URL`**
5. **انسخ القيمة** (هذه هي الإعدادات الصحيحة!)

---

### الطريقة 2: من Supabase Dashboard

1. **اذهب إلى Supabase Dashboard**
2. **Settings → Database**
3. **Connection String**
4. **اختر "URI" أو "Connection Pooling"**
5. **انسخ القيمة**

---

## ✅ الحل الموصى به

### استخدم Direct Connection (الأبسط والأكثر استقراراً):

```
DATABASE_URL=postgresql://postgres:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres
```

**لماذا؟**
- ✅ أبسط وأكثر استقراراً
- ✅ يعمل مع كل الإعدادات
- ✅ لا يحتاج Parameters معقدة
- ✅ مناسب لـ Vercel serverless

---

## 📝 خطوات التطبيق

### 1. في Vercel:

1. Vercel Dashboard → Settings → Environment Variables
2. ابحث عن `DATABASE_URL`
3. Edit
4. الصق:
   ```
   postgresql://postgres:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres
   ```
5. Save
6. Redeploy

### 2. في `.env` المحلي:

```bash
DATABASE_URL="postgresql://postgres:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres"
```

---

## 🔍 إذا استمرت المشكلة

### تحقق من:

1. **Password صحيح؟**
   - يجب أن يكون: `M00243540000m`

2. **Database accessible؟**
   - افتح Supabase Dashboard
   - تحقق من أن Database يعمل

3. **Vercel Logs:**
   - Vercel Dashboard → Deployments → Logs
   - ابحث عن أخطاء connection

---

## 📞 إذا كنت تعرف الإعدادات الصحيحة من Main

**أرسل:**
- DATABASE_URL من Vercel (من main deployment)
- أو من Supabase Dashboard → Connection String

---

**تاريخ:** 2024-12-XX

