# 🚀 دليل النشر الكامل (Complete Deployment Guide)

## 📋 نظرة عامة

هذا الدليل يشرح كيفية نشر المشروع على:
- ✅ **Frontend** → Vercel
- ✅ **Backend** → Railway
- ✅ **Database** → Supabase

---

## 🗄️ Step 1: إعداد Supabase Database

### 1.1 إنشاء Supabase Project

1. اذهب إلى [supabase.com](https://supabase.com)
2. سجل حساب جديد (أو سجل دخول)
3. اضغط "New Project"
4. اختر:
   - **Name**: `ata-crm-db`
   - **Database Password**: (احفظها!)
   - **Region**: اختر الأقرب لك

### 1.2 الحصول على Connection Strings

بعد إنشاء المشروع:

1. اذهب إلى **Settings** → **Database**
2. ابحث عن **Connection String** → **URI**
3. انسخ:
   - **Connection Pooling** (للـ `DATABASE_URL`)
   - **Direct Connection** (للـ `DIRECT_URL`)

**مثال:**
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

### 1.3 الحصول على API Keys

1. اذهب إلى **Settings** → **API**
2. انسخ:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ سري!)

### 1.4 تشغيل Migrations

```bash
# في المشروع المحلي
cd apps/backend
npx prisma migrate deploy
```

أو في Supabase SQL Editor:
```sql
-- انسخ محتوى prisma/migrations/.../migration.sql
```

---

## 🚂 Step 2: نشر Backend على Railway

### 2.1 إنشاء Railway Account

1. اذهب إلى [railway.app](https://railway.app)
2. سجل بحساب GitHub
3. اضغط "New Project"

### 2.2 ربط GitHub Repository

1. اختر "Deploy from GitHub repo"
2. اختر repository الخاص بك
3. Railway سيكتشف المشروع تلقائياً

### 2.3 إعداد Service

1. Railway قد ينشئ service تلقائياً
2. إذا لم يفعل، اضغط "New Service" → "GitHub Repo"
3. اختر repository

### 2.4 إعداد Build Settings

في Railway Dashboard:

1. اضغط على Service
2. اذهب إلى **Settings** → **Source**
3. اضبط:
   - **Root Directory**: `apps/backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`

### 2.5 إضافة Environment Variables

في Railway Dashboard → **Variables**:

```env
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Auth
JWT_SECRET=your_random_secret_here
NEXTAUTH_URL=https://your-backend.railway.app
NEXTAUTH_SECRET=your_random_secret_here

# Server
PORT=3001
NODE_ENV=production
```

**ملاحظة:** Railway سيعطيك URL مثل `https://your-backend.railway.app`

### 2.6 Deploy

1. Railway سيبدأ Deploy تلقائياً
2. انتظر حتى يكتمل Build
3. احصل على URL من Railway Dashboard

---

## ⚡ Step 3: نشر Frontend على Vercel

### 3.1 إنشاء Vercel Account

1. اذهب إلى [vercel.com](https://vercel.com)
2. سجل بحساب GitHub
3. اضغط "Add New Project"

### 3.2 ربط GitHub Repository

1. اختر repository الخاص بك
2. Vercel سيكتشف Next.js تلقائياً

### 3.3 إعداد Build Settings

في Vercel:

1. **Framework Preset**: Next.js (تلقائي)
2. **Root Directory**: `apps/frontend`
3. **Build Command**: `npm run build` (تلقائي)
4. **Output Directory**: `.next` (تلقائي)
5. **Install Command**: `npm install` (تلقائي)

### 3.4 إضافة Environment Variables

في Vercel → **Settings** → **Environment Variables**:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Backend API
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

### 3.5 Deploy

1. اضغط "Deploy"
2. انتظر حتى يكتمل Build
3. Vercel سيعطيك URL مثل `https://your-app.vercel.app`

---

## 🔧 Step 4: إعداد CORS في Backend

### 4.1 تحديث CORS Settings

في `apps/backend/middleware.ts` أو API routes:

```typescript
// أضف Frontend URL إلى CORS allowed origins
const allowedOrigins = [
  'https://your-app.vercel.app',
  'http://localhost:3000', // للـ development
];
```

---

## 🔗 Step 5: تحديث Frontend للاتصال بالـ Backend

### 5.1 تحديث API URLs

في `apps/frontend/lib/api.ts` أو أي مكان تستدعي فيه API:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

### 5.2 تحديث Socket.io URL

في `apps/frontend/hooks/use-socket.ts`:

```typescript
const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

---

## ✅ Step 6: التحقق من النشر

### 6.1 اختبار Frontend

1. افتح `https://your-app.vercel.app`
2. تأكد من أن الصفحة تفتح
3. جرب Login

### 6.2 اختبار Backend

1. افتح `https://your-backend.railway.app/api/health`
2. يجب أن ترى: `{"status":"ok"}`

### 6.3 اختبار Database

1. في Supabase Dashboard → **Table Editor**
2. تأكد من وجود Tables
3. جرب إضافة بيانات

---

## 🔐 Security Checklist

- ✅ لا تضع `SUPABASE_SERVICE_ROLE_KEY` في Frontend
- ✅ استخدم `NEXT_PUBLIC_` فقط للـ variables التي تحتاجها Frontend
- ✅ تأكد من أن CORS محدود للـ Frontend URL فقط
- ✅ استخدم HTTPS دائماً
- ✅ لا تضع secrets في GitHub

---

## 🐛 Troubleshooting

### Backend لا يعمل على Railway

1. ✅ تأكد من `PORT` environment variable
2. ✅ تأكد من `NODE_ENV=production`
3. ✅ تحقق من Logs في Railway Dashboard

### Frontend لا يتصل بالـ Backend

1. ✅ تأكد من `NEXT_PUBLIC_API_URL` في Vercel
2. ✅ تحقق من CORS settings في Backend
3. ✅ تأكد من أن Backend URL صحيح

### Database Connection Failed

1. ✅ تأكد من `DATABASE_URL` صحيح
2. ✅ تأكد من أن Supabase Database نشط
3. ✅ تحقق من Network Access في Supabase

---

## 📚 روابط مفيدة

- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)

---

## 💰 التكلفة

- **Vercel**: مجاني (حتى 100GB bandwidth)
- **Railway**: $5/شهر (بعد free trial)
- **Supabase**: مجاني (حتى 500MB database)

**Total: ~$5/شهر** 🎉



