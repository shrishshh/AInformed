# 📺 How to View Console Logs for News Articles

## Quick Guide: See Which Articles Come From Each Source

### Step 1: Open Your Terminal/Console

Your Next.js dev server console is where all the logs appear. This is the terminal window where you ran `npm run dev`.

### Step 2: Make a Request to the API

Visit in your browser:
```
http://localhost:3000/api/ai-news
```

Or visit your homepage:
```
http://localhost:3000
```

### Step 3: Watch the Console Output

You'll see detailed logs like this:

```
📊 ========== NEWS SOURCES SUMMARY ==========
Total unique articles: 68
  📰 GNews: 20 articles
  📡 RSS: 15 articles
  🌍 GDELT: 10 articles
  💬 HN: 5 articles
  🔍 Tavily: 8 articles
  🤖 Perplexity: 10 articles
==========================================

📰 GNews Sample Articles (first 3):
  1. Latest AI breakthrough in machine learning... | Source: TechCrunch
  2. OpenAI announces new model... | Source: The Verge
  3. AI ethics discussion heats up... | Source: Wired

🤖 Perplexity Sample Articles (first 3):
  1. Revolutionary AI model released... | Source: example.com | Category: Artificial Intelligence
  2. Machine learning advances... | Source: technews.com | Category: Machine Learning
  3. Deep learning breakthrough... | Source: aiweekly.com | Category: Deep Learning

🤖 ========== ALL PERPLEXITY ARTICLES ==========
  1. "Revolutionary AI model released"
     URL: https://example.com/article1
     Source: example.com
     Category: Artificial Intelligence
     Published: 2025-01-20T10:00:00.000Z
     Description: A new AI model has been released that...

  2. "Machine learning advances"
     URL: https://technews.com/article2
     Source: technews.com
     Category: Machine Learning
     Published: 2025-01-20T09:00:00.000Z
     Description: Recent advances in machine learning...

==========================================
```

## What Each Log Section Means

### 📊 News Sources Summary
Shows the count of articles from each source before merging and deduplication.

### Sample Articles
Shows the first 3 articles from each source with:
- Title (truncated to 60 chars)
- Source name
- Category (for Tavily/Perplexity)

### 🤖 All Perplexity Articles
**This is the most detailed section!** It shows:
- Full title
- URL
- Source domain
- Category
- Published date
- Description preview

### 🤖 Perplexity Articles in Final Feed
Shows which Perplexity articles made it through all filters and are in the final merged feed.

## Filtering Stages

The logs show articles at different stages:

1. **Before Filtering**: All articles from all sources
2. **After Consumer Content Filter**: Removed shopping/deal articles
3. **After Deduplication**: Removed duplicate URLs
4. **After Scoring**: Articles that passed relevance scoring
5. **After Query Filtering**: Articles matching the search query
6. **Final Feed**: Articles that will be returned to the user

## Tips for Debugging

### If Perplexity shows 0 articles:

1. **Check the console for errors:**
   - Look for `❌ Error fetching Perplexity articles`
   - Look for `⚠️ PERPLEXITY_API_KEY not configured`
   - Look for `401 Unauthorized` or `403 Forbidden`

2. **Check if cache is being populated:**
   - Look for `🔄 Updating Perplexity cache...`
   - Look for `✅ Perplexity cache updated: X articles`

3. **Force a cache update:**
   - Visit: `http://localhost:3000/api/cron/perplexity`
   - Watch the console for the update process

### To See More Details:

Add `?refresh=true` to force a fresh fetch:
```
http://localhost:3000/api/ai-news?refresh=true
```

This bypasses cache and shows all the fetching logs.

## Console Log Colors

Different log types use different prefixes:
- ✅ Success messages
- ❌ Error messages
- ⚠️ Warnings
- 🔍 Fetching/searching
- 📊 Statistics/summaries
- 🤖 Perplexity-specific logs
- 🔍 Tavily-specific logs
- 📰 GNews-specific logs

## Filter Console Output

If you want to see only Perplexity logs, you can filter in your terminal:

**Windows PowerShell:**
```powershell
npm run dev | Select-String "Perplexity"
```

**Mac/Linux:**
```bash
npm run dev | grep "Perplexity"
```

## Example: What You Should See

When Perplexity is working correctly, you should see:

```
🔍 Fetching Perplexity articles for group: Core AI (categories: Artificial Intelligence, AI Ethics)
✅ Perplexity: Fetched 12 articles for Core AI

🤖 ========== ALL PERPLEXITY ARTICLES ==========
  1. "Latest AI developments in 2025"
     URL: https://example.com/ai-news
     Source: example.com
     Category: Artificial Intelligence
     ...
```

If you see this, Perplexity is working! 🎉

