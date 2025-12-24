# 🔍 كيفية العثور على Cloud Name الصحيح

## ⚠️ المشكلة:
"Root" هو **Key Name** وليس **Cloud Name**!

## 📋 الفرق:

### Key Name:
- اسم المفتاح (مثل "Root")
- **ليس** Cloud Name

### Cloud Name:
- اسم الحساب في Cloudinary
- عادة lowercase بدون مسافات
- **مختلف** عن Key Name

## 🔧 كيفية العثور على Cloud Name:

### الطريقة 1: من Dashboard الرئيسي

1. افتح https://cloudinary.com/console
2. بعد تسجيل الدخول، **انظر في أعلى الصفحة**
3. ستجد **Cloud Name** بجانب اسمك
4. مثال: `dxxxxx` أو `mycloudname` أو `ata-crm-123`

### الطريقة 2: من Settings

1. افتح https://cloudinary.com/console
2. اذهب إلى **Settings** (في القائمة الجانبية)
3. اذهب إلى **Account Details**
4. ابحث عن **Cloud Name** (ليس Key Name)
5. انسخه **بالضبط** كما هو

### الطريقة 3: من URL

1. افتح https://cloudinary.com/console
2. انظر إلى URL في المتصفح
3. قد يكون Cloud Name في URL مثل:
   - `https://console.cloudinary.com/settings/[CLOUD_NAME]`
   - أو في أي URL في Dashboard

## 📝 مثال:

في Dashboard قد ترى:
```
Cloud Name: dxxxxx
API Key: 354337387952325
API Secret: VgextRAmnanJMAOxklFl1E730kg
Key Name: Root
```

**Cloud Name هنا هو:** `dxxxxx` (ليس "Root")

## ✅ بعد العثور على Cloud Name:

عدّل ملف `.env`:
```env
CLOUDINARY_CLOUD_NAME="your-actual-cloud-name"
CLOUDINARY_API_KEY="354337387952325"
CLOUDINARY_API_SECRET="VgextRAmnanJMAOxklFl1E730kg"
```

ثم شغّل:
```bash
TEST_CLOUDINARY.bat
```

## 💡 ملاحظات:

- Cloud Name عادة يكون **lowercase**
- بدون مسافات
- قد يحتوي على dashes (-) أو underscores (_)
- قد يحتوي على أرقام

