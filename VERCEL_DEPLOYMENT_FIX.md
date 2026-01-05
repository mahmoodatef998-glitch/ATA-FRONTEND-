# 🔧 إصلاح مشاكل Vercel Deployment

## المشاكل المحتملة والحلول

### 1. ✅ Middleware يحجب HEAD requests للصفحة الرئيسية
**المشكلة:** Middleware كان يحجب جميع HEAD requests، بما فيها التي يحتاجها Vercel للتحقق من الصفحات.

**الحل:** تم تعديل middleware للسماح بـ:
- HEAD requests للصفحة الرئيسية (`/`)
- HEAD requests مع `x-vercel-draft-status` header (Vercel health checks)
- حجب HEAD requests الأخرى (prefetch checks فقط)

### 2. ✅ Environment Variables المطلوبة على Vercel

تأكد من إضافة جميع هذه المتغيرات في Vercel Dashboard → Settings → Environment Variables:

#### متغيرات مطلوبة (Required):
```env
DATABASE_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?connection_limit=20&pool_timeout=10&connect_timeout=10&sslmode=require

DIRECT_URL=postgresql://postgres:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres

NEXTAUTH_SECRET=your-secret-key-here-min-32-chars

NEXTAUTH_URL=https://your-vercel-app.vercel.app

NODE_ENV=production
```

#### متغيرات اختيارية (Optional):
```env
RBAC_ENABLED=true
NEXT_PUBLIC_RBAC_ENABLED=true
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

### 3. ✅ Build Script في package.json

تأكد من أن `package.json` يحتوي على:
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

### 4. ✅ Prisma Client Generation

Vercel يحتاج إلى توليد Prisma Client أثناء البناء. تأكد من:
- `postinstall` script موجود في `package.json`
- `prisma generate` موجود في `build` script

### 5. ✅ Vercel Build Settings

في Vercel Dashboard → Settings → General:
- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (أو اتركه فارغاً - Vercel يكتشفه تلقائياً)
- **Output Directory:** `.next` (افتراضي)
- **Install Command:** `npm install` (افتراضي)

### 6. ✅ Middleware Configuration

Middleware الآن:
- ✅ يسمح بـ HEAD requests للصفحة الرئيسية
- ✅ يسمح بـ Vercel health checks
- ✅ يحجب RSC prefetch requests فقط
- ✅ لا يحجب GET requests العادية

### 7. ✅ Troubleshooting Steps

إذا كان الموقع لا يعمل على Vercel:

1. **تحقق من Build Logs:**
   - اذهب إلى Vercel Dashboard → Deployments
   - اضغط على آخر deployment
   - راجع Build Logs للأخطاء

2. **تحقق من Runtime Logs:**
   - اذهب إلى Vercel Dashboard → Deployments
   - اضغط على آخر deployment
   - راجع Runtime Logs للأخطاء

3. **تحقق من Environment Variables:**
   - اذهب إلى Vercel Dashboard → Settings → Environment Variables
   - تأكد من وجود جميع المتغيرات المطلوبة
   - تأكد من أن `NEXTAUTH_URL` يحتوي على URL الصحيح لموقع Vercel

4. **Redeploy:**
   - بعد إضافة/تعديل Environment Variables
   - اضغط على "Redeploy" في آخر deployment

5. **تحقق من Domain:**
   - تأكد من أن Domain مرتبط بشكل صحيح
   - جرب الوصول للموقع من URL مختلف

### 8. ✅ Common Errors and Solutions

#### Error: "Module not found"
**الحل:** تأكد من أن جميع dependencies موجودة في `package.json`

#### Error: "Prisma Client not generated"
**الحل:** تأكد من وجود `postinstall` script في `package.json`

#### Error: "Environment variable missing"
**الحل:** أضف جميع Environment Variables المطلوبة في Vercel Dashboard

#### Error: "Middleware too large"
**الحل:** Middleware يجب أن يكون أقل من 1 MB (حالياً < 100 KB ✅)

#### Error: "Build timeout"
**الحل:** 
- تحقق من أن `build` script لا يستغرق وقتاً طويلاً
- تأكد من أن Prisma migrations محدودة

### 9. ✅ Quick Fix Checklist

- [ ] جميع Environment Variables موجودة في Vercel
- [ ] `NEXTAUTH_URL` يحتوي على URL الصحيح
- [ ] `DATABASE_URL` صحيح ومتصل
- [ ] Build script يعمل محلياً (`npm run build`)
- [ ] لا توجد أخطاء في Build Logs
- [ ] Middleware محدث (يسمح بـ HEAD requests للصفحة الرئيسية)
- [ ] تم Redeploy بعد التغييرات

### 10. ✅ Test Locally Before Deploying

قبل النشر على Vercel، تأكد من:
```bash
npm run build
npm start
```

إذا عمل محلياً، يجب أن يعمل على Vercel أيضاً.

---

## 📞 إذا استمرت المشكلة

1. راجع Build Logs في Vercel Dashboard
2. راجع Runtime Logs في Vercel Dashboard
3. تحقق من أن جميع Environment Variables موجودة
4. جرب Redeploy بعد إضافة/تعديل Environment Variables

