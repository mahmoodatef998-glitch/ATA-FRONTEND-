# ✅ Checklist للنشر على Vercel

**استخدم هذا الـ Checklist للتأكد من كل خطوة**

---

## 📋 قبل البدء

- [ ] Build ينجح محلياً (`npm run build`)
- [ ] Code على GitHub (branch `last-update`)
- [ ] لا توجد أخطاء في Code

---

## 🔐 Vercel Setup

- [ ] حساب Vercel معد
- [ ] Repository مربوط (`ATA-CRM-PROJ`)
- [ ] Production Branch = `last-update` (مهم جداً!)
- [ ] Build Settings صحيحة (Next.js)

---

## 🗄️ Database Setup

- [ ] Database معد (Supabase/Neon/Vercel Postgres)
- [ ] `DATABASE_URL` جاهز
- [ ] Connection Pooling مفعّل (إذا Supabase)

---

## 🔑 Environment Variables

- [ ] `DATABASE_URL` - من Database Provider
- [ ] `NEXTAUTH_SECRET` - 32+ حرف
- [ ] `NODE_ENV=production`
- [ ] `RBAC_ENABLED=true`
- [ ] `NEXT_PUBLIC_RBAC_ENABLED=true`
- [ ] `NEXTAUTH_URL` - placeholder (سنحدثه بعد Deploy)

---

## 🚀 Deploy

- [ ] Deploy نجح
- [ ] حصلت على URL
- [ ] لا توجد أخطاء في Logs

---

## 🔄 بعد Deploy

- [ ] حدثت `NEXTAUTH_URL` بالـ URL الحقيقي
- [ ] عملت Redeploy
- [ ] Migrations مطبقة (`npx prisma migrate deploy`)
- [ ] RBAC Seeded (`npm run prisma:seed:rbac`)
- [ ] Admin Credentials محدثة (`npm run update:admin`)

---

## 🧪 الاختبار

- [ ] Health Check يمر (`/api/health`)
- [ ] Login يعمل
- [ ] Dashboard يعمل
- [ ] RBAC Permissions تعمل
- [ ] Orders Management يعمل
- [ ] Team Management يعمل

---

## ✅ النتيجة النهائية

- [ ] المشروع يعمل على Vercel
- [ ] HTTPS معد تلقائياً
- [ ] Database متصل
- [ ] RBAC يعمل
- [ ] جاهز للاستخدام!

---

**تاريخ الإكمال:** _______________

**ملاحظات:**
_________________________________
_________________________________

