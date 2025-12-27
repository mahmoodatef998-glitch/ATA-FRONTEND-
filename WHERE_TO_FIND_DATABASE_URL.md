# 📍 أين تجد DATABASE_URL في Vercel

## 🎯 المكان الصحيح

### الخطوة 1: افتح Vercel Dashboard
```
https://vercel.com/dashboard
```

### الخطوة 2: اختر مشروعك
- اضغط على مشروع ATA CRM

### الخطوة 3: Settings
- من القائمة الجانبية، اضغط على **Settings**

### الخطوة 4: Environment Variables
- من القائمة الجانبية في Settings، اضغط على **Environment Variables**

---

## 🔍 ما الذي تبحث عنه؟

### ستجد قائمة مثل هذا:

| Key | Value | Environment | Actions |
|-----|-------|-------------|---------|
| DATABASE_URL | `postgresql://...` | Production | Edit / Delete |
| NEXTAUTH_SECRET | `...` | Production | Edit / Delete |
| ... | ... | ... | ... |

---

## ✅ كيف تتحقق من DATABASE_URL

### 1. ابحث عن `DATABASE_URL` في القائمة

### 2. اضغط على **Edit** أو **Value** لرؤية القيمة الكاملة

### 3. القيمة يجب أن تكون:

```
postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?connection_limit=20&pool_timeout=10&connect_timeout=10&sslmode=require
```

---

## 🔍 تفصيل القيمة

### 1. **Port 6543**
```
...pooler.supabase.com:6543/postgres...
                    ^^^^
                    هنا Port
```

### 2. **Host pooler.supabase.com**
```
...@aws-1-ap-southeast-1.pooler.supabase.com:6543...
                    ^^^^^^^^^^^^^^^^^^^^^^^^
                    هنا Host (يحتوي على pooler.supabase.com)
```

### 3. **Parameters**
```
...postgres?connection_limit=20&pool_timeout=10&connect_timeout=10&sslmode=require
       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
       هنا Parameters (بعد علامة ?)
```

---

## 📝 مثال كامل

### ✅ القيمة الصحيحة:
```
postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?connection_limit=20&pool_timeout=10&connect_timeout=10&sslmode=require
```

**تفصيل:**
- `postgresql://` - Protocol
- `postgres.xvpjqmftyqipyqomnkgm` - Username
- `M00243540000m` - Password
- `aws-1-ap-southeast-1.pooler.supabase.com` - Host (يحتوي على `pooler.supabase.com`)
- `6543` - Port (Transaction pooler)
- `/postgres` - Database name
- `?connection_limit=20&pool_timeout=10&connect_timeout=10&sslmode=require` - Parameters

---

## ❌ القيمة الخاطئة (Direct Connection):
```
postgresql://postgres:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres
```

**المشاكل:**
- ❌ Port `5432` (يجب أن يكون `6543`)
- ❌ Host `db.xvpjqmftyqipyqomnkgm.supabase.co` (يجب أن يحتوي على `pooler.supabase.com`)
- ❌ لا يوجد Parameters

---

## 🛠️ كيفية التحديث

### 1. اضغط على **Edit** بجانب `DATABASE_URL`

### 2. في حقل **Value**، الصق:
```
postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?connection_limit=20&pool_timeout=10&connect_timeout=10&sslmode=require
```

### 3. تأكد من:
- ✅ **Environment** = Production (أو Preview/Development إذا أردت)
- ✅ **Value** يحتوي على كل القيمة أعلاه

### 4. اضغط **Save**

### 5. عمل Redeploy:
   - Vercel Dashboard → Deployments
   - آخر deployment → ⋮ → Redeploy

---

## 📸 Screenshot Guide (نصي)

### في Vercel Dashboard:

```
┌─────────────────────────────────────────┐
│  Vercel Dashboard                       │
├─────────────────────────────────────────┤
│  [Projects] [Deployments] [Settings] ← هنا│
│                                         │
│  Settings:                              │
│  ├─ General                             │
│  ├─ Environment Variables ← هنا اضغط    │
│  ├─ Domains                             │
│  └─ ...                                 │
└─────────────────────────────────────────┘
```

### في Environment Variables:

```
┌─────────────────────────────────────────────────────────┐
│  Environment Variables                                   │
├─────────────────────────────────────────────────────────┤
│  Key              Value              Environment  Actions│
│  ────────────────────────────────────────────────────── │
│  DATABASE_URL     postgresql://...   Production  [Edit] │ ← هنا
│  NEXTAUTH_SECRET  ...                Production  [Edit] │
│  ...                                                      │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist

- [ ] ✅ فتحت Vercel Dashboard
- [ ] ✅ اخترت المشروع
- [ ] ✅ Settings → Environment Variables
- [ ] ✅ وجدت `DATABASE_URL`
- [ ] ✅ Port = `6543`
- [ ] ✅ Host يحتوي على `pooler.supabase.com`
- [ ] ✅ Parameters موجودة بعد `?`
- [ ] ✅ عملت Save
- [ ] ✅ عملت Redeploy

---

## 🆘 إذا لم تجد DATABASE_URL

### 1. اضغط **Add New** في أعلى الصفحة

### 2. املأ:
- **Key**: `DATABASE_URL`
- **Value**: الصق القيمة الكاملة
- **Environment**: Production (و Preview/Development إذا أردت)

### 3. Save

---

**تاريخ:** 2024-12-XX

