# 🚂 تحديث Backend على Railway

## 📋 Environment Variables التي تحتاج تحديث

بعد Deploy الـ Frontend على Vercel، يجب تحديث هذا المتغير في Railway Backend:

---

## 🔄 المتغير المطلوب تحديثه

### CORS_ORIGIN

**القيمة الحالية:**
```
https://your-frontend.vercel.app
```

**القيمة الجديدة (بعد Deploy على Vercel):**
```
https://[YOUR-VERCEL-URL].vercel.app
```

**مثال:**
```
https://ata-crm-frontend.vercel.app
```

---

## 📝 خطوات التحديث

### في Railway Dashboard:

1. اذهب إلى [railway.app](https://railway.app)
2. اختر مشروع Backend
3. اذهب إلى **Variables**
4. ابحث عن `CORS_ORIGIN`
5. اضغط Edit
6. غير القيمة إلى URL الـ Frontend الفعلي
7. احفظ التغييرات
8. Backend سيعيد Deploy تلقائياً

---

## ✅ المتغيرات الحالية في Railway (للمراجعة)

```
CORS_ORIGIN=https://ata-crm-frontend.vercel.app  # ← حدث هذا
DATABASE_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres
NEXTAUTH_SECRET=00977c8a2861fbdc76834100d555e5a51bd4b707b51d35395b51fbf4afa8620d
NEXTAUTH_URL=https://ata-backend-production.up.railway.app
NODE_ENV=production
PORT=3005
```

---

## 🔗 Architecture Setup

```
┌─────────────────────┐
│   Frontend (Vercel) │
│  Next.js App        │
└──────────┬──────────┘
           │
           │ API Calls
           │
           ▼
┌─────────────────────┐
│  Backend (Railway)  │
│  Express/Next API   │
└──────────┬──────────┘
           │
           │ Database Queries
           │
           ▼
┌─────────────────────┐
│  Database (Supabase)│
│  PostgreSQL         │
└─────────────────────┘
```

---

## ⚠️ ملاحظات مهمة

### 1. CORS Configuration
يجب أن يكون `CORS_ORIGIN` في Backend **يطابق بالضبط** URL الـ Frontend.

**صحيح:**
```
Frontend: https://ata-crm.vercel.app
Backend CORS_ORIGIN: https://ata-crm.vercel.app
```

**خطأ:**
```
Frontend: https://ata-crm.vercel.app
Backend CORS_ORIGIN: https://ata-crm.vercel.app/  ← لاحظ الـ /
```

### 2. Multiple Origins (إذا كنت تحتاج)
إذا كنت تريد السماح لأكثر من domain:
```
CORS_ORIGIN=https://ata-crm.vercel.app,https://ata-crm-staging.vercel.app,http://localhost:3005
```

### 3. Database URLs
- **DATABASE_URL:** استخدم pooler للـ serverless (pgbouncer)
- **DIRECT_URL:** استخدم direct connection للـ migrations فقط

---

## 🧪 اختبار الاتصال

بعد التحديث، اختبر الاتصال:

### 1. Test من Frontend
افتح Frontend URL واضغط F12 (Developer Tools):
```javascript
// في Console
fetch('https://ata-backend-production.up.railway.app/api/health')
  .then(r => r.json())
  .then(d => console.log(d))
```

### 2. Test CORS
تأكد من عدم وجود CORS errors في Console.

### 3. Test Authentication
جرب تسجيل الدخول وتأكد أنه يعمل.

---

## 🐛 حل المشاكل

### Problem: CORS Error
**الأعراض:**
```
Access to fetch at 'https://ata-backend-production.up.railway.app/api/...' 
from origin 'https://ata-crm.vercel.app' has been blocked by CORS policy
```

**الحل:**
1. تحقق من CORS_ORIGIN في Railway
2. تأكد أنه يطابق Frontend URL **بالضبط**
3. لا توجد مسافات زائدة
4. لا يوجد `/` في النهاية

### Problem: 401 Unauthorized
**الأعراض:** جميع API requests تعطي 401

**الحل:**
1. تحقق من NEXTAUTH_SECRET **متطابق** في Frontend و Backend
2. تحقق من NEXTAUTH_URL صحيح في كليهما

### Problem: Database Connection Error
**الأعراض:** `P1001: Can't reach database`

**الحل:**
1. تحقق من DATABASE_URL صحيح
2. تأكد من Supabase IP Whitelist (0.0.0.0/0)
3. استخدم DATABASE_URL مع pgbouncer للـ serverless

---

## 📊 Checklist

- [ ] حدّث CORS_ORIGIN في Railway
- [ ] حدّث NEXTAUTH_URL في Vercel (Frontend)
- [ ] حدّث ALLOWED_ORIGINS في Vercel (Frontend)
- [ ] تأكد من NEXTAUTH_SECRET متطابق في كليهما
- [ ] اختبر الاتصال بين Frontend و Backend
- [ ] اختبر تسجيل الدخول
- [ ] تحقق من عدم وجود CORS errors

---

**آخر تحديث:** 22 ديسمبر 2025

