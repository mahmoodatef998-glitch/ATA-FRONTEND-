# 🔧 إصلاح سريع: Company Knowledge Fields

## المشكلة
الحقول الجديدة (`description`, `products`, `services`, `contactInfo`, `businessHours`, `specialties`) موجودة في Prisma schema لكن **غير موجودة في قاعدة البيانات**.

## الحل السريع (الأسهل)

### الطريقة 1: Supabase SQL Editor (الأسرع) ⚡

1. **افتح Supabase Dashboard**
2. **اذهب إلى SQL Editor**
3. **انسخ والصق هذا SQL:**

```sql
ALTER TABLE "companies" 
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "products" TEXT,
ADD COLUMN IF NOT EXISTS "services" TEXT,
ADD COLUMN IF NOT EXISTS "contactInfo" TEXT,
ADD COLUMN IF NOT EXISTS "businessHours" TEXT,
ADD COLUMN IF NOT EXISTS "specialties" TEXT;
```

4. **اضغط Run**
5. **بعدها شغّل:**
```bash
npx prisma db push
```

### الطريقة 2: استخدام الملف الموجود

1. **افتح:** `scripts/add-company-knowledge-fields.sql`
2. **انسخ المحتوى**
3. **الصقه في Supabase SQL Editor**
4. **شغّله**
5. **بعدها:**
```bash
npx prisma db push
```

### الطريقة 3: Batch File

```bash
ADD_COMPANY_KNOWLEDGE_FIELDS.bat
```

---

## بعد الإصلاح

1. ✅ أعد تحميل صفحة Company Knowledge
2. ✅ جرب حفظ البيانات مرة أخرى
3. ✅ يجب أن يعمل الآن!

---

## التحقق من الإصلاح

شغّل هذا SQL في Supabase للتحقق:

```sql
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'companies' 
  AND column_name IN ('description', 'products', 'services', 'contactInfo', 'businessHours', 'specialties');
```

يجب أن ترى 6 أعمدة!

