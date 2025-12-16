# 🔍 ملاحظة مهمة: Date vs String في TypeScript

## ⚠️ المشكلة الشائعة

عند استخدام Prisma مع Next.js Server Components، Prisma يرجع `Date` objects، لكن Client Components تتوقع `string` في interfaces.

## 📋 الحل

### ✅ دائماً حول Date إلى string قبل تمرير البيانات إلى Client Components

```typescript
// ❌ خطأ
const data = await prisma.clients.findMany();
return <ClientList clients={data} />; // Date objects!

// ✅ صحيح
const clients = await prisma.clients.findMany();
const serializedClients = clients.map((client) => ({
  ...client,
  createdAt: client.createdAt.toISOString(),
  updatedAt: client.updatedAt.toISOString(),
  approvedAt: client.approvedAt ? client.approvedAt.toISOString() : null,
}));
return <ClientList clients={serializedClients} />; // Strings!
```

## 🎯 Checklist

قبل تمرير بيانات من Server Component إلى Client Component:

- [ ] تحقق من interface في Client Component
- [ ] إذا كان `createdAt`, `updatedAt`, أو أي Date field من نوع `string`
- [ ] حول Date objects إلى strings باستخدام `.toISOString()`

## 📝 أمثلة تم إصلاحها

1. ✅ `app/(dashboard)/dashboard/clients/page.tsx` - Client interface
2. ✅ `app/(dashboard)/dashboard/notifications/page.tsx` - Notification interface

## 💡 Best Practice

**قاعدة عامة:** دائماً حول Date objects إلى strings عند تمريرها من Server Components إلى Client Components.

