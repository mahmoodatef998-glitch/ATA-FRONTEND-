# Environment Variables Setup Guide

## Local Development (.env)

### Required Variables

Add these to your `.env` file in the project root:

```env
# Groq API Key for AI Chatbot
GROQ_API_KEY=your_groq_api_key_here
```

### Important Notes:

1. **No spaces** around the `=` sign
2. **No quotes** around the value (unless the value itself contains spaces)
3. **Restart server** after adding new variables:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

---

## Vercel Deployment

### Steps to Add Environment Variables:

1. **Go to Vercel Dashboard:**
   - Visit [vercel.com](https://vercel.com)
   - Select your project

2. **Navigate to Settings:**
   - Click on your project
   - Go to **Settings** tab
   - Click **Environment Variables** in the left sidebar

3. **Add Variable:**
   - Click **Add New**
   - **Key:** `GROQ_API_KEY`
   - **Value:** `your_groq_api_key_here`
   - **Environment:** Select all (Production, Preview, Development)
   - Click **Save**

4. **Redeploy:**
   - Go to **Deployments** tab
   - Click **Redeploy** on the latest deployment
   - Or push a new commit to trigger auto-deploy

### Vercel CLI (Alternative):

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Add environment variable
vercel env add GROQ_API_KEY

# When prompted, enter your Groq API key
# Select: Production, Preview, Development

# Redeploy
vercel --prod
```

---

## Railway Deployment

### Steps to Add Environment Variables:

1. **Go to Railway Dashboard:**
   - Visit [railway.app](https://railway.app)
   - Select your project

2. **Navigate to Variables:**
   - Click on your project
   - Go to **Variables** tab (or click **Variables** in the left sidebar)

3. **Add Variable:**
   - Click **New Variable** or **+ New**
   - **Key:** `GROQ_API_KEY`
   - **Value:** `your_groq_api_key_here`
   - Click **Add** or **Save**

4. **Redeploy:**
   - Railway will automatically redeploy when you add variables
   - Or manually trigger: **Settings** → **Redeploy**

### Railway CLI (Alternative):

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Add environment variable
railway variables set GROQ_API_KEY=your_groq_api_key_here

# Deploy
railway up
```

---

## Environment Variables List

### Required for Chatbot:
- `GROQ_API_KEY` - Groq API key for AI chatbot

### Already Configured:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - NextAuth.js secret
- `NEXTAUTH_URL` - Application URL
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `SMTP_*` - Email configuration

---

## Verification

### Local:
1. Check `.env` file exists
2. Verify variable is present: `grep GROQ_API_KEY .env`
3. Restart server: `npm run dev`
4. Check console logs for: `🔍 Checking GROQ_API_KEY...`

### Vercel:
1. Go to **Settings** → **Environment Variables**
2. Verify `GROQ_API_KEY` is listed
3. Check deployment logs for errors

### Railway:
1. Go to **Variables** tab
2. Verify `GROQ_API_KEY` is listed
3. Check deployment logs for errors

---

## Troubleshooting

### Variable Not Found:
- ✅ Check `.env` file is in project root
- ✅ No spaces around `=`
- ✅ Restart server after adding
- ✅ Check for typos in variable name

### Still Not Working:
- Clear `.next` folder: `rm -rf .next`
- Restart server: `npm run dev`
- Check console logs for errors

---

## Security Notes

⚠️ **Never commit `.env` to Git!**

- `.env` should be in `.gitignore`
- Use environment variables in deployment platforms
- Rotate API keys if exposed

