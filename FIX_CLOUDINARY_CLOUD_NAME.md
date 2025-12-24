# 🔧 إصلاح Cloud Name في Cloudinary

## المشكلة:
```
Invalid cloud_name ata-crm
```

## الحل:
Cloud Name في Cloudinary Dashboard قد يكون مختلفاً عن "ata-crm".

### كيفية معرفة Cloud Name الصحيح:

1. افتح https://cloudinary.com/console
2. اذهب إلى **Settings** → **Account Details**
3. انسخ **Cloud Name** من هناك
4. عادة Cloud Name يكون:
   - بدون مسافات
   - lowercase أو mixed case
   - قد يحتوي على dashes (-) أو underscores (_)
   - مثال: `ata-crm-name` أو `ata_crm` أو `atacrm`

### تعديل Cloud Name في .env:

افتح ملف `.env` وعدّل السطر:
```
CLOUDINARY_CLOUD_NAME="your-actual-cloud-name"
```

استبدل `your-actual-cloud-name` بالـ Cloud Name الصحيح من Cloudinary Dashboard.

### بعد التعديل:

شغل:
```bash
TEST_CLOUDINARY.bat
```

أو:
```bash
npx tsx scripts/test-cloudinary.ts
```

