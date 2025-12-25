# إضافة بيانات Cloudinary إلى .env

## البيانات المقدمة:
- **Cloud Name:** ATA CRM NAME
- **API Key:** 438135271847632
- **API Secret:** pFK3kvryO_4vwxW-uLEUom380IA

## ملاحظة مهمة:
Cloud Name في Cloudinary عادة يكون بدون مسافات. إذا كان Cloud Name الفعلي يحتوي على مسافات، قد تحتاج إلى:
1. التحقق من Cloudinary Dashboard
2. استخدام Cloud Name بدون مسافات (مثل: `ata-crm-name`)

## كيفية الإضافة:

### الطريقة 1: إضافة يدوياً
افتح ملف `.env` وأضف هذه الأسطر:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="ata-crm-name"
CLOUDINARY_API_KEY="438135271847632"
CLOUDINARY_API_SECRET="pFK3kvryO_4vwxW-uLEUom380IA"
```

**ملاحظة:** استبدل `ata-crm-name` بالـ Cloud Name الصحيح من Cloudinary Dashboard (عادة بدون مسافات)

### الطريقة 2: استخدام PowerShell
```powershell
Add-Content .env "`n# Cloudinary Configuration`nCLOUDINARY_CLOUD_NAME=`"ata-crm-name`"`nCLOUDINARY_API_KEY=`"438135271847632`"`nCLOUDINARY_API_SECRET=`"pFK3kvryO_4vwxW-uLEUom380IA`""
```

## التحقق من الإعدادات:

بعد إضافة البيانات، شغل:
```bash
CHECK_CLOUDINARY.bat
```

أو:
```bash
npx tsx scripts/check-cloudinary-config.ts
```

## إذا كان Cloud Name يحتوي على مسافات:

إذا كان Cloud Name الفعلي في Cloudinary Dashboard هو "ATA CRM NAME" (مع مسافات)، جرب:
1. `ata-crm-name` (بدون مسافات، lowercase)
2. `ATA-CRM-NAME` (بدون مسافات، uppercase)
3. `ata_crm_name` (بدون مسافات، underscore)

عادة Cloudinary يستخدم lowercase بدون مسافات.

