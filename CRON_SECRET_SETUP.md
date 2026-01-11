# 🔐 CRON_SECRET Setup Guide

## What is Cron?

**Cron** is a time-based job scheduler. Think of it like an **alarm clock for your server**:

- ⏰ It automatically runs tasks at scheduled times (every hour, daily, weekly, etc.)
- 🤖 It works in the background without human intervention
- 📅 Common schedules: "every hour", "every day at 3 AM", "every Monday"

### In Your Case:

Your Tavily integration needs to **fetch new articles every hour automatically**. Instead of you manually visiting a webpage every hour, a **cron job** does it for you automatically.

```
Every Hour (automatically):
   ↓
Cron Service calls → /api/cron/tavily
   ↓
Your app fetches fresh news from Tavily
   ↓
Articles stored in cache
   ↓
Your website shows updated news
```

---

## Why Do We Need CRON_SECRET?

**Security!** 🛡️

Your `/api/cron/tavily` endpoint is on the internet. Without protection, **anyone** could:
- Call it repeatedly (waste your Tavily credits)
- Overload your server
- Cause unnecessary API calls (cost money)

**CRON_SECRET** is like a **password** that only the cron service knows. It proves the request is legitimate.

```
❌ Without CRON_SECRET:
   Anyone: "Hey /api/cron/tavily, run!"
   Your Server: "OK!" (BAD - anyone can trigger it)

✅ With CRON_SECRET:
   Cron Service: "Hey /api/cron/tavily?secret=ABC123, run!"
   Your Server: "OK! Secret matches, I trust you."
   
   Random Person: "Hey /api/cron/tavily, run!"
   Your Server: "No! Wrong secret. Access denied." (GOOD)
```

---

## Where to Add CRON_SECRET

### Step 1: Generate a Secure Secret

You need a **random, long string** as your secret. Here are easy ways to generate one:

#### Option A: Online Generator (Easiest)
1. Go to: https://randomkeygen.com/
2. Copy a **"CodeIgniter Encryption Keys"** (64 characters long)
3. Example: `aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE1fG3hI5jK7lM9nO1pQ3`

#### Option B: Command Line (If you have terminal)
```bash
# On Mac/Linux:
openssl rand -base64 32

# Or use Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### Option C: Simple Random String
Just make up a long random string:
- Mix letters (uppercase & lowercase), numbers, and symbols
- At least 20+ characters long
- Example: `MySecureCronSecret2025!@#TavilyKeyXYZ789`

---

### Step 2: Add to Railway Environment Variables

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Log in to your account

2. **Select Your Project**
   - Click on your AINFORMED project

3. **Go to Variables Tab**
   - Click **"Variables"** in the left sidebar (or top menu)

4. **Add CRON_SECRET**
   - Click **"+ New Variable"** button
   - **Variable Name**: `CRON_SECRET`
   - **Value**: Paste your generated secret (from Step 1)
   - Click **"Add"** or **"Save"**

   ![Example] Railway Variables Tab
   ```
   Variables:
   ├── MONGODB_URI = mongodb+srv://...
   ├── JWT_SECRET = ...
   ├── GNEWS_API_KEY = ...
   ├── TAVILY_API_KEY = ...
   └── CRON_SECRET = aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE1fG3hI5jK7lM9nO1pQ3  ← ADD THIS
   ```

5. **Redeploy Your App**
   - After adding the variable, Railway should auto-redeploy
   - Or manually trigger redeploy from "Deployments" tab

---

## How It's Used

Once you've set `CRON_SECRET` in Railway:

### 1. Your Code Reads It
```typescript
// In src/app/api/cron/tavily/route.ts
const CRON_SECRET = process.env.CRON_SECRET; // Reads from Railway env vars
```

### 2. Cron Service Must Include It
When you set up the cron job (Railway or external service), you include the secret in the URL:

```
https://your-app.railway.app/api/cron/tavily?secret=aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW3xY5zA7bC9dE1fG3hI5jK7lM9nO1pQ3
```

### 3. Your Server Validates It
```typescript
if (secret !== CRON_SECRET) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
// Only proceeds if secret matches
```

---

## Setting Up the Cron Job (Railway)

After you've added `CRON_SECRET` to Railway:

### Option 1: Railway Cron Jobs (If Available)

1. In Railway dashboard → Your project → **"Cron Jobs"** tab
2. Click **"New Cron Job"**
3. Configure:
   - **Schedule**: `0 * * * *` (every hour at minute 0)
   - **Command/URL**: 
     ```
     https://your-app.railway.app/api/cron/tavily?secret=YOUR_ACTUAL_SECRET_HERE
     ```
   - Replace `YOUR_ACTUAL_SECRET_HERE` with the secret you added in Variables

### Option 2: External Cron Service (Recommended if Railway doesn't have cron)

Use a free service like **cron-job.org**:

1. Sign up at: https://cron-job.org (free)
2. Click **"Create cronjob"**
3. Fill in:
   - **Title**: "Tavily News Fetch"
   - **Address (URL)**: 
     ```
     https://your-app.railway.app/api/cron/tavily?secret=YOUR_ACTUAL_SECRET_HERE
     ```
   - **Schedule**: Every 1 hour
   - **Request method**: GET or POST (both work)
4. Click **"Create"**

**Important**: Use the **same secret** you added to Railway's `CRON_SECRET` variable!

---

## Testing Your Setup

### Step 1: Verify CRON_SECRET is Set
Check Railway logs after redeploy - you shouldn't see errors about missing `CRON_SECRET`.

### Step 2: Test the Endpoint Manually

Replace `YOUR_SECRET` with your actual secret:

```bash
# In browser or curl:
https://your-app.railway.app/api/cron/tavily?secret=YOUR_SECRET
```

**Expected Success Response:**
```json
{
  "success": true,
  "group": "Core AI",
  "timestamp": "2025-01-XX...",
  "message": "Tavily cache updated for group: Core AI"
}
```

**Expected Error (Wrong Secret):**
```json
{
  "error": "Unauthorized"
}
```

If you get "Unauthorized", check:
- ✅ Secret in Railway Variables matches the one in your test URL
- ✅ App has been redeployed after adding the variable
- ✅ No typos in the secret

---

## Common Mistakes

### ❌ Using Same Secret as JWT_SECRET
**Don't reuse secrets!** Each secret should be unique.

### ❌ Short/Simple Secrets
**Don't use**: `password123` or `secret`
**Do use**: Long random strings (30+ characters)

### ❌ Forgetting to Redeploy
After adding `CRON_SECRET` to Railway, the app needs to redeploy to pick it up.

### ❌ Secret Mismatch
The secret in Railway Variables **must match** the secret in your cron job URL exactly (no spaces, same capitalization).

---

## Summary

1. **What is cron?** → Automated scheduled tasks (like an alarm clock for servers)
2. **Why CRON_SECRET?** → Security (prevents unauthorized access)
3. **Where to add?** → Railway dashboard → Your project → Variables tab → Add `CRON_SECRET`
4. **What value?** → Long random string (30+ characters)
5. **How to use?** → Include it in your cron job URL: `?secret=YOUR_SECRET`

---

**Next Step**: After adding `CRON_SECRET` to Railway, set up the cron job to call your endpoint every hour!

