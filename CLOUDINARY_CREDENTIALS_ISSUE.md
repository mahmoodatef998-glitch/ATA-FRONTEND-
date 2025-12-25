# ⚠️ مشكلة في بيانات Cloudinary

## الخطأ:
```
cloud_name mismatch
Error 401: Invalid credentials or Cloud Name
```

## السبب المحتمل:
الـ Cloud Name لا يطابق API Key و API Secret. قد يكون:
1. Cloud Name مختلف تماماً
2. API Key/Secret من حساب Cloudinary مختلف
3. الحساب غير نشط

## الحل:

### الخطوة 1: التحقق من Cloudinary Dashboard

1. **افتح:** https://cloudinary.com/console
2. **سجل الدخول** إلى حسابك
3. **اذهب إلى:** Settings → **Account Details**
4. **انسخ بالضبط:**
   - **Cloud Name** (عادة lowercase بدون مسافات)
   - **API Key** (تحقق من أنه `438135271847632`)
   - **API Secret** (تحقق من أنه يبدأ بـ `pFK3kvryO_`)

### الخطوة 2: التحقق من التطابق

تأكد من أن:
- ✅ Cloud Name و API Key و API Secret **كلهم من نفس الحساب**
- ✅ لا توجد مسافات إضافية في Cloud Name
- ✅ Cloud Name مطابق تماماً (حرف بحرف)

### الخطوة 3: تعديل ملف `.env`

بعد التحقق، عدّل ملف `.env`:

```env
CLOUDINARY_CLOUD_NAME="your-exact-cloud-name-from-dashboard"
CLOUDINARY_API_KEY="438135271847632"
CLOUDINARY_API_SECRET="pFK3kvryO_4vwxW-uLEUom380IA"
```

### الخطوة 4: اختبار

شغل:
```bash
TEST_CLOUDINARY.bat
```

## ملاحظات مهمة:

1. **Cloud Name عادة يكون:**
   - lowercase (حروف صغيرة)
   - بدون مسافات
   - قد يحتوي على dashes (-) أو underscores (_)
   - قد يحتوي على أرقام في النهاية

2. **أمثلة محتملة:**
   - `atacrm123`
   - `ata-crm-prod`
   - `ata_crm_test`
   - `mycloudname456`

3. **إذا كان Cloud Name مختلف:**
   - قد يكون الحساب مختلف
   - قد تحتاج إلى إنشاء حساب جديد
   - أو استخدام بيانات حساب آخر

## إذا استمرت المشكلة:

1. **إنشاء حساب جديد في Cloudinary:**
   - سجل في https://cloudinary.com (مجاني)
   - احصل على Cloud Name و API Key/Secret الجديدة
   - استخدمها في `.env`

2. **التحقق من الحساب:**
   - تأكد من أن الحساب نشط
   - تحقق من أن API Key/Secret صحيحة

