# 🧪 Environment Variables للاختبار على Vercel

**قيم تجريبية جاهزة للنسخ واللصق في Vercel**

---

## 📋 القيم التجريبية الجاهزة

### ✅ **المطلوبة (Required)**

#### 1. DATABASE_URL
```
postgresql://postgres:postgres123@localhost:5432/ata_crm_test
```
**⚠️ ملاحظة:** هذا مثال. يجب أن تستخدم Database حقيقي من Supabase/Neon/Vercel Postgres

**للحصول على Database تجريبي:**
- **Supabase:** أنشئ Project جديد → انسخ Connection String
- **Neon:** أنشئ Project جديد → انسخ Connection String
- **Vercel Postgres:** Storage → Create Database → انسخ DATABASE_URL

---

#### 2. NEXTAUTH_SECRET
```
ata-crm-test-secret-key-for-vercel-testing-only-32-chars
```
**⚠️ مهم:** هذا للاختبار فقط! استخدم مفتاح أقوى في Production

**أو Generate جديد:**
- https://generate-secret.vercel.app/32
- انسخ الـ Secret

---

#### 3. NODE_ENV
```
production
```
**قيمة ثابتة**

---

#### 4. RBAC_ENABLED
```
true
```
**قيمة ثابتة**

---

#### 5. NEXT_PUBLIC_RBAC_ENABLED
```
true
```
**قيمة ثابتة**

---

#### 6. NEXTAUTH_URL
```
https://placeholder.vercel.app
```
**⚠️ مهم:** سنحدثه بعد Deploy إلى URL الحقيقي

**بعد Deploy:**
- انسخ URL من Vercel (مثلاً: `https://ata-crm-xxx.vercel.app`)
- حدث `NEXTAUTH_URL` بهذا الـ URL
- Redeploy

---

## 📝 للنسخ واللصق في Vercel

### **انسخ هذا الكود:**

```env
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/ata_crm_test
NEXTAUTH_SECRET=ata-crm-test-secret-key-for-vercel-testing-only-32-chars
NODE_ENV=production
RBAC_ENABLED=true
NEXT_PUBLIC_RBAC_ENABLED=true
NEXTAUTH_URL=https://placeholder.vercel.app
```

---

## 🚀 خطوات الإضافة في Vercel

### **الطريقة السريعة:**

1. **في Vercel Dashboard:**
   - Settings → Environment Variables
   - Add New

2. **أضف كل Variable واحدة تلو الأخرى:**

   **Variable 1:**
   - Key: `DATABASE_URL`
   - Value: `postgresql://postgres:postgres123@localhost:5432/ata_crm_test`
   - Environment: ✅ Production, ✅ Preview, ✅ Development

   **Variable 2:**
   - Key: `NEXTAUTH_SECRET`
   - Value: `ata-crm-test-secret-key-for-vercel-testing-only-32-chars`
   - Environment: ✅ Production, ✅ Preview, ✅ Development

   **Variable 3:**
   - Key: `NODE_ENV`
   - Value: `production`
   - Environment: ✅ Production, ✅ Preview, ✅ Development

   **Variable 4:**
   - Key: `RBAC_ENABLED`
   - Value: `true`
   - Environment: ✅ Production, ✅ Preview, ✅ Development

   **Variable 5:**
   - Key: `NEXT_PUBLIC_RBAC_ENABLED`
   - Value: `true`
   - Environment: ✅ Production, ✅ Preview, ✅ Development

   **Variable 6:**
   - Key: `NEXTAUTH_URL`
   - Value: `https://placeholder.vercel.app`
   - Environment: ✅ Production, ✅ Preview, ✅ Development

3. **Save**

4. **Deploy**

---

## ⚠️ مهم: DATABASE_URL

**⚠️ القيمة أعلاه مثال فقط!**

**يجب أن تستخدم Database حقيقي:**

### **Option 1: Supabase (موصى به للاختبار)**

1. اذهب إلى: https://supabase.com
2. Sign Up / Login
3. **New Project**
4. Name: `ata-crm-testing`
5. Database Password: (اختر password)
6. Region: (اختر الأقرب)
7. بعد الإنشاء:
   - **Project Settings** → **Database**
   - **Connection String** → **URI**
   - انسخ `postgresql://postgres.xxxxx:password@aws-0-xxx.pooler.supabase.com:6543/postgres`
8. الصقه في Vercel كـ `DATABASE_URL`

### **Option 2: Neon (موصى به للاختبار)**

1. اذهب إلى: https://neon.tech
2. Sign Up / Login
3. **Create a project**
4. Name: `ata-crm-testing`
5. بعد الإنشاء:
   - **Connection Details** → **Connection String**
   - انسخ `postgresql://user:password@ep-xxx.xxx.neon.tech/database`
6. الصقه في Vercel كـ `DATABASE_URL`

### **Option 3: Vercel Postgres (أسهل)**

1. في Vercel Dashboard → **Storage** → **Create Database**
2. اختر **Postgres**
3. Vercel سينشئ Database تلقائياً
4. انسخ `DATABASE_URL` من Database Settings
5. الصقه في Vercel

---

## 🔄 بعد Deploy

### 1. انسخ URL من Vercel

بعد نجاح Deploy، ستحصل على URL مثل:
```
https://ata-crm-abc123.vercel.app
```

### 2. حدث NEXTAUTH_URL

1. Vercel Dashboard → Settings → Environment Variables
2. Edit `NEXTAUTH_URL`
3. غيّره إلى: `https://ata-crm-abc123.vercel.app` (الـ URL الحقيقي)
4. Save

### 3. Redeploy

1. Deployments
2. اضغط "..." على آخر Deployment
3. Redeploy

---

## ✅ Checklist

### قبل Deploy:
- [ ] `DATABASE_URL` - من Supabase/Neon/Vercel Postgres
- [ ] `NEXTAUTH_SECRET` - للاختبار (32+ حرف)
- [ ] `NODE_ENV=production`
- [ ] `RBAC_ENABLED=true`
- [ ] `NEXT_PUBLIC_RBAC_ENABLED=true`
- [ ] `NEXTAUTH_URL=https://placeholder.vercel.app`

### بعد Deploy:
- [ ] نسخت URL الحقيقي
- [ ] حدثت `NEXTAUTH_URL`
- [ ] عملت Redeploy

---

## 🎯 القيم الجاهزة (للنسخ)

### **للنسخ المباشر:**

```
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/ata_crm_test
NEXTAUTH_SECRET=ata-crm-test-secret-key-for-vercel-testing-only-32-chars
NODE_ENV=production
RBAC_ENABLED=true
NEXT_PUBLIC_RBAC_ENABLED=true
NEXTAUTH_URL=https://placeholder.vercel.app
```

**⚠️ تذكير:** غيّر `DATABASE_URL` إلى Database حقيقي!

---

## 💡 نصائح

1. **DATABASE_URL:** استخدم Database حقيقي (Supabase/Neon مجاني للاختبار)
2. **NEXTAUTH_SECRET:** للاختبار فقط، استخدم مفتاح أقوى في Production
3. **NEXTAUTH_URL:** placeholder الآن، سنحدثه بعد Deploy
4. **Environment:** أضف للجميع (Production, Preview, Development) للاختبار

---

**جاهز؟ ابدأ بإضافة Variables في Vercel!** 🚀

