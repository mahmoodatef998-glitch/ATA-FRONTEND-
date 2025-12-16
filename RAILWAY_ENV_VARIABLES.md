# 🔐 Railway Environment Variables - قائمة سريعة

**انسخ والصق هذه المتغيرات في Railway Dashboard**

---

## 📋 المتغيرات المطلوبة (Required)

### 1. Database

```env
DATABASE_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

```env
DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres
```

---

### 2. NextAuth

```env
NEXTAUTH_SECRET=00977c8a2861fbdc76834100d555e5a51bd4b707b51d35395b51fbf4afa8620d
```

```env
NEXTAUTH_URL=https://your-railway-app.up.railway.app
```

**⚠️ مهم:** استبدل `your-railway-app` برابط Railway الفعلي بعد الـ Deploy!

---

### 3. Node Environment

```env
NODE_ENV=production
```

---

### 4. Port (اختياري - Railway يضيفه تلقائياً)

```env
PORT=3005
```

---

## 📋 المتغيرات الاختيارية (Optional)

### CORS (إذا كان لديك Frontend)

```env
CORS_ORIGIN=https://your-frontend-domain.com
```

---

### Email (إذا كنت تستخدم إرسال إيميلات)

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

---

### Cloudinary (إذا كنت تستخدم رفع الملفات)

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## 📝 كيفية الإضافة في Railway

1. افتح Railway Dashboard
2. اختر Service → **"ATA-BACKEND-"**
3. اضغط على **"Variables"** أو **"Settings" → "Variables"**
4. اضغط **"New Variable"**
5. أدخل **Name** و **Value**
6. اضغط **"Add"**
7. كرر للجميع

---

## ✅ Checklist

- [ ] `DATABASE_URL` ✅
- [ ] `DIRECT_URL` ✅
- [ ] `NEXTAUTH_SECRET` ✅
- [ ] `NEXTAUTH_URL` ✅ (تأكد من تحديثه برابط Railway الفعلي!)
- [ ] `NODE_ENV=production` ✅
- [ ] `PORT` (اختياري) ✅
- [ ] `CORS_ORIGIN` (إذا لزم الأمر) ✅
- [ ] `EMAIL_USER` و `EMAIL_PASSWORD` (إذا لزم الأمر) ✅
- [ ] `CLOUDINARY_*` (إذا لزم الأمر) ✅

---

**💡 نصيحة:** بعد إضافة جميع المتغيرات، Railway سيعيد الـ Deploy تلقائياً!

