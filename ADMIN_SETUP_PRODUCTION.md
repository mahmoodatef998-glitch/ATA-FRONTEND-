# 🔐 إعداد Admin الحقيقي في Production

**مهم جداً:** يجب تغيير بيانات Admin Demo قبل النشر إلى Production!

---

## ⚠️ الوضع الحالي (Development)

**بيانات Demo الحالية:**
- Email: `admin@demo.co`
- Password: `00243540000`
- Name: `Admin User`

**⚠️ هذه البيانات معروفة للجميع ولا يجب استخدامها في Production!**

---

## ✅ متى يجب تغييرها؟

### **قبل النشر إلى Production مباشرة!**

**الخطوات:**
1. ✅ بعد Merge PR
2. ✅ بعد إعداد Production Database
3. ✅ قبل Deploy إلى Production
4. ✅ مباشرة بعد أول Deploy

**لا تنتظر!** غيرها فوراً بعد Deploy.

---

## 🔧 كيفية تغيير بيانات Admin

### الطريقة 1: استخدام Prisma Studio (أسهل)

#### الخطوة 1: فتح Prisma Studio
```bash
npm run prisma:studio
```

#### الخطوة 2: تعديل Admin User
1. افتح: http://localhost:5556
2. اذهب إلى `users` table
3. ابحث عن `admin@demo.co`
4. اضغط Edit
5. غيّر:
   - `email`: إلى بريدك الحقيقي (مثلاً: `admin@yourcompany.com`)
   - `name`: إلى اسمك الحقيقي
   - `password`: **لا تغيره هنا!** (يجب Hash أولاً)

#### الخطوة 3: تغيير Password
**لا يمكن تغيير Password مباشرة في Prisma Studio!**

استخدم الطريقة 2 أو 3 أدناه.

---

### الطريقة 2: استخدام Script (موصى به)

#### إنشاء Script لتغيير Admin

**إنشاء ملف:** `scripts/update-admin.ts`

```typescript
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const newEmail = process.env.ADMIN_EMAIL || "admin@yourcompany.com";
  const newPassword = process.env.ADMIN_PASSWORD || "YourStrongPassword123!";
  const newName = process.env.ADMIN_NAME || "Admin";

  // Hash password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Find and update admin user
  const admin = await prisma.users.findFirst({
    where: {
      role: "ADMIN",
    },
  });

  if (!admin) {
    console.error("❌ Admin user not found!");
    process.exit(1);
  }

  // Update admin
  const updated = await prisma.users.update({
    where: { id: admin.id },
    data: {
      email: newEmail,
      name: newName,
      password: hashedPassword,
    },
  });

  console.log("✅ Admin updated successfully!");
  console.log(`   Email: ${updated.email}`);
  console.log(`   Name: ${updated.name}`);
  console.log(`   Password: [HIDDEN]`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

#### استخدام Script

**في Development:**
```bash
# Set environment variables
$env:ADMIN_EMAIL="admin@yourcompany.com"
$env:ADMIN_PASSWORD="YourStrongPassword123!"
$env:ADMIN_NAME="Your Name"

# Run script
tsx scripts/update-admin.ts
```

**في Production:**
```bash
# Set environment variables
export ADMIN_EMAIL="admin@yourcompany.com"
export ADMIN_PASSWORD="YourStrongPassword123!"
export ADMIN_NAME="Your Name"

# Run script
tsx scripts/update-admin.ts
```

---

### الطريقة 3: استخدام SQL مباشرة (للمتقدمين)

```sql
-- Hash password first (استخدم bcrypt online tool)
-- ثم استبدل HASHED_PASSWORD بالـ Hash الناتج

UPDATE users 
SET 
  email = 'admin@yourcompany.com',
  name = 'Your Name',
  password = 'HASHED_PASSWORD'
