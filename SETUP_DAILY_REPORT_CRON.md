# 📅 إعداد Daily Report Cron - External Service

**التاريخ:** 22 ديسمبر 2025  
**الهدف:** إعداد Automated Daily Report Cron باستخدام External Service

---

## 🎯 المهمة

إعداد Daily Report Cron ليعمل تلقائياً كل يوم في 8 PM باستخدام External Cron Service (بدلاً من Vercel Cron Jobs).

---

## 📋 الخطوات

### 1. إنشاء حساب على cron-job.org

1. اذهب إلى: https://cron-job.org
2. Sign up (مجاني)
3. Verify email

---

### 2. إضافة Cron Job

1. بعد Login، اضغط **"Create cronjob"**
2. املأ البيانات:
   - **Title:** `ATA CRM Daily Report`
   - **Address (URL):** 
     ```
     https://ata-frontend-pied.vercel.app/api/cron/daily-report
     ```
   - **Schedule:** 
     ```
     0 20 * * *
     ```
     (يعني: كل يوم في 8 PM)
   - **Request method:** `GET`
   - **Timeout:** `300` seconds (5 minutes)

3. **Save**

---

### 3. اختبار Cron Job

1. في cron-job.org، اضغط **"Run now"** لاختبار
2. تحقق من Vercel Logs للتأكد من أن API route يعمل
3. تحقق من إرسال Email (إذا كان configured)

---

## ⚙️ Schedule Format

```
0 20 * * *
│ │ │ │ │
│ │ │ │ └── Day of week (0-7, 0 or 7 = Sunday)
│ │ │ └──── Month (1-12)
│ │ └────── Day of month (1-31)
│ └──────── Hour (0-23)
└────────── Minute (0-59)
```

**مثال:**
- `0 20 * * *` = كل يوم في 8 PM
- `0 9 * * 1` = كل إثنين في 9 AM
- `0 */6 * * *` = كل 6 ساعات

---

## 🔧 بدائل أخرى

### EasyCron (مجاني)
- URL: https://www.easycron.com
- Free: 1 cron job
- Setup مشابه

### UptimeRobot (مجاني)
- URL: https://uptimerobot.com
- Free: 50 monitors + cron jobs
- Setup مشابه

---

## ✅ التحقق

### بعد الإعداد:
1. انتظر حتى 8 PM
2. تحقق من cron-job.org logs
3. تحقق من Vercel logs
4. تحقق من إرسال Email

---

## 📊 Monitoring

### في cron-job.org:
- عرض تاريخ التنفيذ
- عرض status (success/failed)
- عرض response time
- عرض logs

---

## ⚠️ ملاحظات

1. **API Route موجود:**
   - `/api/cron/daily-report` موجود بالفعل
   - لا يحتاج تعديل

2. **Authentication:**
   - Cron endpoint قد يحتاج authentication
   - يمكن إضافة secret token في query string

3. **Error Handling:**
   - API route يجب أن يعمل حتى لو Email غير configured
   - يجب أن يعيد 200 OK

---

## 🔐 Security (اختياري)

إذا أردت إضافة security:

```typescript
// app/api/cron/daily-report/route.ts
export async function GET(request: NextRequest) {
  const authToken = request.nextUrl.searchParams.get('token');
  
  if (authToken !== process.env.CRON_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // ... rest of the code
}
```

**ثم في cron-job.org:**
```
URL: https://ata-frontend-pied.vercel.app/api/cron/daily-report?token=YOUR_SECRET_TOKEN
```

---

## ✅ Checklist

- [ ] إنشاء حساب cron-job.org
- [ ] إضافة cron job
- [ ] اختبار "Run now"
- [ ] التحقق من Vercel logs
- [ ] انتظار 8 PM للتحقق من Automation
- [ ] (اختياري) إضافة security token

---

**آخر تحديث:** 22 ديسمبر 2025  
**الحالة:** ✅ جاهز للإعداد


