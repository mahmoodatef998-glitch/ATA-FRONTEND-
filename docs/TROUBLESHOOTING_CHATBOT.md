# Chatbot Troubleshooting Guide

## مشكلة: 405 Method Not Allowed على Vercel

### السبب:
- الـ API route لم يتم deploy بشكل صحيح
- Vercel لم يتعرف على POST method

### الحل:

#### 1. التحقق من الملف:
تأكد من أن `app/api/chat/route.ts` موجود ويحتوي على:
```typescript
export async function GET() { ... }
export async function OPTIONS() { ... }
export async function POST(request: NextRequest) { ... }
```

#### 2. Redeploy على Vercel:
1. اذهب إلى Vercel Dashboard
2. Deployments → Latest
3. اضغط "..." → Redeploy
4. اختر **"Use existing Build Cache"** = OFF (مهم!)
5. اضغط Redeploy

#### 3. تحقق من Build Logs:
- ابحث عن `app/api/chat/route`
- تأكد من عدم وجود أخطاء في الـ Build

---

## مشكلة: Network Error في `/api/chat`

### في Vercel:

#### التحقق:
1. افتح F12 → Network
2. اضغط على `/api/chat`
3. تحقق من:
   - **Status:** يجب 200 (ليس 405 أو 503)
   - **Response:** يجب JSON مع `success: true`

#### إذا كان 405:
- الـ route لم يتم deploy
- **الحل:** Redeploy بدون Build Cache

#### إذا كان 503:
- `GROQ_API_KEY` غير موجود
- **الحل:** 
  1. Settings → Environment Variables
  2. تأكد من وجود `GROQ_API_KEY`
  3. Redeploy

---

## مشكلة: Chrome Extension Errors

### الأخطاء من Extensions:
```
chrome-extension://eppiocemhmnlbhjplcgkofciiegomcon
```

### الحل:
- **تجاهل هذه الأخطاء** - ليست من موقعك
- أو عطّل Extensions مؤقتاً للاختبار

---

## مشكلة: icon.svg 404

### السبب:
ملف `icon.svg` غير موجود

### الحل:
1. احذف من `app/layout.tsx`:
```typescript
{ url: '/icon.svg', type: 'image/svg+xml' },
```

2. أو أنشئ ملف `public/icon.svg`

---

## مشكلة: CSP Violation (Vercel Live)

### الخطأ:
```
Loading 'https://vercel.live/_next-live/feedback/feedback.js' violates CSP
```

### الحل:
- تم إضافة `https://vercel.live` في CSP
- Redeploy لتطبيق التغيير

---

## خطوات التشخيص السريعة:

### 1. تحقق من Environment Variables:
**Vercel:**
- Settings → Environment Variables
- تأكد من: `GROQ_API_KEY` موجود في Production

**Railway:**
- Variables tab
- تأكد من: `GROQ_API_KEY` موجود

### 2. تحقق من Deployment Status:
- تأكد من أن آخر deployment نجح (✅)
- ليس فيه أخطاء

### 3. اختبر API مباشرة:
افتح في المتصفح:
```
https://your-site.vercel.app/api/chat
```

يجب أن ترى:
```json
{
  "success": true,
  "message": "Chatbot API is running",
  "model": "llama-3.3-70b-versatile"
}
```

إذا ظهرت هذه الرسالة → API يعمل!

### 4. اختبر Chatbot:
- اضغط على Chatbot
- اكتب رسالة
- تحقق من Network → `/api/chat`
  - **Method:** POST
  - **Status:** 200
  - **Response:** `{ success: true, data: { reply: "..." } }`

---

## الملخص:

| المشكلة | السبب | الحل |
|---------|-------|------|
| 405 Method Not Allowed | Route لم يتم deploy | Redeploy بدون cache |
| 503 Service Unavailable | GROQ_API_KEY غير موجود | أضف Variable → Redeploy |
| Chrome Extension Error | Browser extension | تجاهل أو عطّل Extension |
| CSP Violation | Vercel Live | تم إضافة في CSP |
| icon.svg 404 | ملف غير موجود | احذف من metadata |

---

## للدعم:

إذا استمرت المشكلة، أرسل لي:
1. Vercel/Railway deployment logs
2. Network tab → `/api/chat` → Response
3. Console errors (فقط من `/api/chat`)



