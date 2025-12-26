# 🔀 دليل دمج Main مع Cleanup-Hooks

## 📋 الخطوات بالترتيب

---

## ✅ الخطوة 1: التأكد من أنك على cleanup-hooks

```bash
git status
```

**يجب أن ترى:**
```
On branch cleanup-hooks
```

**إذا لم تكن على cleanup-hooks:**
```bash
git checkout cleanup-hooks
```

---

## ✅ الخطوة 2: Commit أي تغييرات محلية (إن وجدت)

```bash
git status
```

**إذا كان فيه ملفات modified:**
```bash
git add .
git commit -m "Save local changes before merge"
```

**إذا كان working tree clean (لا يوجد تغييرات):**
- تخطى هذه الخطوة ✅

---

## ✅ الخطوة 3: Fetch آخر التحديثات من GitHub

```bash
git fetch frontend main
git fetch frontend cleanup-hooks
```

---

## ✅ الخطوة 4: التحقق من الفروقات

```bash
# شوف آخر commits في main
git log frontend/main --oneline -5

# شوف آخر commits في cleanup-hooks
git log cleanup-hooks --oneline -5
```

---

## ✅ الخطوة 5: Merge main إلى cleanup-hooks

```bash
git merge frontend/main
```

**سينتظرك Git إذا كان فيه conflicts.**

---

## ⚠️ الخطوة 6: حل Conflicts (إن وجدت)

### إذا ظهرت رسالة "CONFLICT":

1. **افتح الملفات التي فيها conflict:**
   - Git سيعطيك قائمة بالملفات
   - مثال: `app/(dashboard)/dashboard/page.tsx`

2. **ابحث عن علامات Conflict:**
   ```
   <<<<<<< HEAD (cleanup-hooks)
   ... كود من cleanup-hooks ...
   =======
   ... كود من main ...
   >>>>>>> frontend/main
   ```

3. **اختر الكود الصحيح:**
   - احذف علامات `<<<<<<<`, `=======`, `>>>>>>>`
   - احتفظ بالكود الصحيح (أو ادمج الاثنين)

4. **بعد حل كل Conflicts:**
   ```bash
   git add .
   git commit -m "Merge main into cleanup-hooks - resolved conflicts"
   ```

### إذا لم يكن فيه conflicts:
- Git سيعمل commit تلقائياً ✅

---

## ✅ الخطوة 7: Push التغييرات

```bash
git push frontend cleanup-hooks
```

---

## ✅ الخطوة 8: التحقق من Dashboard

بعد الـ merge، اختبر Dashboard:

1. **شغل السيرفر:**
   ```bash
   npm run dev
   ```

2. **افتح Dashboard:**
   - http://localhost:3005/dashboard

3. **تحقق من:**
   - ✅ الصفحة تفتح بدون أخطاء
   - ✅ الإحصائيات تظهر
   - ✅ العناصر تظهر بشكل صحيح
   - ✅ لا يوجد أخطاء في Console

---

## 🔧 حل مشاكل Dashboard الشائعة

### مشكلة 1: Dashboard لا يفتح / Error 500

**الحل:**
```bash
# تحقق من logs
npm run dev

# ابحث عن أخطاء في Terminal
```

### مشكلة 2: عناصر Dashboard لا تظهر

**الحل:**
- تحقق من `app/(dashboard)/dashboard/page.tsx`
- تأكد أن الـ imports صحيحة
- تحقق من Console في المتصفح

### مشكلة 3: TypeScript Errors

**الحل:**
```bash
# تحقق من الأخطاء
npm run build

# أو
npx tsc --noEmit
```

---

## 📝 ملاحظات مهمة

1. **احفظ نسخة احتياطية:**
   ```bash
   git branch cleanup-hooks-backup
   ```

2. **إذا حصل خطأ:**
   ```bash
   # إلغاء الـ merge
   git merge --abort
   
   # أو الرجوع لحالة سابقة
   git reset --hard HEAD
   ```

3. **بعد الـ merge:**
   - اختبر كل شيء جيداً
   - تأكد أن Vercel deployment يعمل
   - راجع التغييرات قبل push

---

## ✅ Checklist

- [ ] ✅ على branch cleanup-hooks
- [ ] ✅ Commit أي تغييرات محلية
- [ ] ✅ Fetch latest changes
- [ ] ✅ Merge main
- [ ] ✅ حل Conflicts (إن وجدت)
- [ ] ✅ Push إلى GitHub
- [ ] ✅ اختبار Dashboard
- [ ] ✅ التحقق من عدم وجود أخطاء

---

## 🆘 إذا واجهت مشاكل

1. **أرسل رسالة الخطأ**
2. **أرسل output من:**
   ```bash
   git status
   git log --oneline -10
   ```

---

**تاريخ:** $(Get-Date -Format "yyyy-MM-dd")

