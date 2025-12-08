# 🔐 دليل Environment Variables لـ Vercel

**دليل شامل لإعداد جميع Environment Variables في Vercel**

---

## 📋 Environment Variables المطلوبة

### ✅ **المطلوبة (Required)**

هذه Variables **ضرورية** للمشروع ليعمل:

#### 1. DATABASE_URL
```
postgresql://user:password@host:5432/database
```
**مثال:**
- Supabase: `postgresql://postgres.xxxxx:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres`
- Neon: `postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/database`
- Vercel Postgres: (سيتم توفيره تلقائياً)

**كيف تحصل عليه:**
- **Supabase:** Project Settings → Database → Connection String → URI
- **Neon:** Project → Connection Details → Connection String
- **Vercel Postgres:** Storage → Database → Settings → Copy DATABASE_URL

---

#### 2. NEXTAUTH_URL
```
https://your-app-name.vercel.app
```
**مثال:**
- `https://ata-crm.vercel.app`
- `https://crm.yourcompany.com` (إذا استخدمت Custom Domain)

**⚠️ مهم:**
- يجب أن يكون HTTPS
- لا يضع `/` في النهاية
- سيتم تحديثه بعد Deploy (انسخ URL من Vercel)

---

#### 3. NEXTAUTH_SECRET
```
(مفتاح عشوائي قوي - 32+ حرف)
```
**كيف تنشئه:**
- **Online:** https://generate-secret.vercel.app/32
- **Terminal:** `openssl rand -base64 32`
- **Node.js:** `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

**مثال:**
```
aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE1fG3hI5jK7lM9nO1p
```

**⚠️ مهم:**
- يجب أن يكون 32+ حرف
- لا تشاركه مع أحد
- استخدم مفتاح مختلف لكل بيئة

---

#### 4. NODE_ENV
```
production
```
**قيمة ثابتة:** `production`

---

#### 5. RBAC_ENABLED
```
true
```
**قيمة ثابتة:** `true`

---

#### 6. NEXT_PUBLIC_RBAC_ENABLED
```
true
```
**قيمة ثابتة:** `true`

---

### ⚙️ **الاختيارية (Optional)**

هذه Variables **اختيارية** لكن موصى بها:

#### 7. EMAIL_HOST
```
smtp.gmail.com
```
**للتطبيقات:**
- Gmail: `smtp.gmail.com`
- Outlook: `smtp-mail.outlook.com`
- Custom SMTP: (من مزودك)

---

#### 8. EMAIL_PORT
```
587
```
**القيم الشائعة:**
- Gmail: `587` (TLS)
- Outlook: `587`
- SSL: `465`

---

#### 9. EMAIL_SECURE
```
false
```
**القيم:**
- `false` للـ TLS (Port 587)
- `true` للـ SSL (Port 465)

---

#### 10. EMAIL_USER
```
your-email@gmail.com
```
**البريد الإلكتروني المرسل منه**

---

#### 11. EMAIL_PASSWORD
```
your-16-char-app-password
```
**Gmail App Password (16 حرف)**

**كيف تحصل عليه:**
1. https://myaccount.google.com/apppasswords
2. Enable 2-Step Verification
3. Generate App Password
4. انسخ الـ Password (16 حرف)

---

#### 12. EMAIL_FROM_NAME
```
ATA CRM System
```
**اسم المرسل في الإيميلات**

---

#### 13. CLOUDINARY_CLOUD_NAME
```
your-cloud-name
```
**من Cloudinary Dashboard**

---

#### 14. CLOUDINARY_API_KEY
```
your-api-key
```
**من Cloudinary Dashboard**

---

#### 15. CLOUDINARY_API_SECRET
```
your-api-secret
```
**من Cloudinary Dashboard**

---

#### 16. SENTRY_DSN
```
https://xxx@xxx.ingest.sentry.io/xxx
```
**من Sentry Project Settings**

---

#### 17. NEXT_PUBLIC_SOCKET_URL
```
https://your-app-name.vercel.app
```
**نفس NEXTAUTH_URL عادة**

---

#### 18. CRON_SECRET
```
(مفتاح عشوائي قوي)
```
**لحماية Cron Jobs**

**كيف تنشئه:**
```bash
openssl rand -base64 32
```

---

## 🚀 خطوات الإضافة في Vercel

### الطريقة 1: أثناء إنشاء Project

1. **في صفحة "Configure Project":**
   - Environment Variables → Add
   - أضف كل Variable واحدة تلو الأخرى

### الطريقة 2: بعد إنشاء Project

1. **Vercel Dashboard:**
   - Settings → Environment Variables
   - Add New
   - أضف كل Variable

---

## 📝 Template جاهز للنسخ

### للنسخ واللصق في Vercel:

```env
# Required
DATABASE_URL=postgresql://user:password@host:5432/database
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-secret-key-min-32-chars-long
NODE_ENV=production
RBAC_ENABLED=true
NEXT_PUBLIC_RBAC_ENABLED=true

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=ATA CRM System

