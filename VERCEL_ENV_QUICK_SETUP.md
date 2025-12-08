# ⚡ إعداد Environment Variables في Vercel - دليل سريع

**5 دقائق فقط!**

---

## 🎯 الخطوات السريعة

### 1. في Vercel Dashboard

1. **Settings** → **Environment Variables**
2. اضغط **"Add New"**

### 2. أضف Variables المطلوبة (واحدة تلو الأخرى)

#### Variable 1: DATABASE_URL
- **Key:** `DATABASE_URL`
- **Value:** (من Supabase/Neon/Vercel Postgres)
- **Environment:** Production, Preview, Development

#### Variable 2: NEXTAUTH_SECRET
- **Key:** `NEXTAUTH_SECRET`
- **Value:** (Generate من: https://generate-secret.vercel.app/32)
- **Environment:** Production, Preview, Development

#### Variable 3: NODE_ENV
- **Key:** `NODE_ENV`
- **Value:** `production`
- **Environment:** Production, Preview, Development

#### Variable 4: RBAC_ENABLED
- **Key:** `RBAC_ENABLED`
- **Value:** `true`
- **Environment:** Production, Preview, Development

#### Variable 5: NEXT_PUBLIC_RBAC_ENABLED
- **Key:** `NEXT_PUBLIC_RBAC_ENABLED`
- **Value:** `true`
- **Environment:** Production, Preview, Development

#### Variable 6: NEXTAUTH_URL
- **Key:** `NEXTAUTH_URL`
- **Value:** `https://placeholder.vercel.app` (سنحدثه بعد Deploy)
- **Environment:** Production, Preview, Development

### 3. Save

### 4. Deploy

---

## 📝 Generate NEXTAUTH_SECRET

**Option 1: Online (أسهل)**
1. اذهب إلى: https://generate-secret.vercel.app/32
2. انسخ الـ Secret
3. الصقه في Vercel

**Option 2: Terminal**
```bash
openssl rand -base64 32
```

---

## ✅ Checklist

- [ ] `DATABASE_URL` أضفته
- [ ] `NEXTAUTH_SECRET` أضفته (32+ حرف)
- [ ] `NODE_ENV=production` أضفته
- [ ] `RBAC_ENABLED=true` أضفته
- [ ] `NEXT_PUBLIC_RBAC_ENABLED=true` أضفته
- [ ] `NEXTAUTH_URL` أضفته (placeholder)

---

## 🔄 بعد Deploy

1. انسخ URL من Vercel: `https://your-app.vercel.app`
2. Settings → Environment Variables
3. Edit `NEXTAUTH_URL`
4. غيّره إلى: `https://your-app.vercel.app`
5. Redeploy

---

**جاهز!** 🚀

