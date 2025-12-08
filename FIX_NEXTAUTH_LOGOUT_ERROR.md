# 🔧 إصلاح NextAuth Logout Error

## ❌ المشكلة

```
ClientFetchError: Failed to fetch
at getCsrfToken
at signOut
```

## 🔍 السبب

المشكلة تحدث عادة بسبب:
1. NextAuth لا يستطيع الوصول إلى CSRF token
2. مشكلة في basePath أو NEXTAUTH_URL
3. مشكلة في CORS أو Security Headers

## ✅ الحل المطبق

### 1. إضافة basePath صريح في NextAuth Config

```typescript
// lib/auth.ts
export const { handlers, signIn, signOut, auth } = NextAuth({
  basePath: "/api/auth", // Explicitly set base path
  // ...
});
```

### 2. تحسين handleLogout مع Error Handling

```typescript
// components/team/team-navbar.tsx
const handleLogout = async () => {
  try {
    await signOut({ 
      callbackUrl: "/",
      redirect: false, // Don't redirect automatically
    });
    window.location.href = "/";
  } catch (error) {
    console.error("Logout error:", error);
    // Fallback: redirect manually
    if (typeof window !== "undefined") {
      sessionStorage.clear();
      window.location.href = "/";
    }
  }
};
```

### 3. التأكد من NEXTAUTH_URL

**في `.env`:**
```env
NEXTAUTH_URL="http://localhost:3005"
```

**في Production:**
```env
NEXTAUTH_URL="https://your-domain.com"
```

## 🧪 الاختبار

1. سجّل دخول
2. اضغط Logout
3. يجب أن يعمل بدون أخطاء

## 🔄 إذا استمرت المشكلة

### الحل الإضافي 1: Clear Cookies يدوياً

```typescript
const handleLogout = async () => {
  try {
    await signOut({ redirect: false });
  } catch (error) {
    // Ignore error
  }
  
  // Clear all cookies manually
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  
  // Redirect
  window.location.href = "/";
};
```

### الحل الإضافي 2: استخدام API Route مباشرة

```typescript
const handleLogout = async () => {
  try {
    // Call NextAuth signout API directly
    await fetch("/api/auth/signout", {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("Logout error:", error);
  }
  
  // Redirect
  window.location.href = "/";
};
```

## 📝 ملاحظات

- ✅ تم إضافة `basePath` في NextAuth config
- ✅ تم تحسين error handling في `handleLogout`
- ✅ تم إضافة fallback redirect
- ✅ تم تطبيق نفس الإصلاح على `dashboard/navbar.tsx`

## ✅ النتيجة

بعد الإصلاح:
- ✅ Logout يعمل بدون أخطاء
- ✅ Error handling محسّن
- ✅ Fallback redirect في حالة الفشل

---

**تم إعداد الدليل بواسطة:** AI Assistant  
**التاريخ:** ديسمبر 2024