WHERE email = 'admin@demo.co' AND role = 'ADMIN';
```

**⚠️ تحذير:** يجب Hash Password أولاً باستخدام bcrypt!

---

## 🎯 الخطوات الموصى بها

### قبل النشر إلى Production:

#### 1. إعداد بيانات Admin الجديدة
```bash
# في .env.production
ADMIN_EMAIL="admin@yourcompany.com"
ADMIN_PASSWORD="YourStrongPassword123!"
ADMIN_NAME="Your Name"
```

#### 2. إنشاء Script (استخدم الطريقة 2 أعلاه)

#### 3. بعد Deploy إلى Production:

**Option A: Vercel**
```bash
# في Vercel Dashboard → Settings → Environment Variables
# أضف:
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=YourStrongPassword123!
ADMIN_NAME=Your Name

# ثم في Vercel Terminal أو SSH:
tsx scripts/update-admin.ts
```

**Option B: VPS**
```bash
# SSH إلى Server
cd /var/www/ATA-CRM-PROJ

# Set environment variables
export ADMIN_EMAIL="admin@yourcompany.com"
export ADMIN_PASSWORD="YourStrongPassword123!"
export ADMIN_NAME="Your Name"

# Run script
tsx scripts/update-admin.ts
```

#### 4. التحقق
1. سجّل خروج من Demo Admin
2. سجّل دخول بالبيانات الجديدة
3. تأكد من أن كل شيء يعمل

---

## 🔒 متطلبات Password القوي

**Password يجب أن يكون:**
- ✅ 12+ حرف على الأقل
- ✅ يحتوي على أحرف كبيرة وصغيرة
- ✅ يحتوي على أرقام
- ✅ يحتوي على رموز خاصة (!@#$%^&*)
- ✅ **لا تستخدم كلمات شائعة!**

**أمثلة جيدة:**
- `MyCompany2024!Admin`
- `ATA-CRM-Admin#2024`
- `SecureAdmin@2024!`

**أمثلة سيئة:**
- `password123` ❌
- `admin123` ❌
- `12345678` ❌

---

## 📋 Checklist

### قبل Production:
- [ ] قررت Email Admin الجديد
- [ ] قررت Password قوي
- [ ] أنشأت Script لتغيير Admin
- [ ] اختبرت Script محلياً

### بعد Deploy:
- [ ] أضفت Environment Variables في Production
- [ ] شغلت Script لتغيير Admin
- [ ] اختبرت Login بالبيانات الجديدة
- [ ] تأكدت من حذف/تعطيل Demo Admin

---

## 🗑️ حذف Demo Admin (اختياري لكن موصى به)

بعد إنشاء Admin الحقيقي، يمكنك حذف Demo Admin:

```typescript
// في scripts/update-admin.ts - أضف في النهاية:

// Delete demo admin
await prisma.users.deleteMany({
  where: {
    email: "admin@demo.co",
  },
});

console.log("✅ Demo admin deleted!");
```

---

## ⚠️ تحذيرات مهمة

1. **لا تستخدم Demo Admin في Production!**
   - معروف للجميع
   - غير آمن
   - قد يؤدي لاختراق النظام

2. **لا ترفع `.env.production` إلى Git!**
   - يحتوي على بيانات حساسة
   - استخدم Secrets Manager في Production

3. **استخدم Password Manager**
   - احفظ Password في مكان آمن
   - لا تكتبه في ملفات عادية

4. **فعّل 2FA إذا أمكن**
   - Two-Factor Authentication
   - حماية إضافية

---

## 🔄 إذا نسيت Password

### الطريقة 1: استخدام Script
```bash
# Set new password
export ADMIN_PASSWORD="NewPassword123!"

# Run script
tsx scripts/update-admin.ts
```

### الطريقة 2: استخدام Prisma Studio + Hash Tool
1. افتح Prisma Studio
2. ابحث عن Admin User
3. استخدم bcrypt online tool: https://bcrypt-generator.com/
4. انسخ الـ Hash
5. Paste في حقل Password

---

## 📝 ملخص سريع

1. **قبل Production:** أعد بيانات Admin الجديدة
2. **بعد Deploy:** شغّل Script لتغيير Admin
3. **تحقق:** سجّل دخول بالبيانات الجديدة
4. **احذف:** Demo Admin (اختياري)

---

**تم إعداد الدليل بواسطة:** AI Assistant  
**التاريخ:** ديسمبر 2024

