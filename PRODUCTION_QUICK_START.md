# ⚡ Production Quick Start - دليل سريع

**للنشر السريع، اتبع هذه الخطوات بالترتيب:**

---

## 🚀 الخطوات السريعة (30-60 دقيقة)

### 1. إعداد Environment Variables (5 دقائق)

```bash
cp .env.production.example .env.production
nano .env.production  # أو استخدم أي محرر
```

**املأ:**
- `DATABASE_URL` - Production Database URL
- `NEXTAUTH_URL` - HTTPS URL (مثلاً: `https://crm.yourcompany.com`)
- `NEXTAUTH_SECRET` - مفتاح قوي 32+ حرف

**تحقق:**
```bash
npm run check:production
```

---

### 2. إعداد Database (10 دقائق)

```bash
# إنشاء Database
# (في PostgreSQL أو خدمة Database)

# تطبيق Migrations
npx prisma migrate deploy

# Seed RBAC
npm run prisma:seed:rbac
```

---

### 3. Build المشروع (5 دقائق)

```bash
npm ci
npx prisma generate
npm run build
```

---

### 4. النشر (10-30 دقيقة)

#### Option A: Vercel (أسهل)

1. Push إلى Git
2. اربط بـ Vercel
3. أضف Environment Variables
4. Deploy

#### Option B: VPS

1. Clone المشروع
2. أضف `.env.production`
3. Build و Start مع PM2
4. أعد Nginx
5. أعد HTTPS

---

### 5. الاختبار (5 دقائق)

```bash
# Health Check
curl https://your-domain.com/api/health

# Test Login
# افتح https://your-domain.com/login
```

---

## 📋 الأوامر السريعة

```bash
# Check Production Readiness
npm run check:production

# Build
npm run build

# Start (Production)
npm start

# Backup (Manual)
npm run backup:auto  # Linux/Mac
npm run backup:auto:win  # Windows

# Prisma Studio
npm run prisma:studio
```

---

## 🔗 روابط مفيدة

- **دليل مفصل:** `PRODUCTION_DEPLOYMENT_STEPS.md`
- **Checklist:** `PRODUCTION_CHECKLIST.md`
- **Deployment Guide:** `docs/DEPLOYMENT_GUIDE.md`

---

## ⚠️ نصائح مهمة

1. **لا ترفع `.env.production` إلى Git!**
2. **استخدم HTTPS دائماً في Production**
3. **أعد Automated Backups**
4. **اختبر قبل النشر**
5. **راقب Logs بعد النشر**

---

**جاهز؟ ابدأ من الخطوة 1!** 🚀

