# ⚡ دليل سريع: تغيير Admin من Demo إلى Production

## 🎯 متى تغيرها؟

**✅ مباشرة بعد Deploy إلى Production!**

---

## 🚀 الخطوات السريعة (5 دقائق)

### 1. إعداد Environment Variables

**في `.env.production` أو في Vercel/VPS Environment Variables:**

```env
ADMIN_EMAIL="admin@yourcompany.com"
ADMIN_PASSWORD="YourStrongPassword123!"
ADMIN_NAME="Your Name"
```

### 2. تشغيل Script

```bash
npm run update:admin
```

**أو:**

```bash
# Windows PowerShell
$env:ADMIN_EMAIL="admin@yourcompany.com"
$env:ADMIN_PASSWORD="YourStrongPassword123!"
$env:ADMIN_NAME="Your Name"
npm run update:admin

# Linux/Mac
export ADMIN_EMAIL="admin@yourcompany.com"
export ADMIN_PASSWORD="YourStrongPassword123!"
export ADMIN_NAME="Your Name"
npm run update:admin
```

### 3. التحقق

1. سجّل خروج
2. سجّل دخول بالبيانات الجديدة
3. تأكد من أن كل شيء يعمل

---

## ✅ Checklist

- [ ] Environment Variables معد
- [ ] Script تم تشغيله
- [ ] Login بالبيانات الجديدة نجح
- [ ] Demo Admin تم حذفه (اختياري)

---

## 📚 للمزيد من التفاصيل

راجع: `ADMIN_SETUP_PRODUCTION.md`

---

**تم إعداد الدليل بواسطة:** AI Assistant  
**التاريخ:** ديسمبر 2024

