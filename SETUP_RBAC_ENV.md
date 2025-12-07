# 🔧 إعداد Feature Flags للنظام

## ✅ الخطوات المطلوبة

### 1. افتح ملف `.env` في جذر المشروع

### 2. أضف هذه الأسطر (إذا لم تكن موجودة):

```env
# RBAC System Feature Flags
RBAC_ENABLED=true
NEXT_PUBLIC_RBAC_ENABLED=true

# Optional: Permission Cache TTL (default: 5 minutes)
PERMISSION_CACHE_TTL=300000

# Optional: Audit Logging (default: true)
AUDIT_LOGGING_ENABLED=true
```

### 3. تأكد من أن القيم صحيحة:
- ✅ `RBAC_ENABLED=true` - لتفعيل النظام الجديد
- ✅ `NEXT_PUBLIC_RBAC_ENABLED=true` - لتفعيل النظام في Frontend

### 4. أعد تشغيل Development Server:
```bash
# أوقف السيرفر الحالي (Ctrl+C)
# ثم شغله مرة أخرى
npm run dev
```

---

## ⚠️ ملاحظات مهمة

### إذا لم تضيف هذه القيم:
- ❌ النظام سيستخدم النظام القديم (Legacy)
- ❌ RBAC لن يعمل بشكل صحيح
- ❌ الصلاحيات قد لا تعمل كما هو متوقع

### بعد إضافة القيم:
- ✅ النظام سيستخدم RBAC الجديد
- ✅ جميع الصلاحيات ستعمل من قاعدة البيانات
- ✅ Audit Logging سيكون مفعّل

---

## 🔍 التحقق من الإعداد

بعد إعادة تشغيل السيرفر، ابحث في Console عن:
```
🔐 RBAC Configuration: {
  RBAC_ENABLED: true,
  PERMISSION_CACHE_TTL: '300s',
  AUDIT_LOGGING_ENABLED: true
}
```

إذا رأيت هذه الرسالة، فالإعداد صحيح! ✅

---

## 📋 مثال كامل لملف .env

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ata_crm"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here-min-32-characters"
NEXTAUTH_URL="http://localhost:3005"

# RBAC System Feature Flags
RBAC_ENABLED=true
NEXT_PUBLIC_RBAC_ENABLED=true
PERMISSION_CACHE_TTL=300000
AUDIT_LOGGING_ENABLED=true

# Other environment variables...
```

---

## ❓ إذا واجهت مشاكل

1. **تأكد من عدم وجود مسافات حول `=`**
   ```env
   # ❌ خطأ
   RBAC_ENABLED = true
   
   # ✅ صحيح
   RBAC_ENABLED=true
   ```

2. **تأكد من عدم وجود علامات اقتباس غير ضرورية**
   ```env
   # ❌ خطأ
   RBAC_ENABLED="true"
   
   # ✅ صحيح (لكن "true" يعمل أيضاً)
   RBAC_ENABLED=true
   ```

3. **أعد تشغيل السيرفر بعد التعديل**

---

## ✅ بعد الإعداد

النظام جاهز للاستخدام! 🎉


