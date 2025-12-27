# 🔍 التحقق من NEXTAUTH_URL

## ✅ NEXTAUTH_SECRET موجود

إذا كان `NEXTAUTH_SECRET` موجود في Vercel، المشكلة على الأرجح في **NEXTAUTH_URL**.

---

## 🔍 تحقق من NEXTAUTH_URL في Vercel

### الخطوة 1: افتح Vercel Dashboard

1. https://vercel.com/dashboard
2. مشروعك → Settings → Environment Variables
3. ابحث عن **NEXTAUTH_URL**

---

### الخطوة 2: تحقق من القيمة

**NEXTAUTH_URL يجب أن يكون:**

```
https://ata-frontend-pied.vercel.app
```

**أو URL الفعلي للموقع:**

1. افتح Vercel Dashboard → **Deployments**
2. انسخ URL آخر deployment ناجح
3. استخدمه في NEXTAUTH_URL

---

### الخطوة 3: التحقق من Format

**صحيح:**
```
https://ata-frontend-pied.vercel.app
```

**خاطئ:**
```
"https://ata-frontend-pied.vercel.app"
https://ata-frontend-pied.vercel.app/
 https://ata-frontend-pied.vercel.app 
```

**التحقق:**
- ✅ يبدأ بـ `https://`
- ✅ بدون quotes (" أو ')
- ✅ بدون `/` في النهاية
- ✅ بدون مسافات في البداية/النهاية
- ✅ Environment = **Production**

---

## 📋 Checklist

- [ ] **NEXTAUTH_SECRET** موجود في Vercel ✅
- [ ] **NEXTAUTH_URL** موجود في Vercel
- [ ] **NEXTAUTH_URL** = `https://ata-frontend-pied.vercel.app` (أو URL الفعلي)
- [ ] **NEXTAUTH_URL** بدون quotes
- [ ] **NEXTAUTH_URL** بدون `/` في النهاية
- [ ] **NEXTAUTH_URL** Environment = Production
- [ ] تم عمل **Redeploy** بعد آخر تحديث

---

## 🚀 بعد التحديث

1. **Redeploy:**
   - Vercel Dashboard → Deployments
   - آخر deployment → ⋮ → Redeploy

2. **انتظر 2-3 دقائق**

3. **اختبر:**
   - افتح الموقع
   - افتح Console (F12)
   - تحقق من عدم وجود أخطاء

---

## 🆘 إذا استمرت المشكلة

**أرسل:**

1. **NEXTAUTH_URL من Vercel:**
   - ما هي القيمة بالضبط؟

2. **URL الموقع الفعلي:**
   - من Vercel Deployments

3. **رسالة الخطأ الكاملة:**
   - من Browser Console (F12)

---

**السؤال المهم:** هل **NEXTAUTH_URL** موجود في Vercel؟ وما هي قيمته؟

