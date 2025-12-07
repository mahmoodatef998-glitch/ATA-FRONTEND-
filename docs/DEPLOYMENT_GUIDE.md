# 🚀 Production Deployment Guide - ATA CRM

**التاريخ:** ديسمبر 2024  
**الإصدار:** 1.0.0

---

## 📋 جدول المحتويات

1. [المتطلبات](#المتطلبات)
2. [التحضير](#التحضير)
3. [النشر](#النشر)
4. [الاختبار](#الاختبار)
5. [الصيانة](#الصيانة)

---

## ✅ المتطلبات

### Infrastructure
- ✅ Server with Node.js 20+
- ✅ PostgreSQL 16+ (or Docker)
- ✅ Domain name with SSL Certificate
- ✅ Email service (Gmail SMTP or professional service)

### Environment Variables
- ✅ `.env.production` file (see `.env.production.example`)

---

## 🔧 التحضير

### 1. إعداد Environment Variables

```bash
# Copy template
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

**المتغيرات المطلوبة:**
- `DATABASE_URL` - Production database URL
- `NEXTAUTH_URL` - Your production domain (HTTPS)
- `NEXTAUTH_SECRET` - Secure random string (min 32 chars)
- `NODE_ENV=production`

### 2. إعداد Database

```bash
# Run migrations
npx prisma migrate deploy

# Seed RBAC data
npm run prisma:seed:rbac
```

### 3. Build المشروع

```bash
# Install dependencies
npm ci

# Build for production
npm run build
```

---

## 🚀 النشر

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   - Push code to GitHub/GitLab
   - Connect to Vercel

2. **Configure Environment Variables**
   - Add all variables from `.env.production`
   - Set `NODE_ENV=production`

3. **Deploy**
   - Vercel will auto-deploy on push
   - Or deploy manually from dashboard

### Option 2: Self-Hosted (VPS)

1. **Setup Server**
   ```bash
   # Install Node.js 20+
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PostgreSQL
   sudo apt-get install postgresql-16
   
   # Install PM2 (Process Manager)
   npm install -g pm2
   ```

2. **Clone & Setup**
   ```bash
   git clone your-repo-url
   cd ata-crm-project
   npm ci
   cp .env.production.example .env.production
   # Edit .env.production
   ```

3. **Database Setup**
   ```bash
   npx prisma migrate deploy
   npm run prisma:seed:rbac
   ```

4. **Build & Start**
   ```bash
   npm run build
   pm2 start npm --name "ata-crm" -- start
   pm2 save
   pm2 startup
   ```

5. **Setup Nginx (Reverse Proxy)**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3005;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **Setup SSL (Let's Encrypt)**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## 🧪 الاختبار

### 1. Health Check
```bash
curl https://your-domain.com/api/health
```

### 2. Authentication Test
- Login as Admin
- Test RBAC permissions
- Test all major features

### 3. Performance Test
- Load testing with tools like Apache Bench
- Monitor response times
- Check database performance

---

## 🔄 الصيانة

### Automated Backups

**Linux/Mac:**
```bash
# Add to crontab
0 2 * * * /path/to/scripts/automated-backup.sh
```

**Windows:**
- Use Task Scheduler to run `scripts/automated-backup.bat` daily

### Monitoring

**Recommended Tools:**
- Sentry (Error Tracking)
- LogRocket (Session Replay)
- Uptime Robot (Uptime Monitoring)

### Updates

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

---

## 🔐 Security Checklist

- [ ] HTTPS enabled
- [ ] Strong `NEXTAUTH_SECRET` (32+ chars)
- [ ] Database credentials secure
- [ ] `.env.production` not in Git
- [ ] Firewall configured
- [ ] Regular backups
- [ ] Security headers enabled (✅ already done)
- [ ] Rate limiting enabled (✅ already done)

---

## 📞 Support

For issues or questions:
- Check `docs/TROUBLESHOOTING.md`
- Review logs: `logs/exceptions.log`
- Check Prisma Studio: `npm run prisma:studio`

---

**تم إعداد الدليل بواسطة:** AI Assistant  
**التاريخ:** ديسمبر 2024  
**الإصدار:** 1.0.0

