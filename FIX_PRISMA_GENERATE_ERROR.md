# 🔧 إصلاح خطأ Prisma Generate

## ❌ المشكلة:
```
EPERM: operation not permitted, rename '...query_engine-windows.dll.node.tmp...' -> '...query_engine-windows.dll.node'
```

**السبب:** الملفات قيد الاستخدام من قبل Next.js Server أو Prisma Studio.

---

## ✅ الحلول:

### الحل 1: إغلاق Next.js Server ⭐

1. **اذهب إلى Terminal الذي يعمل فيه Next.js Server**
2. **اضغط `Ctrl+C` لإيقافه**
3. **شغّل:**
   ```bash
   npx prisma generate
   ```
4. **أعد تشغيل Server:**
   ```bash
   npm run dev
   ```

---

### الحل 2: إغلاق Prisma Studio

إذا كان Prisma Studio مفتوح:

1. **أغلق Prisma Studio**
2. **شغّل:**
   ```bash
   npx prisma generate
   ```

---

### الحل 3: إغلاق جميع عمليات Node.js

في PowerShell (كمسؤول):

```powershell
# إيقاف جميع عمليات Node.js
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# ثم شغّل
npx prisma generate
```

---

### الحل 4: إعادة تشغيل Terminal

1. **أغلق Terminal بالكامل**
2. **افتح Terminal جديد**
3. **شغّل:**
   ```bash
   npx prisma generate
   ```

---

### الحل 5: حذف الملفات يدوياً

إذا استمرت المشكلة:

1. **أغلق جميع عمليات Node.js**
2. **احذف المجلد:**
   ```bash
   rmdir /s /q node_modules\.prisma
   ```
3. **شغّل:**
   ```bash
   npx prisma generate
   ```

---

## 🔍 التحقق من الحالة:

### فحص العمليات:
```powershell
Get-Process -Name "node" -ErrorAction SilentlyContinue
```

### فحص الملفات:
```powershell
Test-Path "node_modules\.prisma\client\query_engine-windows.dll.node"
```

---

## ✅ بعد الإصلاح:

- ✅ Prisma Client تم توليده بنجاح
- ✅ يمكن تشغيل Next.js Server
- ✅ لا توجد أخطاء في الاتصال بقاعدة البيانات

---

## 📝 ملاحظات:

1. **يجب إغلاق Next.js Server** قبل تشغيل `prisma generate`
2. **Prisma Studio** قد يمنع التوليد أيضاً
3. **أعد تشغيل Server** بعد التوليد

---

## 🚀 الخطوات الكاملة:

```bash
# 1. أغلق Next.js Server (Ctrl+C)

# 2. توليد Prisma Client
npx prisma generate

# 3. أعد تشغيل Server
npm run dev
```

