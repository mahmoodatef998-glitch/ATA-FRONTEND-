# 🚀 دليل Railway Deployment - خطوة بخطوة

**دليل شامل لنشر ATA CRM Backend على Railway**

---

## 📋 الخطوات المطلوبة

### ✅ **1. التحقق من Railway Build**

1. افتح: https://railway.app
2. اختر المشروع → Service → **"ATA-BACKEND-"**
3. راقب الـ **Build Logs**
4. تأكد من نجاح الـ Build (✅ Build Successful)

---

### ✅ **2. إعداد Environment Variables على Railway**

#### **الخطوات:**

1. في Railway Dashboard:
   - اختر Service → **"ATA-BACKEND-"**
   - اضغط على **"Variables"** أو **"Settings" → "Variables"**

2. أضف المتغيرات التالية:

#### **🔴 Required (مطلوبة):**

```env
# Database
DATABASE_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres

# NextAuth
NEXTAUTH_SECRET=00977c8a2861fbdc76834100d555e5a51bd4b707b51d35395b51fbf4afa8620d
NEXTAUTH_URL=https://your-railway-app.up.railway.app

# Node Environment
NODE_ENV=production

# Port (Railway يضيفه تلقائياً، لكن يمكنك إضافته)
PORT=3005
```

#### **🟡 Optional (اختيارية لكن موصى بها):**

```env
# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Email (إذا كنت تستخدم إرسال إيميلات)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Cloudinary (إذا كنت تستخدم رفع الملفات)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### **⚠️ مهم جداً:**

- **NEXTAUTH_URL**: يجب أن يكون رابط Railway الفعلي
  - بعد الـ Deploy، Railway يعطيك رابط مثل: `https://ata-backend-production.up.railway.app`
  - انسخ الرابط من Railway Dashboard → Settings → Domains
  - ضعه في `NEXTAUTH_URL`

---

### ✅ **3. تشغيل Prisma Migrations**

#### **الخطوات:**

1. في Railway Dashboard:
   - اختر Service → **"ATA-BACKEND-"**
   - اضغط على **"Shell"** أو **"Terminal"**

2. شغّل الأمر:

```bash
npx prisma migrate deploy
```

3. انتظر حتى يكتمل (سترى رسائل مثل):
   ```
   ✅ Applied migration: 20251103101743_init
   ✅ Applied migration: 20251104082904_add_quotation_files_and_client_accounts
   ...
   ```

---

### ✅ **4. التحقق من الـ Deployment**

#### **الخطوات:**

1. افتح Railway Dashboard
2. اختر Service → **"ATA-BACKEND-"**
3. اضغط على **"Settings" → "Domains"**
4. انسخ الرابط (مثل: `https://ata-backend-production.up.railway.app`)

5. اختبر الـ API:
   - افتح المتصفح: `https://your-railway-url.up.railway.app/api/health`
   - يجب أن ترى: `{"status":"ok","services":{...}}`

---

## 🔧 حل المشاكل الشائعة

### ❌ **Problem 1: Build Failed**

**الأسباب المحتملة:**
- متغيرات بيئة مفقودة
- أخطاء في الكود
- مشاكل في التبعيات

**الحل:**
1. راجع Build Logs في Railway
2. تأكد من وجود جميع المتغيرات المطلوبة
3. تأكد من نجاح `npm run build` محلياً

---

### ❌ **Problem 2: Database Connection Failed**

**الأسباب المحتملة:**
- `DATABASE_URL` خاطئ
- `DIRECT_URL` خاطئ
- Supabase يمنع الاتصال

**الحل:**
1. تأكد من صحة `DATABASE_URL` و `DIRECT_URL`
2. تأكد من أن Supabase يسمح بالاتصالات الخارجية
3. جرب الاتصال من Railway Shell

---

### ❌ **Problem 3: NEXTAUTH_URL Error**

**الأسباب المحتملة:**
- `NEXTAUTH_URL` غير موجود
- `NEXTAUTH_URL` خاطئ (يجب أن يكون HTTPS)
- `NEXTAUTH_SECRET` غير موجود أو قصير

**الحل:**
1. تأكد من وجود `NEXTAUTH_URL` مع رابط Railway الصحيح
2. تأكد من أن `NEXTAUTH_SECRET` 32+ حرف
3. تأكد من أن الرابط يبدأ بـ `https://`

---

### ❌ **Problem 4: Migrations Failed**

**الأسباب المحتملة:**
- الاتصال بقاعدة البيانات فشل
- المايجريشنز موجودة مسبقاً
- مشاكل في الـ Schema

**الحل:**
1. تأكد من صحة `DATABASE_URL` و `DIRECT_URL`
2. شغّل من Railway Shell (ليس محلياً)
3. راجع رسائل الخطأ في Terminal

---

## 📝 Checklist قبل الـ Deploy

- [ ] ✅ Build نجح محلياً (`npm run build`)
- [ ] ✅ جميع المتغيرات موجودة في Railway
- [ ] ✅ `NEXTAUTH_URL` يحتوي على رابط Railway الصحيح
- [ ] ✅ `NEXTAUTH_SECRET` 32+ حرف
- [ ] ✅ `DATABASE_URL` و `DIRECT_URL` صحيحين
- [ ] ✅ `NODE_ENV=production`
- [ ] ✅ Code pushed إلى GitHub
- [ ] ✅ Railway متصل بـ GitHub Repository

---

## 📝 Checklist بعد الـ Deploy

- [ ] ✅ Build نجح على Railway
- [ ] ✅ Service يعمل (Status: Running)
- [ ] ✅ Prisma Migrations تم تطبيقها
- [ ] ✅ Health Check يعمل (`/api/health`)
- [ ] ✅ يمكن الوصول للـ API من الخارج
- [ ] ✅ Frontend يمكنه الاتصال بالـ Backend

---

## 🔗 روابط مفيدة

- **Railway Dashboard**: https://railway.app
- **Supabase Dashboard**: https://supabase.com
- **GitHub Repository**: (رابط المشروع)

---

## 💡 نصائح مهمة

1. **احفظ جميع المتغيرات في مكان آمن** (مثل 1Password أو LastPass)
2. **لا تشارك `NEXTAUTH_SECRET` أو `DATABASE_URL` مع أحد**
3. **راقب الـ Logs بانتظام** للتحقق من الأخطاء
4. **استخدم Railway Shell** لتشغيل الأوامر (مثل Prisma)
5. **تأكد من تحديث `NEXTAUTH_URL`** بعد كل Deploy جديد

---

## 🎯 الخطوة التالية

بعد نجاح الـ Deployment:

1. **ربط Frontend بالـ Backend:**
   - أضف `NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app` في Frontend
   
2. **اختبار الميزات:**
   - تسجيل الدخول
   - إنشاء طلبات
   - رفع ملفات
   - إرسال إيميلات

3. **مراقبة الأداء:**
   - راقب Railway Metrics
   - راجع Logs بانتظام
   - تحقق من Database Performance

---

**✅ جاهز للـ Deploy!**

إذا واجهت أي مشكلة، راجع قسم "حل المشاكل الشائعة" أعلاه أو اسألني! 🚀

