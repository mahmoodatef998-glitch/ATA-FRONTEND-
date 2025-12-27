# Railway Chatbot Setup Guide

## الخطوات:

### 1. التحقق من أن Railway متصل بـ GitHub:

1. اذهب إلى [railway.app](https://railway.app)
2. اختر مشروعك
3. اذهب إلى **Settings**
4. تحقق من **Source**: يجب أن يكون متصل بـ GitHub repo

---

### 2. إضافة Environment Variable:

1. اختر **Variables** tab (في القائمة اليسرى)
2. اضغط **+ New Variable**
3. أضف:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```
4. اضغط **Add**

---

### 3. Redeploy:

**الطريقة 1: تلقائي**
- Railway يعيد النشر تلقائياً عند إضافة Variable
- انتظر 2-3 دقائق

**الطريقة 2: يدوي**
1. اذهب إلى **Deployments** tab
2. اضغط على الـ **three dots** (...)
3. اختر **Redeploy**

---

### 4. التحقق من Logs:

1. اذهب إلى **Deployments** tab
2. اضغط على آخر deployment
3. اضغط على **View Logs**
4. ابحث عن:
   - `✅ .env file loaded successfully`
   - `🔍 GROQ_API_KEY in process.env: ✅ Found`
   - أي أخطاء

---

### 5. التحقق من Variables:

1. اذهب إلى **Variables** tab
2. تأكد من وجود:
   ```
   GROQ_API_KEY = gsk_yQQYZvs... (مخفي)
   ```
3. تأكد من أن Variable **مفعّل** (✅)

---

### 6. اختبار Chatbot:

1. افتح موقعك على Railway
2. اضغط F12 → Console
3. اضغط على Chatbot
4. اكتب رسالة
5. تحقق من:
   - Network tab: `/api/chat` → Status 200
   - Console: لا توجد أخطاء

---

## استكشاف الأخطاء:

### الخطأ: 405 Method Not Allowed

**السبب:** Railway لم يتم deploy بعد أو الـ route غير موجود

**الحل:**
1. تأكد من Push إلى GitHub
2. تأكد من أن Railway متصل بـ branch الصحيح (`cleanup-hooks`)
3. Redeploy يدوياً

---

### الخطأ: GROQ_API_KEY not found

**السبب:** Variable غير موجود أو لم يتم apply بعد

**الحل:**
1. تحقق من Variables tab
2. أضف Variable
3. انتظر Redeploy التلقائي

---

### الخطأ: 503 Service Unavailable

**السبب:** API key غير صحيح أو Groq API لا يستجيب

**الحل:**
1. تحقق من API key
2. تحقق من أن المفتاح صحيح على [console.groq.com](https://console.groq.com)

---

## Railway CLI (اختياري):

```bash
# Install
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Add variable
railway variables set GROQ_API_KEY=your_groq_api_key_here

# Check logs
railway logs

# Redeploy
railway up
```

---

## ملاحظة مهمة:

⚠️ **تأكد من أن Railway يستخدم branch `cleanup-hooks`!**

1. Settings → Source
2. Branch: `cleanup-hooks` (وليس `main`)

