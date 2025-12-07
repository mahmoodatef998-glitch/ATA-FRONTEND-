# 🔧 تطبيق RBAC يدوياً (إذا فشل Prisma Migrate)

## المشكلة:
Prisma لا يستطيع الاتصال بقاعدة البيانات رغم أن PostgreSQL يعمل.

## الحل البديل: تطبيق SQL مباشرة

### الخطوة 1: فتح PostgreSQL

#### الطريقة 1: من Command Line
```bash
# إذا كان psql في PATH
psql -U postgres -d ata_crm
```

#### الطريقة 2: من pgAdmin
1. افتح pgAdmin
2. اتصل بـ PostgreSQL
3. افتح Query Tool
4. اختر قاعدة البيانات `ata_crm`

#### الطريقة 3: من Prisma Studio (إذا كان يعمل)
```bash
npx prisma studio
```

### الخطوة 2: تطبيق Migration SQL

انسخ محتوى ملف `prisma/migrations/add_rbac_tables/migration.sql` والصقه في Query Tool ثم شغله.

**أو استخدم هذا الأمر:**
```sql
-- انسخ كل محتوى migration.sql هنا
```

### الخطوة 3: Seed البيانات

بعد تطبيق Migration، شغل:
```bash
npm run prisma:seed:rbac
```

---

## التحقق من النجاح:

### 1. تحقق من الجداول:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('roles', 'permissions', 'role_permissions', 'user_roles');
```

يجب أن ترى 4 جداول ✅

### 2. تحقق من البيانات:
```sql
SELECT COUNT(*) FROM roles;
SELECT COUNT(*) FROM permissions;
SELECT COUNT(*) FROM role_permissions;
```

يجب أن ترى:
- ✅ 6+ roles
- ✅ 50+ permissions
- ✅ 100+ role_permissions

---

## إذا استمرت المشكلة:

### 1. تحقق من إعدادات PostgreSQL:

**ملف `pg_hba.conf`:**
```
# يجب أن يحتوي على:
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

**ملف `postgresql.conf`:**
```
listen_addresses = 'localhost'  # أو '*'
port = 5432
```

### 2. أعد تشغيل PostgreSQL:
```powershell
# Windows
Restart-Service postgresql-x64-XX
```

### 3. تحقق من Firewall:
```powershell
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*postgres*"}
```

---

## ملاحظة:

بعد تطبيق Migration يدوياً، **لا تشغل** `prisma migrate dev` مرة أخرى لأن الجداول موجودة بالفعل.

بدلاً من ذلك، سجل Migration في Prisma:
```bash
# إنشاء migration فارغ
npx prisma migrate resolve --applied add_rbac_tables
```

---

## الخطوات النهائية:

1. ✅ تطبيق SQL migration
2. ✅ Seed البيانات
3. ✅ تسجيل Migration في Prisma
4. ✅ إعادة تشغيل development server
5. ✅ اختبار النظام


