# ⚡ Railway Quick Check - فحص سريع

**دليل سريع للتحقق من Railway Deployment**

---

## 🎯 الخطوات السريعة (5 دقائق)

### 1️⃣ **افتح Railway Dashboard**

👉 https://railway.app

---

### 2️⃣ **تحقق من Build Status**

- اختر المشروع → Service → **"ATA-BACKEND-"**
- راقب **Build Logs**
- ✅ **نجح؟** → انتقل للخطوة التالية
- ❌ **فشل؟** → راجع Build Logs وابحث عن الأخطاء

---

### 3️⃣ **تحقق من Environment Variables**

- اضغط على **"Variables"** أو **"Settings" → "Variables"**
- تأكد من وجود:

| Variable | Status |
|----------|--------|
| `DATABASE_URL` | ✅ |
| `DIRECT_URL` | ✅ |
| `NEXTAUTH_SECRET` | ✅ |
| `NEXTAUTH_URL` | ✅ |
| `NODE_ENV` | ✅ |

**❌ مفقود؟** → أضفه من ملف `RAILWAY_ENV_VARIABLES.md`

---

### 4️⃣ **تحقق من Service Status**

- في Railway Dashboard
- تأكد من أن **Status = Running** ✅
- إذا كان **Stopped** → اضغط **"Deploy"** أو **"Restart"**

---

### 5️⃣ **احصل على Railway URL**

- اضغط على **"Settings" → "Domains"**
- انسخ الرابط (مثل: `https://ata-backend-production.up.railway.app`)
- **⚠️ مهم:** تأكد من تحديث `NEXTAUTH_URL` بهذا الرابط!

---

### 6️⃣ **اختبر Health Check**

افتح في المتصفح:
```
https://your-railway-url.up.railway.app/api/health
```

**✅ يجب أن ترى:**
```json
{
  "status": "ok",
  "services": {
    "database": "connected",
    ...
  }
}
```

**❌ خطأ؟** → راجع Logs في Railway Dashboard

---

### 7️⃣ **شغّل Prisma Migrations**

1. اضغط على **"Shell"** أو **"Terminal"**
2. شغّل:
   ```bash
   npx prisma migrate deploy
   ```
3. انتظر حتى يكتمل

**✅ يجب أن ترى:**
```
✅ Applied migration: 20251103101743_init
✅ Applied migration: 20251104082904_add_quotation_files_and_client_accounts
...
```

---

## 🔍 فحص سريع للأخطاء

### ❌ **Build Failed**

**الحل:**
1. راجع Build Logs
2. تأكد من وجود جميع المتغيرات
3. جرب `npm run build` محلياً

---

### ❌ **Service Stopped**

**الحل:**
1. راجع Logs
2. تأكد من وجود جميع المتغيرات المطلوبة
3. اضغط **"Restart"**

---

### ❌ **Health Check Failed**

**الحل:**
1. راجع Logs في Railway
2. تأكد من `DATABASE_URL` و `DIRECT_URL`
3. تأكد من `NEXTAUTH_SECRET` و `NEXTAUTH_URL`

---

### ❌ **Migrations Failed**

**الحل:**
1. تأكد من `DATABASE_URL` و `DIRECT_URL`
2. شغّل من Railway Shell (ليس محلياً)
3. راجع رسائل الخطأ

---

## ✅ Checklist النهائي

- [ ] ✅ Build نجح
- [ ] ✅ جميع المتغيرات موجودة
- [ ] ✅ Service Status = Running
- [ ] ✅ `NEXTAUTH_URL` محدث برابط Railway
- [ ] ✅ Health Check يعمل
- [ ] ✅ Prisma Migrations تم تطبيقها
- [ ] ✅ يمكن الوصول للـ API من الخارج

---

## 🎯 الخطوة التالية

بعد التحقق من كل شيء:

1. **ربط Frontend:**
   - أضف `NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app` في Frontend

2. **اختبار الميزات:**
   - تسجيل الدخول
   - إنشاء طلبات
   - رفع ملفات

---

**✅ جاهز!** إذا واجهت أي مشكلة، راجع `🚀_دليل_Railway_النهائي.md`!