# Cloudinary (Optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Sentry (Optional)
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Socket.io (Optional)
NEXT_PUBLIC_SOCKET_URL=https://your-app-name.vercel.app

# Cron (Optional)
CRON_SECRET=your-cron-secret-key
```

---

## ✅ Checklist

### قبل Deploy:

- [ ] `DATABASE_URL` معد
- [ ] `NEXTAUTH_SECRET` معد (32+ حرف)
- [ ] `NODE_ENV=production`
- [ ] `RBAC_ENABLED=true`
- [ ] `NEXT_PUBLIC_RBAC_ENABLED=true`
- [ ] `NEXTAUTH_URL` (يمكن تحديثه بعد Deploy)

### بعد Deploy:

- [ ] `NEXTAUTH_URL` محدث بالـ URL الحقيقي
- [ ] `NEXT_PUBLIC_SOCKET_URL` محدث (إذا استخدمت Socket.io)

---

## 🔧 Generate Secrets

### NEXTAUTH_SECRET:
```bash
# Online
https://generate-secret.vercel.app/32

# Terminal
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### CRON_SECRET:
```bash
openssl rand -base64 32
```

---

## 📋 ترتيب الإضافة في Vercel

### 1. أضف المطلوبة أولاً:
1. `DATABASE_URL`
2. `NEXTAUTH_SECRET`
3. `NODE_ENV=production`
4. `RBAC_ENABLED=true`
5. `NEXT_PUBLIC_RBAC_ENABLED=true`
6. `NEXTAUTH_URL` (placeholder: `https://placeholder.vercel.app`)

### 2. ثم Deploy

### 3. بعد Deploy:
1. انسخ URL الحقيقي
2. حدث `NEXTAUTH_URL`
3. حدث `NEXT_PUBLIC_SOCKET_URL` (إذا استخدمت)
4. Redeploy

### 4. أضف الاختيارية (لاحقاً):
- Email Configuration
- Cloudinary
- Sentry
- etc.

---

## ⚠️ نصائح مهمة

1. **لا تضع Spaces حول `=`**
   - ✅ `NODE_ENV=production`
   - ❌ `NODE_ENV = production`

2. **لا تضع Quotes في Vercel**
   - ✅ `NODE_ENV=production`
   - ❌ `NODE_ENV="production"`

3. **استخدم Environment لكل Environment**
   - Production: Production فقط
   - Preview: Preview + Production
   - Development: Development فقط

4. **لا تشارك Secrets**
   - لا ترفع `.env` إلى Git
   - لا تشارك `NEXTAUTH_SECRET`

---

## 🎯 الخلاصة

**الحد الأدنى المطلوب:**
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NODE_ENV=production`
- `RBAC_ENABLED=true`
- `NEXT_PUBLIC_RBAC_ENABLED=true`
- `NEXTAUTH_URL` (بعد Deploy)

**الباقي اختياري لكن موصى به!**

---

**جاهز؟ ابدأ بإضافة Variables في Vercel!** 🚀

