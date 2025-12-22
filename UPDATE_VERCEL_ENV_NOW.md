# 🚀 تحديث Environment Variables في Vercel - الآن!

**الموقع:** https://ata-frontend-pied.vercel.app/

---

## ⚠️ مهم جداً: تحديث NEXTAUTH_URL

### **الخطوات:**

1. **اذهب إلى Vercel Dashboard:**
   - https://vercel.com/dashboard
   - اختر Project: **ATA-FRONTEND** (أو اسم مشروعك)

2. **Settings → Environment Variables**

3. **ابحث عن `NEXTAUTH_URL`:**

   **إذا كان موجوداً:**
   - Edit
   - Value: `https://ata-frontend-pied.vercel.app`
   - Environment: ✅ Production ✅ Preview ✅ Development
   - Save

   **إذا كان مفقوداً:**
   - Add New
   - Key: `NEXTAUTH_URL`
   - Value: `https://ata-frontend-pied.vercel.app`
   - Environment: ✅ Production ✅ Preview ✅ Development
   - Save

4. **ابحث عن `ALLOWED_ORIGINS`:**

   **Edit:**
   - Value: `https://ata-frontend-pied.vercel.app,https://ata-backend-production.up.railway.app`
   - Environment: ✅ Production ✅ Preview ✅ Development
   - Save

5. **Redeploy:**
   - Deployments → آخر deployment → ⋮ → **Redeploy**

---

## ✅ جميع المتغيرات المطلوبة:

```
NEXTAUTH_SECRET=00977c8a2861fbdc76834100d555e5a51bd4b707b51d35395b51fbf4afa8620d
NEXTAUTH_URL=https://ata-frontend-pied.vercel.app
DATABASE_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres
NODE_ENV=production
NEXT_PUBLIC_BACKEND_URL=https://ata-backend-production.up.railway.app
ALLOWED_ORIGINS=https://ata-frontend-pied.vercel.app,https://ata-backend-production.up.railway.app
```

---

## 🔄 تحديث CORS في Railway Backend:

**في Railway Dashboard:**
1. Variables
2. Edit `CORS_ORIGIN`
3. Value: `https://ata-frontend-pied.vercel.app`
4. Save (سيعيد Deploy تلقائياً)

---

## ✅ بعد التحديث:

1. ✅ Redeploy Vercel
2. ✅ Redeploy Railway (تلقائياً)
3. ✅ جرب Login
4. ✅ يجب أن يعمل الآن!

---

**آخر تحديث:** 22 ديسمبر 2025

