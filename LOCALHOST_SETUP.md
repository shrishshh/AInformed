# 🏠 Running Tavily on Localhost (Simple Guide)

## Quick Setup for Local Development

### Step 1: Add Tavily API Key

Create or edit `.env.local` in your project root:

```bash
TAVILY_API_KEY=your-tavily-api-key-here
```

**Get your API key:**
1. Sign up at [tavily.com](https://tavily.com)
2. Choose "Researcher" plan (1,000 credits/month - free tier)
3. Copy your API key from the dashboard
4. Paste it in `.env.local`

### Step 2: Start Your Dev Server

```bash
npm run dev
```

### Step 3: Use Your App!

Just visit: `http://localhost:3000`

**That's it!** Tavily will work automatically:
- ✅ First visit: Automatically triggers Tavily fetch (might take 2-3 seconds)
- ✅ **Tip**: Refresh the page after first load to see Tavily articles (they're being fetched in background)
- ✅ Next visits: Uses cached articles (instant!)
- ✅ After 1 hour: Cache expires, auto-refreshes on next request

---

## How It Works on Localhost

### Automatic Mode (Default)

When you visit your homepage:
1. Browser calls `/api/ai-news`
2. API checks Tavily cache (starts empty)
3. **First visit**: Cache is empty → Automatically fetches from Tavily API in background
4. Stores articles in cache (1 hour)
5. **Second visit**: Uses cached articles (fast!)
6. **After 1 hour**: Cache expires → Auto-refreshes on next request
7. Returns merged articles: [GNews, RSS, GDELT, HN, **Tavily**]

**Note**: On the very first request, Tavily articles might not appear immediately (fetch is in progress). Refresh the page after a few seconds to see them!

### Manual Refresh (Optional)

Want to force refresh Tavily articles? Just visit:

```
http://localhost:3000/api/cron/tavily
```

This triggers a fresh fetch immediately. No authentication needed in development mode!

---

## No Cron Needed! 

**For localhost, you don't need:**
- ❌ Cron jobs
- ❌ CRON_SECRET environment variable
- ❌ Scheduled tasks
- ❌ External services

**Tavily works on-demand:**
- ✅ Automatically fetches when cache is empty (first visit)
- ✅ Automatically refreshes when cache expires (after 1 hour)
- ✅ No cron job needed - works automatically with your existing code
- ✅ Lazy-loading in development mode - fetches in background

---

## Testing Tavily Integration

### Check if Tavily is Working

1. **Visit homepage**: `http://localhost:3000`
2. **Open browser console** (F12)
3. **Look for logs**: You should see Tavily-related messages
4. **Check API response**: Visit `http://localhost:3000/api/ai-news`
5. **Look for `_sources.tavily`**: Should show article count > 0

### Example API Response

```json
{
  "articles": [...],
  "_sources": {
    "gnews": 20,
    "rss": 15,
    "gdelt": 10,
    "hn": 5,
    "tavily": 8,  ← This shows Tavily articles!
    "total": 58
  }
}
```

---

## Troubleshooting

### Tavily Articles Not Appearing?

1. **Check API key**: Is `TAVILY_API_KEY` in `.env.local`?
2. **Restart server**: Did you restart after adding the key?
   ```bash
   # Stop server (Ctrl+C), then:
   npm run dev
   ```
3. **Check console logs**: Look for Tavily-related errors
4. **Manual trigger**: Try `http://localhost:3000/api/cron/tavily`
5. **Check credits**: Visit Tavily dashboard - do you have credits?

### Common Issues

**"TAVILY_API_KEY not configured"**
- ✅ Make sure `.env.local` exists in project root
- ✅ Make sure key is exactly: `TAVILY_API_KEY=your-key-here`
- ✅ Restart your dev server after adding

**"No articles fetched"**
- ✅ Check Tavily dashboard for credit balance
- ✅ Try manual trigger: `http://localhost:3000/api/cron/tavily`
- ✅ Check browser console for error messages

**"Articles appear but then disappear"**
- ✅ This is normal! Cache expires after 1 hour
- ✅ Refresh the page or wait 1 hour
- ✅ Or manually trigger: `http://localhost:3000/api/cron/tavily`

---

## What Happens When You Deploy?

When you eventually deploy to production (Railway, Vercel, etc.):

1. **Add `TAVILY_API_KEY`** to production environment variables
2. **Add `CRON_SECRET`** (only needed for cron job security)
3. **Set up cron job** (optional - for automatic hourly updates)
4. **That's it!** Same code works everywhere

But for now, just use localhost - it works perfectly without any cron setup! 🚀

---

## Summary

**Localhost Setup:**
1. Add `TAVILY_API_KEY` to `.env.local`
2. Run `npm run dev`
3. Visit `http://localhost:3000`
4. **Done!** Tavily works automatically

**No need for:**
- Cron jobs
- CRON_SECRET
- Scheduled tasks
- External services

Tavily fetches articles on-demand when cache is empty or expired. Simple! ✨

