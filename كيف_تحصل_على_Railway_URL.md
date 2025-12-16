# 🔗 كيف تحصل على Railway URL - خطوة بخطوة

**دليل شامل للحصول على الرابط العام من Railway**

---

## 🎯 الطريقة 1: من Settings → Domains

### الخطوات:

1. **افتح Railway Dashboard**
   - 👉 https://railway.app

2. **اختر المشروع**
   - اضغط على المشروع → Service → **"ATA-BACKEND-"**

3. **افتح Settings**
   - اضغط على **"Settings"** (في القائمة الجانبية أو في الأعلى)

4. **افتح Domains**
   - في Settings، ابحث عن قسم **"Domains"** أو **"Networking"**
   - أو اضغط على **"Generate Domain"** أو **"Add Domain"**

5. **انسخ الرابط**
   - ستجد رابط مثل: `https://ata-backend-production.up.railway.app`
   - انسخه

---

## 🎯 الطريقة 2: من Service Overview

### الخطوات:

1. **افتح Service**
   - اضغط على Service → **"ATA-BACKEND-"**

2. **ابحث عن "Public URL" أو "Domain"**
   - في الصفحة الرئيسية للـ Service
   - قد تجد رابط في الأعلى أو في قسم "Networking"

3. **إذا لم تجده:**
   - اضغط على **"Settings"** → **"Networking"**
   - أو **"Settings"** → **"Domains"**

---

## 🎯 الطريقة 3: إنشاء Domain جديد

### إذا لم تجد Domain موجود:

1. **افتح Settings → Domains**
   - في Railway Dashboard
   - Service → **"ATA-BACKEND-"** → **"Settings"** → **"Domains"**

2. **اضغط "Generate Domain"**
   - أو **"Add Domain"**
   - Railway سينشئ رابط تلقائياً

3. **انسخ الرابط الجديد**
   - مثل: `https://ata-backend-production-xxxxx.up.railway.app`

---

## 🎯 الطريقة 4: من Deploy Logs

### الخطوات:

1. **افتح Deploy Logs**
   - في Service → **"Deployments"** أو **"Logs"**

2. **ابحث عن "Public URL"**
   - قد يظهر الرابط في الـ Logs
   - ابحث عن نص مثل: `Public URL: https://...`

---

## 🔍 إذا لم تجد أي Domain

### الحل:

1. **تأكد من أن Service يعمل**
   - Status يجب أن يكون **"Running"**
   - إذا كان **"Stopped"** → اضغط **"Deploy"** أو **"Restart"**

2. **أنشئ Domain جديد**
   - Settings → Domains → **"Generate Domain"**

3. **تأكد من أن Service متصل بـ GitHub**
   - Settings → **"Source"** → يجب أن يكون متصل

---

## 📸 أين تجد Domains في Railway؟

### في Railway Dashboard:

```
Project
  └── Service: "ATA-BACKEND-"
      ├── Overview (الصفحة الرئيسية)
      ├── Deployments
      ├── Metrics
      ├── Logs
      └── Settings ⬅️ هنا!
          ├── General
          ├── Variables
          ├── Domains ⬅️ هنا!
          ├── Networking
          └── ...
```

---

## ⚠️ ملاحظات مهمة

1. **Railway قد لا ينشئ Domain تلقائياً**
   - قد تحتاج لإنشائه يدوياً
   - اضغط **"Generate Domain"** في Settings → Domains

2. **الرابط قد يتغير**
   - إذا حذفت Service وأنشأت واحد جديد
   - احفظ الرابط في مكان آمن

3. **Custom Domain**
   - يمكنك إضافة Domain مخصص (مثل: `api.yourcompany.com`)
   - لكن هذا اختياري

---

## ✅ بعد الحصول على الرابط

1. **انسخ الرابط**
   - مثل: `https://ata-backend-production.up.railway.app`

2. **أضفه في Environment Variables**
   - Settings → Variables
   - Name: `NEXTAUTH_URL`
   - Value: `https://ata-backend-production.up.railway.app`

3. **احفظه لاستخدامه في Frontend**
   - ستحتاجه لاحقاً في `NEXT_PUBLIC_API_URL`

---

## 🆘 إذا لم تستطع العثور عليه

### جرب:

1. **افتح Railway Dashboard**
2. **اضغط على Service → "ATA-BACKEND-"**
3. **اضغط على "Settings"**
4. **ابحث عن "Domains" أو "Networking"**
5. **إذا لم تجده، اضغط "Generate Domain"**

---

**💡 نصيحة:** إذا لم تجد Domain، أنشئ واحد جديد من Settings → Domains → "Generate Domain"

