# 🔧 Supabase Connection Setup - Step by Step

## ✅ Choose Transaction Pooler

**Why?** Your project is on Vercel (serverless functions), so you need **Transaction Pooler**.

---

## 📋 Step-by-Step Instructions

### Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: **Settings** → **Database**

---

### Step 2: Open Connection String Modal

1. Click on **"Connection String"** or **"Connection Pooling"**
2. A modal will open with connection options

---

### Step 3: Select Transaction Pooler

1. In the **"Method"** dropdown, select:
   - ✅ **"Transaction pooler"** (SHARED POOLER)
   - ❌ NOT "Direct connection"
   - ❌ NOT "Session pooler"

2. **Why Transaction Pooler?**
   - ✅ Ideal for serverless functions (Vercel)
   - ✅ Each request is brief and isolated
   - ✅ Better for stateless applications

---

### Step 4: Copy Connection String

1. After selecting "Transaction pooler", you'll see a connection string
2. It should look like:
   ```
   postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
3. **Important:** Port should be **6543** (not 5432)

---

### Step 5: Add Connection Parameters

Add these parameters to the connection string:

```bash
?connection_limit=20&pool_timeout=10&connect_timeout=10&sslmode=require
```

**Full example:**
```bash
postgresql://postgres.xxxxx:password@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?connection_limit=20&pool_timeout=10&connect_timeout=10&sslmode=require
```

---

### Step 6: Update .env File

1. Open your `.env` file
2. Find `DATABASE_URL`
3. Replace it with the new connection string (with parameters)
4. Save the file

---

### Step 7: Restart Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## ✅ Verification

After setup, you should see:
- ✅ Faster database queries (20-30% improvement)
- ✅ Better handling of concurrent requests
- ✅ No connection errors

---

## 🎯 Summary

**What to choose:**
- ✅ **Transaction pooler** (Port 6543)

**What NOT to choose:**
- ❌ Direct connection (Port 5432) - for long-lived connections
- ❌ Session pooler (Port 5432) - not for serverless

**Your setup:**
- Platform: Vercel (serverless)
- Best method: Transaction pooler
- Port: 6543
- Parameters: connection_limit=20, pool_timeout=10, etc.

---

## 📞 Need Help?

If you see connection errors:
1. Verify port is 6543 (not 5432)
2. Check that "Transaction pooler" is selected
3. Verify all parameters are added correctly
4. Restart your server after changes

---

**Remember:** Transaction pooler is the correct choice for Vercel serverless functions! 🚀

