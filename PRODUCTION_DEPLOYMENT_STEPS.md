# 🚀 خطوات النشر إلى Production - دليل شامل ومفصل

**التاريخ:** ديسمبر 2024  
**الإصدار:** 1.0.0

---

## 📋 جدول المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [التحضير المبدئي](#التحضير-المبدئي)
3. [إعداد Environment Variables](#إعداد-environment-variables)
4. [إعداد Database](#إعداد-database)
5. [إعداد Automated Backups](#إعداد-automated-backups)
6. [Build المشروع](#build-المشروع)
7. [اختيار طريقة النشر](#اختيار-طريقة-النشر)
8. [النشر على Vercel](#النشر-على-vercel)
9. [النشر على VPS (Self-Hosted)](#النشر-على-vps-self-hosted)
10. [إعداد HTTPS](#إعداد-https)
11. [الاختبار](#الاختبار)
12. [الصيانة](#الصيانة)
13. [Troubleshooting](#troubleshooting)

---

## 🎯 نظرة عامة

هذا الدليل يشرح بالتفصيل كل خطوة مطلوبة لنشر المشروع إلى Production. سنغطي:

- ✅ إعداد Environment Variables
- ✅ إعداد Database
- ✅ إعداد Automated Backups
- ✅ Build المشروع
- ✅ النشر (Vercel أو VPS)
- ✅ إعداد HTTPS
- ✅ الاختبار
- ✅ الصيانة

**الوقت المتوقع:** 2-4 ساعات (حسب طريقة النشر)

---

## 📝 التحضير المبدئي

### 1. التأكد من جاهزية المشروع

```bash
# 1. التأكد من أن المشروع يعمل محلياً
npm run dev
# افتح http://localhost:3005 وتحقق من أن كل شيء يعمل

# 2. التأكد من عدم وجود أخطاء
npm run lint

# 3. التأكد من أن Build يعمل
npm run build
```

**✅ Checklist:**
- [ ] المشروع يعمل محلياً بدون أخطاء
- [ ] جميع الميزات تعمل
- [ ] لا توجد أخطاء في Build
- [ ] Database متصل ويعمل

---

## 🔐 إعداد Environment Variables

### الخطوة 1: إنشاء ملف .env.production

```bash
# في المجلد الرئيسي للمشروع
cp .env.production.example .env.production
```

### الخطوة 2: فتح الملف وتعديل القيم

```bash
# استخدم أي محرر نصوص
notepad .env.production  # Windows
nano .env.production     # Linux/Mac
code .env.production    # VS Code
```

### الخطوة 3: ملء المتغيرات المطلوبة

#### أ. Database Configuration

```env
DATABASE_URL="postgresql://username:password@host:port/database_name"
```

**شرح:**
- `username`: اسم المستخدم في PostgreSQL
- `password`: كلمة المرور
- `host`: عنوان الـ Server (مثلاً: `db.example.com` أو `localhost`)
- `port`: المنفذ (عادة `5432`)
- `database_name`: اسم قاعدة البيانات (مثلاً: `ata_crm_prod`)

**مثال:**
```env
DATABASE_URL="postgresql://postgres:mypassword123@db.example.com:5432/ata_crm_prod"
```

#### ب. NextAuth Configuration

```env
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-very-long-secret-key-minimum-32-characters"
```

**شرح:**
- `NEXTAUTH_URL`: عنوان موقعك في Production (يجب أن يبدأ بـ `https://`)
- `NEXTAUTH_SECRET`: مفتاح سري قوي (يجب أن يكون 32 حرف على الأقل)

**كيفية إنشاء NEXTAUTH_SECRET قوي:**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**مثال:**
```env
NEXTAUTH_URL="https://crm.yourcompany.com"
NEXTAUTH_SECRET="aBc123XyZ789...very-long-random-string...32+chars"
```

#### ج. Node Environment

```env
NODE_ENV="production"
```

**مهم:** يجب أن يكون `production` وليس `development`

#### د. RBAC Configuration

```env
RBAC_ENABLED="true"
NEXT_PUBLIC_RBAC_ENABLED="true"
PERMISSION_CACHE_TTL="300000"
AUDIT_LOGGING_ENABLED="true"
```

**شرح:**
- `RBAC_ENABLED`: تفعيل نظام RBAC
- `NEXT_PUBLIC_RBAC_ENABLED`: تفعيل RBAC في Frontend
- `PERMISSION_CACHE_TTL`: مدة Cache للصلاحيات (بالميلي ثانية)
- `AUDIT_LOGGING_ENABLED`: تفعيل Audit Logging

#### هـ. Email Configuration (اختياري لكن موصى به)

```env
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_SECURE="false"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-16-char-app-password"
EMAIL_FROM_NAME="ATA CRM System"
```

**شرح:**
- `EMAIL_HOST`: خادم SMTP (Gmail أو أي خدمة أخرى)
- `EMAIL_PORT`: منفذ SMTP (587 لـ TLS)
- `EMAIL_USER`: بريدك الإلكتروني
- `EMAIL_PASSWORD`: App Password (ليس كلمة المرور العادية)

**كيفية الحصول على Gmail App Password:**
1. اذهب إلى https://myaccount.google.com/apppasswords
2. أنشئ App Password جديد
3. استخدم الـ 16 حرف كـ `EMAIL_PASSWORD`

### الخطوة 4: التحقق من الإعداد

```bash
npm run check:production
```

**النتيجة المتوقعة:**
```
🚀 Production Environment Check

✅ .env.production file exists
✅ DATABASE_URL
✅ NEXTAUTH_URL
✅ NEXTAUTH_SECRET
✅ NODE_ENV
...
✅ All required variables are set
```

**إذا ظهرت أخطاء:**
- راجع `.env.production` وتأكد من ملء جميع المتغيرات المطلوبة
- تأكد من أن `NEXTAUTH_SECRET` 32 حرف على الأقل
- تأكد من أن `NEXTAUTH_URL` يبدأ بـ `https://`

---

## 🗄️ إعداد Database

### الخطوة 1: إنشاء Database في Production

**إذا كنت تستخدم VPS:**

```bash
# الاتصال بـ PostgreSQL
sudo -u postgres psql

# إنشاء Database جديد
CREATE DATABASE ata_crm_prod;

# إنشاء مستخدم جديد (اختياري)
CREATE USER ata_crm_user WITH PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE ata_crm_prod TO ata_crm_user;

# الخروج
\q
```

**إذا كنت تستخدم خدمة Database (مثل Supabase, Railway, etc.):**
- اتبع تعليمات الخدمة لإنشاء Database
- احصل على `DATABASE_URL` من لوحة التحكم

### الخطوة 2: تطبيق Migrations

```bash
# تأكد من أن DATABASE_URL في .env.production يشير إلى Production Database
npx prisma migrate deploy
```

**شرح:**
- `prisma migrate deploy` يطبق جميع Migrations على Database
- هذا الأمر آمن للإنتاج (لا ينشئ migrations جديدة)

**النتيجة المتوقعة:**
```
Applying migration `20241201000000_initial`
Applying migration `20241201000001_add_rbac_tables`
...
All migrations have been successfully applied.
```

### الخطوة 3: Seed RBAC Data

```bash
npm run prisma:seed:rbac
```

**شرح:**
- هذا الأمر يملأ Database بالأدوار والصلاحيات الأساسية
- يجب تشغيله مرة واحدة فقط

**النتيجة المتوقعة:**
```
✅ RBAC seed completed successfully
✅ Created 6 roles
✅ Created 73 permissions
```

### الخطوة 4: التحقق من Database

```bash
# فتح Prisma Studio (للتحقق)
npm run prisma:studio
```

**تحقق من:**
- [ ] Tables موجودة
- [ ] Roles موجودة (Admin, Operations Manager, etc.)
- [ ] Permissions موجودة
- [ ] يمكنك الاتصال بالـ Database

---

## 💾 إعداد Automated Backups

### الخطوة 1: إنشاء مجلد Backups

```bash
mkdir backups
```

### الخطوة 2: إعداد Backup Script

**Linux/Mac:**

```bash
# جعل الملف قابل للتنفيذ
chmod +x scripts/automated-backup.sh

# اختبار Backup يدوياً
./scripts/automated-backup.sh
```

**Windows:**

```bash
# اختبار Backup يدوياً
scripts\automated-backup.bat
```

### الخطوة 3: إعداد Automated Schedule

**Linux/Mac (Cron):**

```bash
# فتح crontab
crontab -e

# إضافة السطر التالي (Backup يومي الساعة 2 صباحاً)
0 2 * * * /path/to/your/project/scripts/automated-backup.sh >> /path/to/your/project/backups/backup.log 2>&1
```

**شرح:**
- `0 2 * * *`: كل يوم الساعة 2 صباحاً
- `/path/to/your/project`: المسار الكامل لمشروعك
- `>> ... backup.log`: حفظ Logs في ملف

**Windows (Task Scheduler):**

1. افتح Task Scheduler
2. Create Basic Task
3. Name: "ATA CRM Daily Backup"
4. Trigger: Daily at 2:00 AM
5. Action: Start a program
6. Program: `cmd.exe`
7. Arguments: `/c "cd /d C:\path\to\your\project && scripts\automated-backup.bat"`

### الخطوة 4: التحقق من Backups

```bash
# عرض Backups
ls -lh backups/  # Linux/Mac
dir backups      # Windows
```

**تحقق من:**
- [ ] Backup تم إنشاؤه
- [ ] الملف مضغوط (.gz)
- [ ] الحجم منطقي (ليس 0 bytes)

---

## 🏗️ Build المشروع

### الخطوة 1: Install Dependencies

```bash
# استخدام npm ci للإنتاج (أسرع وأكثر أماناً)
npm ci
```

**شرح:**
- `npm ci` يثبت Dependencies بناءً على `package-lock.json`
- أسرع من `npm install` وأكثر أماناً

### الخطوة 2: Generate Prisma Client

```bash
npx prisma generate
```

**شرح:**
- يولد Prisma Client بناءً على Schema
- مطلوب قبل Build

### الخطوة 3: Build المشروع

```bash
npm run build
```

**شرح:**
- يبني المشروع للإنتاج
- يتحقق من الأخطاء
- يحسّن الكود

**النتيجة المتوقعة:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
...
Route (app)                              Size     First Load JS
┌ ○ /                                   5.2 kB         85 kB
└ ○ /login                              8.1 kB         88 kB
...
```

**إذا ظهرت أخطاء:**
- راجع الأخطاء وأصلحها
- تأكد من أن جميع Environment Variables موجودة
- تأكد من أن Database متصل

### الخطوة 4: التحقق من Build

```bash
# اختبار Build محلياً
npm start
```

**تحقق من:**
- [ ] المشروع يعمل على `http://localhost:3005`
- [ ] لا توجد أخطاء في Console
- [ ] جميع الصفحات تعمل

---

## 🌐 اختيار طريقة النشر

هناك طريقتان رئيسيتان:

### Option 1: Vercel (موصى به للمبتدئين)
- ✅ سهل الإعداد
- ✅ HTTPS تلقائي
- ✅ CDN تلقائي
- ✅ مجاني للبداية
- ⚠️ محدود في التخصيص

### Option 2: VPS (Self-Hosted)
- ✅ تحكم كامل
- ✅ مرونة أكبر
- ✅ يمكن استخدامه لأي حجم
- ⚠️ يحتاج إعداد أكثر

**اختر الطريقة المناسبة لك.**

---

## 🚀 النشر على Vercel

### الخطوة 1: إنشاء حساب Vercel

1. اذهب إلى https://vercel.com
2. Sign up باستخدام GitHub/GitLab/Bitbucket
3. اربط حسابك بـ Repository

### الخطوة 2: Push Code إلى Git

```bash
# إذا لم يكن المشروع على Git بعد
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/ata-crm.git
git push -u origin main
```

### الخطوة 3: Deploy على Vercel

1. اذهب إلى Vercel Dashboard
2. اضغط "New Project"
3. اختر Repository
4. Configure Project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm ci`

### الخطوة 4: إضافة Environment Variables

في Vercel Dashboard:
1. اذهب إلى Project Settings
2. Environment Variables
3. أضف جميع المتغيرات من `.env.production`:
   - `DATABASE_URL`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `NODE_ENV=production`
   - وغيرها...

**مهم:** 
- تأكد من أن `NEXTAUTH_URL` هو Domain الذي سيعطيه Vercel (مثلاً: `https://ata-crm.vercel.app`)
- أو استخدم Custom Domain

### الخطوة 5: Deploy

1. اضغط "Deploy"
2. انتظر حتى يكتمل Build
3. Vercel سيعطيك URL (مثلاً: `https://ata-crm.vercel.app`)

### الخطوة 6: إعداد Custom Domain (اختياري)

1. في Vercel Dashboard → Settings → Domains
2. أضف Domain الخاص بك
3. اتبع التعليمات لإعداد DNS

---

## 🖥️ النشر على VPS (Self-Hosted)

### الخطوة 1: إعداد Server

**متطلبات:**
- Ubuntu 20.04+ أو Debian 11+
- 2GB RAM على الأقل
- 20GB Storage على الأقل

**تثبيت Node.js:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be v20.x.x
npm --version
```

**تثبيت PostgreSQL:**

```bash
sudo apt install postgresql-16 postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**تثبيت PM2 (Process Manager):**

```bash
sudo npm install -g pm2
```

### الخطوة 2: Clone المشروع

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/yourusername/ata-crm.git
cd ata-crm

# Set permissions
sudo chown -R $USER:$USER /var/www/ata-crm
```

### الخطوة 3: إعداد Environment Variables

```bash
# Copy template
cp .env.production.example .env.production

# Edit
nano .env.production
```

**ملء القيم:**
- `DATABASE_URL`: `postgresql://postgres:password@localhost:5432/ata_crm_prod`
- `NEXTAUTH_URL`: `https://your-domain.com`
- `NEXTAUTH_SECRET`: (مفتاح قوي 32+ حرف)

### الخطوة 4: إعداد Database

```bash
# Create database
sudo -u postgres psql
CREATE DATABASE ata_crm_prod;
\q

# Run migrations
npx prisma migrate deploy

# Seed RBAC
npm run prisma:seed:rbac
```

### الخطوة 5: Build و Start

```bash
# Install dependencies
npm ci

# Generate Prisma Client
npx prisma generate

# Build
npm run build

# Start with PM2
pm2 start npm --name "ata-crm" -- start
pm2 save
pm2 startup
```

### الخطوة 6: إعداد Nginx (Reverse Proxy)

```bash
# Install Nginx
sudo apt install nginx -y

# Create config
sudo nano /etc/nginx/sites-available/ata-crm
```

**المحتوى:**

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**تفعيل Config:**

```bash
sudo ln -s /etc/nginx/sites-available/ata-crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 إعداد HTTPS

### الخطوة 1: تثبيت Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### الخطوة 2: الحصول على SSL Certificate

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

**سيطلب منك:**
- Email address
- Agree to terms
- Redirect HTTP to HTTPS (اختر Yes)

### الخطوة 3: التحقق من Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run
```

**Certbot يجدد الشهادة تلقائياً كل 90 يوم.**

---

## 🧪 الاختبار

### 1. Health Check

```bash
curl https://your-domain.com/api/health
```

**النتيجة المتوقعة:**
```json
{"status":"ok","timestamp":"2024-12-01T10:00:00.000Z"}
```

### 2. Authentication Test

1. افتح `https://your-domain.com/login`
2. سجّل دخول كـ Admin
3. تحقق من أن Dashboard يعمل

### 3. RBAC Test

1. سجّل دخول كـ Admin
2. تحقق من أن جميع الصفحات متاحة
3. سجّل دخول كـ Operations Manager
4. تحقق من أن الصلاحيات صحيحة

### 4. Features Test

- [ ] Order Management
- [ ] Team Management
- [ ] Attendance System
- [ ] Client Portal
- [ ] Email Notifications

### 5. Performance Test

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test
ab -n 100 -c 10 https://your-domain.com/
```

---

## 🔄 الصيانة

### 1. Monitoring

**إعداد Uptime Monitoring:**
- استخدم Uptime Robot (مجاني)
- أضف URL: `https://your-domain.com/api/health`
- Check interval: 5 minutes

**إعداد Error Tracking:**
- استخدم Sentry (مجاني 5K errors/month)
- أضف `SENTRY_DSN` إلى `.env.production`

### 2. Updates

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm ci

# Run migrations
npx prisma migrate deploy

# Rebuild
npm run build

# Restart
pm2 restart ata-crm
```

### 3. Backups

**تحقق من Backups:**
```bash
ls -lh backups/
```

**استعادة Backup:**
```bash
# Extract backup
gunzip backups/ata_crm_backup_20241201_020000.sql.gz

# Restore
docker exec -i ata-crm-postgres psql -U postgres ata_crm_prod < backups/ata_crm_backup_20241201_020000.sql
```

---

## 🔧 Troubleshooting

### المشكلة: Database Connection Error

**الحل:**
```bash
# تحقق من DATABASE_URL
echo $DATABASE_URL

# تحقق من اتصال Database
psql $DATABASE_URL -c "SELECT 1"
```

### المشكلة: Build Fails

**الحل:**
```bash
# Clean build
rm -rf .next node_modules
npm ci
npm run build
```

### المشكلة: 500 Error في Production

**الحل:**
```bash
# Check logs
pm2 logs ata-crm

# Check Prisma
npx prisma studio
```

### المشكلة: HTTPS Not Working

**الحل:**
```bash
# Check Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check Certbot
sudo certbot certificates
```

---

## ✅ Checklist النهائي

### قبل النشر:
- [ ] `.env.production` معد بشكل صحيح
- [ ] `npm run check:production` يمر بنجاح
- [ ] Database متصل ويعمل
- [ ] Migrations مطبقة
- [ ] RBAC seeded
- [ ] Build يعمل بدون أخطاء
- [ ] Automated Backups معد

### بعد النشر:
- [ ] HTTPS يعمل
- [ ] Health check يمر
- [ ] Authentication يعمل
- [ ] RBAC يعمل
- [ ] جميع الميزات تعمل
- [ ] Monitoring معد
- [ ] Backups تعمل

---

## 📞 الدعم

- **Deployment Guide:** `docs/DEPLOYMENT_GUIDE.md`
- **Production Check:** `npm run check:production`
- **Troubleshooting:** راجع قسم Troubleshooting أعلاه

---

**تم إعداد الدليل بواسطة:** AI Assistant  
**التاريخ:** ديسمبر 2024  
**الإصدار:** 1.0.0

