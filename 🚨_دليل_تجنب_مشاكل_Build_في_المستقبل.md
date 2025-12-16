# 🚨 دليل تجنب مشاكل Build في المشاريع القادمة

## 📋 ملخص المشاكل التي واجهناها

### 1. ❌ **swagger-ui-react في devDependencies بدلاً من dependencies**

**المشكلة:**
- Vercel يحتاج جميع packages المستخدمة في production في `dependencies`
- `swagger-ui-react` كان في `devDependencies` ففشل Build

**الحل:**
```json
// ✅ صحيح
"dependencies": {
  "swagger-ui-react": "^5.30.3"
}

// ❌ خطأ
"devDependencies": {
  "swagger-ui-react": "^5.30.3"
}
```

**قاعدة عامة:**
- **dependencies**: جميع packages المستخدمة في production code
- **devDependencies**: فقط packages للتطوير (types, testing, linting)

---

### 2. ❌ **ملفات .next كبيرة جداً (تجاوزت 100MB)**

**المشكلة:**
- ملفات `.next` (build output) تم رفعها على GitHub
- بعض الملفات تجاوزت 100MB (حد GitHub)
- Build files لا يجب أن تُرفع على GitHub

**الحل:**
```gitignore
# ✅ أضف إلى .gitignore
/.next/
/out/
**/.next/
apps/**/.next/
```

**قاعدة عامة:**
- **لا ترفع**: `.next`, `node_modules`, `.env`, `dist`, `build`
- **ارفع**: source code فقط

---

### 3. ❌ **استخدام React Hook داخل دالة عادية**

**المشكلة:**
```typescript
// ❌ خطأ
const checkPermission = (oldPermission: Permission): boolean => {
  const newPermission = migratePermission(oldPermission);
  return useCan(newPermission); // ❌ Hook داخل دالة عادية!
};
```

**الحل:**
```typescript
// ✅ صحيح - استخدم 'can' function بدلاً من 'useCan' hook
import { can } from "@/lib/permissions/frontend-helpers";
import { usePermissions } from "@/contexts/permissions-context";

const { permissions } = usePermissions();

const checkPermission = (oldPermission: Permission): boolean => {
  const newPermission = migratePermission(oldPermission);
  return can(permissions, newPermission); // ✅ Function عادية
};
```

**قاعدة عامة:**
- **Hooks** (useCan, useState, useEffect): فقط داخل React components أو custom hooks
- **Functions** (can, hasPermission): يمكن استخدامها في أي مكان

---

### 4. ❌ **useEffect dependencies warnings**

**المشكلة:**
```typescript
// ❌ خطأ - missing dependencies
useEffect(() => {
  fetchCalendarData();
}, [companyId]); // ⚠️ fetchCalendarData مفقود!
```

**الحل:**
```typescript
// ✅ صحيح - استخدم useCallback
import { useCallback } from "react";

const fetchCalendarData = useCallback(async () => {
  // ... code
}, [companyId]);

useEffect(() => {
  fetchCalendarData();
}, [fetchCalendarData]); // ✅ الآن fetchCalendarData في dependencies
```

**قاعدة عامة:**
- استخدم `useCallback` للدوال المستخدمة في `useEffect`
- أضف جميع dependencies إلى array

---

### 5. ❌ **TypeScript type definitions مفقودة**

**المشكلة:**
- `swagger-ui-react` لا يحتوي على `@types/swagger-ui-react`
- TypeScript يشتكي من missing type definitions

**الحل:**
```typescript
// ✅ أنشئ ملف types/swagger-ui-react.d.ts
declare module "swagger-ui-react" {
  import { Component } from "react";
  
  export interface SwaggerUIProps {
    spec?: any;
    url?: string;
    // ... other props
  }
  
  export default class SwaggerUI extends Component<SwaggerUIProps> {}
}
```

**قاعدة عامة:**
- إذا كان package لا يحتوي على types، أنشئ ملف `.d.ts` في مجلد `types/`
- أضف `types/**/*.d.ts` إلى `tsconfig.json`

---

## ✅ Checklist قبل Deploy

### قبل Push على GitHub:

- [ ] **تحقق من package.json**
  - [ ] جميع production packages في `dependencies`
  - [ ] فقط dev tools في `devDependencies`

- [ ] **تحقق من .gitignore**
  - [ ] `.next/` موجود
  - [ ] `node_modules/` موجود
  - [ ] `.env*` موجود
  - [ ] `dist/`, `build/` موجود

- [ ] **تحقق من TypeScript**
  - [ ] لا توجد type errors
  - [ ] جميع packages لها type definitions
  - [ ] ملفات `.d.ts` موجودة للـ packages بدون types

- [ ] **تحقق من React Hooks**
  - [ ] لا توجد hooks داخل دوال عادية
  - [ ] جميع `useEffect` dependencies صحيحة
  - [ ] استخدم `useCallback` للدوال في `useEffect`

- [ ] **تحقق من Build محلياً**
  ```bash
  npm run build
  ```
  - [ ] Build ينجح بدون errors
  - [ ] لا توجد warnings خطيرة

---

## 📚 Best Practices للمشاريع القادمة

### 1. **تنظيم package.json**

```json
{
  "dependencies": {
    // ✅ Production packages فقط
    "next": "^15.0.0",
    "react": "^19.0.0",
    "swagger-ui-react": "^5.30.3"
  },
  "devDependencies": {
    // ✅ Development tools فقط
    "@types/node": "^22.10.2",
    "typescript": "^5.7.2",
    "eslint": "^9.17.0"
  }
}
```

### 2. **تنظيم .gitignore**

```gitignore
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build
/dist

# Environment variables
.env
.env*.local

# TypeScript
*.tsbuildinfo
next-env.d.ts

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

### 3. **تنظيم TypeScript**

```typescript
// types/custom-module.d.ts
declare module "custom-module" {
  export interface CustomProps {
    // ...
  }
  export default function Custom(props: CustomProps): JSX.Element;
}
```

```json
// tsconfig.json
{
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    "types/**/*.d.ts"
  ]
}
```

### 4. **تنظيم React Hooks**

```typescript
// ✅ صحيح
function MyComponent() {
  const { permissions } = usePermissions(); // Hook في component
  
  const checkPermission = useCallback((permission: string) => {
    return can(permissions, permission); // Function عادية
  }, [permissions]);
  
  useEffect(() => {
    checkPermission("read");
  }, [checkPermission]);
}
```

### 5. **اختبار Build محلياً**

```bash
# قبل Push
npm run build        # Test production build
npm run lint         # Check linting
npm run type-check   # Check TypeScript
```

---

## 🎯 الخلاصة

### المشاكل التي واجهناها كانت:

1. ✅ **مشاكل عادية** - تحدث في معظم المشاريع
2. ✅ **قابلة للحل** - كل مشكلة لها حل واضح
3. ✅ **قابلة للوقاية** - يمكن تجنبها باتباع Best Practices

### نصائح للمستقبل:

1. **اختبار Build محلياً** قبل Push
2. **مراجعة package.json** قبل Deploy
3. **التحقق من .gitignore** دائماً
4. **استخدام TypeScript** بشكل صحيح
5. **اتباع React Hooks Rules** بدقة

---

## 📖 مراجع مفيدة

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [React Hooks Rules](https://react.dev/reference/rules/rules-of-hooks)
- [TypeScript Module Declaration](https://www.typescriptlang.org/docs/handbook/modules.html#ambient-modules)
- [Vercel Build Errors](https://vercel.com/docs/concepts/deployments/builds)

---

**✅ الآن أنت جاهز للمشاريع القادمة!**

