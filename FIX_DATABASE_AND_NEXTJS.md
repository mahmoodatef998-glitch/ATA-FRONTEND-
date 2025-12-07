# 🔧 إصلاح مشاكل PostgreSQL و Next.js

## ❌ المشاكل المكتشفة:

1. **PostgreSQL غير متصل**: `Can't reach database server at localhost:5432`
2. **Next.js 404 Errors**: ملفات static غير موجودة

---

## 🔧 الحلول:

### 1. إصلاح مشكلة PostgreSQL:

#### الطريقة 1: تشغيل PostgreSQL من Services
1. اضغط `Win + R`
2. اكتب `services.msc` واضغط Enter
3. ابحث عن `postgresql` أو `PostgreSQL`
4. اضغط كليك يمين > **Start**

#### الطريقة 2: استخدام Command Prompt (كمسؤول)
```bash
# ابحث عن اسم الخدمة الصحيح
sc query | findstr postgresql

# شغل الخدمة (استبدل postgresql-x64-XX برقم الإصدار)
net start postgresql-x64-16
# أو
net start postgresql-x64-15
```

#### الطريقة 3: التحقق من DATABASE_URL
افتح ملف `.env` وتأكد من:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/ata_crm"
```

**تأكد من:**
- ✅ Username صحيح
- ✅ Password صحيح
- ✅ Database name صحيح
- ✅ Port 5432 (أو البورت الصحيح)

---

### 2. إصلاح مشكلة Next.js Static Files:

#### الخطوة 1: تنظيف Cache
```bash
# حذف مجلد .next
rm -rf .next

# حذف node_modules cache
rm -rf node_modules/.cache
```

#### الخطوة 2: إعادة بناء Next.js
```bash
# أوقف السيرفر (Ctrl+C)
# ثم شغله مرة أخرى
npm run dev
```

---

## 🚀 خطوات سريعة:

### 1. شغل PostgreSQL:
```bash
# Windows (Command Prompt كمسؤول)
net start postgresql-x64-16
```

### 2. نظف Next.js:
```bash
# PowerShell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue
```

### 3. أعد تشغيل السيرفر:
```bash
npm run dev
```

---

## ✅ التحقق من الإصلاح:

### PostgreSQL:
```bash
# تحقق من الاتصال
psql -U postgres -h localhost -p 5432
```

### Next.js:
- افتح `http://localhost:3005`
- يجب أن تعمل الصفحة بدون أخطاء 404

---

## ⚠️ إذا استمرت المشاكل:

### PostgreSQL:
1. تحقق من أن PostgreSQL مثبت
2. تحقق من أن Port 5432 غير مستخدم
3. تحقق من `pg_hba.conf` للإعدادات الصحيحة
4. أعد تشغيل Windows

### Next.js:
1. حذف `node_modules` وإعادة التثبيت:
   ```bash
   rm -rf node_modules
   npm install
   ```
2. تحقق من أن Port 3005 غير مستخدم
3. أعد تشغيل Terminal

---

## 📞 إذا لم يعمل:

1. تحقق من logs في Terminal
2. تحقق من Console في المتصفح
3. أرسل رسالة الخطأ الكاملة


