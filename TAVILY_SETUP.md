# 🚀 Tavily Integration Setup Guide

## Overview

Tavily has been integrated into AINFORMED as the 5th news source (alongside GNews, RSS, GDELT, and Hacker News). It provides intelligent web search specifically for AI/tech news across all 13 categories.

## Architecture

- **Tavily Fetcher**: `src/lib/tavilyFetcher.ts` - Handles API calls with group-based rotation
- **Cache Management**: `src/lib/rssCron.ts` - Manages Tavily cache (1-hour TTL)
- **Cron Endpoint**: `/api/cron/tavily` - Hourly scheduled job
- **Integration**: `/api/ai-news` - Merges Tavily articles with other sources

## Category Coverage

Tavily rotates through **7 query groups** every hour, covering all **13 categories**:

| Group | Categories | Rotation Schedule |
|-------|-----------|-------------------|
| Core AI | AI, AI Ethics | Hours: 0, 6, 12, 18 |
| ML Foundation | ML, Data Science, Big Data | Hours: 1, 7, 13, 19 |
| Deep Learning Stack | Deep Learning, Neural Networks | Hours: 2, 8, 14, 20 |
| NLP & LLMs | Natural Language Processing | Hours: 3, 9, 15, 21 |
| Vision & Perception | Computer Vision | Hours: 4, 10, 16, 22 |
| Automation & Robotics | Robotics, Automation | Hours: 5, 11, 17, 23 |
| Advanced Topics | Quantum Computing, Cybersecurity | Hours: 6, 12, 18, 24 |

**Result**: Each category gets fresh news every **6-12 hours**.

## Environment Variables

### For Localhost Development

Add to your `.env.local` file (in the project root):

```bash
# Tavily API Key (Required)
TAVILY_API_KEY=your-tavily-api-key-here

# Cron Secret (Optional - only needed if you want to test cron endpoint locally)
# CRON_SECRET=your-secure-random-string-here
```

### For Production (Railway/Other Platforms)

```bash
# Tavily API Key (Required)
TAVILY_API_KEY=your-tavily-api-key-here

# Cron Secret (Required for cron endpoint security)
CRON_SECRET=your-secure-random-string-here
```

### Getting Your Tavily API Key

1. Sign up at [tavily.com](https://tavily.com)
2. Choose "Researcher" plan (1,000 credits/month)
3. Copy your API key from the dashboard
4. Add billing address (required for pay-as-you-go backup)

## Using Tavily on Localhost (No Cron Needed!)

### ✅ For Local Development

**You don't need cron for localhost!** Tavily will work automatically:

1. **First Time**: When you visit `/api/ai-news`, Tavily cache is empty, so it will fetch fresh articles on-demand (lazy loading)
2. **Subsequent Requests**: Uses cached articles (1-hour cache)
3. **Manual Refresh**: You can manually trigger a fetch anytime

### Manual Fetch (Optional)

If you want to manually update Tavily cache while developing:

**Method 1: Via Browser/API**
```
http://localhost:3000/api/cron/tavily
```
(No secret needed locally - the default fallback allows it)

**Method 2: Via Terminal**
```bash
curl http://localhost:3000/api/cron/tavily
```

**Method 3: Just Use the App** (Recommended)
- Visit your homepage: `http://localhost:3000`
- Tavily articles will be fetched automatically on first load
- Cache lasts 1 hour, then auto-refreshes
- No manual intervention needed!

---

## Setting Up Cron (Only for Production)

**Skip this section if you're only running locally!**

### Option 1: Railway Cron

1. Go to Railway dashboard → Your project → **Cron Jobs**
2. Create a new cron job with:
   - **Schedule**: `0 * * * *` (every hour at minute 0)
   - **Command**: `curl -X POST "https://your-app-url.railway.app/api/cron/tavily?secret=YOUR_CRON_SECRET"`
   - **Or use Railway's HTTP cron**: Set up as HTTP webhook with same URL

### Option 2: External Cron Service (e.g., cron-job.org)

1. Create account at [cron-job.org](https://cron-job.org)
2. Create new cron job:
   - **URL**: `https://your-app-url.railway.app/api/cron/tavily?secret=YOUR_CRON_SECRET`
   - **Schedule**: Every hour
   - **Method**: GET or POST

### Option 3: Manual Testing (Production)

Test the cron endpoint manually:

```bash
curl "https://your-app-url.railway.app/api/cron/tavily?secret=YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "group": "Core AI",
  "timestamp": "2025-01-XX...",
  "message": "Tavily cache updated for group: Core AI"
}
```

## Credit Budget

- **Monthly Credits**: 1,000 (Researcher plan)
- **Queries/Hour**: 1 (24 queries/day)
- **Credits/Query**: ~10 (advanced search)
- **Monthly Usage**: ~720 credits (within budget ✅)

### Credit Monitoring

Tavily will automatically:
- Skip duplicate fetches (idempotency check)
- Handle credit exhaustion gracefully (returns empty, doesn't break app)
- Log warnings when credits are low

## How It Works

### Hourly Flow

1. **Cron triggers** → `/api/cron/tavily`
2. **Determines group** → Based on current hour (0-23)
3. **Fetches from Tavily** → Advanced search with group query
4. **Tags articles** → Primary + secondary categories
5. **Stores in cache** → Memory (1 hour) + Database
6. **Ready for API** → `/api/ai-news` reads from cache

### Article Flow

```
Tavily API
   ↓
Category Tagging (primary + secondary)
   ↓
Tavily Cache (1 hour TTL)
   ↓
/api/ai-news merges with [GNews, RSS, GDELT, HN]
   ↓
Deduplication (by URL)
   ↓
Scoring & Sorting
   ↓
Frontend displays
```

## Category Tagging

Each Tavily article is automatically tagged:

```typescript
{
  title: "Article Title",
  url: "https://...",
  category: "Machine Learning",        // Primary category
  secondaryCategories: ["Data Science"], // Additional categories
  // ... other fields
}
```

This enables:
- ✅ Category pages filter Tavily articles correctly
- ✅ Existing client-side filtering works (keyword matching)
- ✅ Unified deduplication across all sources

## Troubleshooting

### Tavily Articles Not Appearing

1. **Check cron job**: Is it running hourly? Check Railway logs
2. **Check API key**: Is `TAVILY_API_KEY` set correctly?
3. **Check credits**: Visit Tavily dashboard to verify credit usage
4. **Check logs**: Look for Tavily-related logs in Railway console

### Cron Job Not Running

1. **Verify CRON_SECRET**: Must match in Railway env vars and cron URL
2. **Check endpoint**: Test manually with curl (see above)
3. **Check Railway logs**: Look for errors in cron job execution

### Too Many/Few Articles

- **Adjust maxResults**: Edit `TAVILY_CONFIG.maxResults` in `tavilyFetcher.ts` (default: 10)
- **Adjust groups**: Modify `TAVILY_GROUP_QUERIES` to change category coverage
- **Adjust rotation**: Change `getGroupForHour()` logic for different schedule

## Monitoring

### Key Metrics to Watch

1. **Article Count**: Check `/api/ai-news` response `_sources.tavily`
2. **Cache Age**: Tavily cache expires after 1 hour
3. **Credit Usage**: Monitor in Tavily dashboard
4. **Error Rate**: Check Railway logs for Tavily fetch failures

### Log Messages

Look for these in Railway logs:
- `✅ Tavily: Fetched X articles for group: Y` - Success
- `⚠️ Tavily credits exhausted` - Credit issue
- `❌ Failed to update Tavily cache` - Error
- `Tavily: Skipping X - already fetched` - Idempotency working

## Fallback Behavior

If Tavily fails:
- ✅ App continues working with [GNews, RSS, GDELT, HN]
- ✅ Previous cache is kept (doesn't clear on failure)
- ✅ Errors are logged but don't break UX
- ✅ Category pages still work (other sources provide content)

## Next Steps

### For Localhost Development (Simple!)

1. ✅ Add `TAVILY_API_KEY` to your `.env.local` file:
   ```bash
   TAVILY_API_KEY=your-tavily-api-key-here
   ```
2. ✅ Start your dev server: `npm run dev`
3. ✅ Visit `http://localhost:3000` - Tavily will work automatically!
   - First load: Fetches fresh Tavily articles
   - Subsequent loads: Uses cached articles (1 hour)
4. ✅ (Optional) Manually refresh: Visit `http://localhost:3000/api/cron/tavily`
5. ✅ Check articles appear: Visit homepage and see Tavily articles merged with other sources

**That's it!** No cron setup needed for localhost. 🎉

### For Production Deployment

1. ✅ Add `TAVILY_API_KEY` to production env vars (Railway/other)
2. ✅ Add `CRON_SECRET` to production env vars
3. ✅ Set up hourly cron job (Railway or external)
4. ✅ Test manually: `curl /api/cron/tavily?secret=...`
5. ✅ Monitor first few runs in production logs
6. ✅ Verify articles appear in `/api/ai-news` response

## Support

If you encounter issues:
1. Check Railway logs for detailed error messages
2. Verify all environment variables are set
3. Test cron endpoint manually first
4. Check Tavily dashboard for credit/API issues

---

**Status**: ✅ Implementation Complete - Ready for Production

