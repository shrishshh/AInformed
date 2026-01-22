# AInformed - News Sources & Caching Documentation

This document provides a comprehensive overview of all news sources integrated into AInformed and the caching architecture that powers the platform.

---

## 📰 News Sources

### Tier 1: Official AI Company Blogs (Highest Priority)

These sources publish direct product updates, model releases, and official announcements.

#### RSS Feeds

| Company | Products | Website | RSS Feed | Source Type |
|---------|----------|---------|----------|-------------|
| **OpenAI** | ChatGPT, GPT-4, GPT-4.1, OpenAI API | https://openai.com/news | https://openai.com/news/rss.xml | OFFICIAL_BLOG |
| **Google AI** | Gemini, Imagen, Veo | https://blog.google/technology/ai/ | https://blog.google/technology/ai/rss/ | OFFICIAL_BLOG |
| **DeepMind** | Gemini, AlphaFold | https://deepmind.google/discover/blog/ | https://deepmind.google/blog/rss.xml | OFFICIAL_BLOG |
| **Microsoft** | Copilot, Azure AI | https://www.microsoft.com/ai/blog | https://blogs.microsoft.com/ai/feed/ | OFFICIAL_BLOG |
| **NVIDIA** | GPUs, CUDA, AI Stack | https://blogs.nvidia.com/blog/category/artificial-intelligence/ | https://blogs.nvidia.com/feed/ | OFFICIAL_BLOG |
| **Hugging Face** | Models, Spaces, Datasets | https://huggingface.co/blog | https://huggingface.co/blog/feed.xml | OFFICIAL_BLOG |

#### Listing Page Scrapers (No RSS Available)

These sources are fetched via polite web scraping of their official news listing pages.

| Company | Products | Website | Listing Page | Source Type |
|---------|----------|---------|--------------|-------------|
| **Anthropic** | Claude | https://www.anthropic.com/news | https://www.anthropic.com/news | OFFICIAL_BLOG |
| **xAI** | Grok | https://x.ai/blog | https://x.ai/blog | OFFICIAL_BLOG |
| **Mistral** | Mistral models | https://mistral.ai/news | https://mistral.ai/news | OFFICIAL_BLOG |
| **Cohere** | Cohere models, Command | https://cohere.com/blog | https://cohere.com/blog | OFFICIAL_BLOG |
| **Stability AI** | Stable Diffusion | https://stability.ai/blog | https://stability.ai/blog | OFFICIAL_BLOG |

#### Meta Sources

| Company | Products | Website | RSS Feed | Source Type |
|---------|----------|---------|----------|-------------|
| **Meta AI** | LLaMA, Meta AI | https://ai.meta.com/ | https://engineering.fb.com/feed/ | TECH_NEWS |
| **Meta Newsroom** | Meta, Meta AI, LLaMA | https://about.fb.com/news/ | https://about.fb.com/news/feed/ | TECH_NEWS |

---

### Tier 2: Research Labs

| Company | Products | Website | RSS Feed | Source Type |
|---------|----------|---------|----------|-------------|
| **Microsoft Research** | AI Research | https://www.microsoft.com/en-us/research/ | https://www.microsoft.com/en-us/research/feed/ | RESEARCH_LAB |
| **The Gradient** | AI Research | https://thegradient.pub/ | https://thegradient.pub/rss/ | TECH_NEWS |

---

### Tier 3: Tech Journalism & News Aggregators

| Company | Products | Website | RSS Feed | Source Type |
|---------|----------|---------|----------|-------------|
| **MIT Technology Review** | Tech News | https://www.technologyreview.com/ | https://www.technologyreview.com/feed/ | TECH_NEWS |
| **Wired** | Tech News | https://www.wired.com/ | https://www.wired.com/feed/rss | TECH_NEWS |
| **Ars Technica** | Tech News | https://arstechnica.com/ | http://feeds.arstechnica.com/arstechnica/index/ | TECH_NEWS |
| **TechCrunch AI** | AI News | https://techcrunch.com/tag/ai/ | https://techcrunch.com/tag/ai/feed/ | TECH_NEWS |
| **VentureBeat AI** | AI News | https://venturebeat.com/category/ai/ | https://venturebeat.com/category/ai/feed/ | TECH_NEWS |
| **The Verge** | Tech News | https://www.theverge.com/ | https://www.theverge.com/rss/index.xml | TECH_NEWS |
| **Engadget** | Tech News | https://www.engadget.com/ | https://www.engadget.com/rss.xml | TECH_NEWS |
| **Gizmodo** | Tech News | https://gizmodo.com/ | https://gizmodo.com/rss | TECH_NEWS |
| **TechRadar** | Tech News | https://www.techradar.com/ | https://www.techradar.com/rss | TECH_NEWS |
| **ZDNet** | Tech News | https://www.zdnet.com/ | https://www.zdnet.com/news/rss.xml | TECH_NEWS |
| **KDnuggets** | Data Science, ML | https://www.kdnuggets.com/ | https://www.kdnuggets.com/feed | TECH_NEWS |

---

### Tier 4: Discovery Platforms

These platforms aggregate news from multiple sources and are used for discovery, not as primary ranked sources.

| Platform | Type | API Endpoint | Usage |
|----------|------|--------------|-------|
| **GDELT** | Global News Database | https://api.gdeltproject.org/api/v2/doc/doc | Discovery only (not ranked in main feed) |
| **HackerNews** | Tech News Aggregator | https://hn.algolia.com/api/v1/search | Discovery only (not ranked in main feed) |
| **Tavily** | News Search API | Tavily API (requires API key) | Used for user search queries only |
| **Perplexity** | AI Search Engine | Perplexity API (requires API key) | Discovery engine (disabled in main feed) |

---

## 🗄️ Caching Architecture

AInformed uses a multi-layer caching strategy to optimize performance and reduce API costs.

### Cache Layers

#### 1. In-Memory Cache (Fastest)
- **Location**: Node.js process memory
- **TTL**: 15 minutes (RSS/GDELT/HN), 1 hour (Tavily/Perplexity)
- **Purpose**: Ultra-fast access for frequently requested data
- **Implementation**: `src/lib/cacheService.ts` (`memoryCache`)

**Cache Keys Format**:
```
news:category:{category}|limit:{limit}|page:{page}|platform:{platform}|product:{product}|query:{query}|section:{section}|source:{source}|version:{version}
```

**Example**:
```
news:category:null|limit:500|page:1|platform:undefined|product:undefined|query:|section:all|source:undefined|version:v3
```

#### 2. MongoDB Cache (Persistent)
- **Location**: MongoDB `newscaches` collection
- **TTL**: 1 hour (auto-expires via MongoDB TTL index)
- **Purpose**: Survives server restarts, shared across instances
- **Schema**: `src/models/NewsCache.ts`

**MongoDB Schema**:
```typescript
{
  cacheKey: string,           // Unique cache key
  data: object,               // Full API response
  sources: {
    gnews: number,
    rss: number,
    gdelt: number,
    hn: number,
    tavily: number,
    perplexity: number,
    total: number
  },
  isMockData: boolean,
  timestamp: Date,
  expiresAt: Date,            // Auto-delete after 1 hour
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. Source-Specific In-Memory Caches
- **RSS Cache**: `rssCache[]` - Stores formatted RSS articles
- **GDELT Cache**: `gdeltCache[]` - Stores GDELT articles
- **HN Cache**: `hnCache[]` - Stores HackerNews stories
- **Tavily Cache**: `tavilyCache[]` - Stores Tavily articles (also persisted to MongoDB)
- **Perplexity Cache**: `perplexityCache[]` - Stores Perplexity articles (also persisted to MongoDB)

**Location**: `src/lib/rssCron.ts`

---

### Cache Update Strategy

#### RSS / GDELT / HackerNews
- **Update Frequency**: Every 15 minutes (or on-demand via `?refresh=true`)
- **Update Function**: `updateAllCaches()` in `src/lib/rssCron.ts`
- **Concurrency Control**: Uses `isUpdating` flag and shared `updateAllPromise` to prevent concurrent updates
- **Behavior**: 
  - Fetches all sources in parallel using `Promise.allSettled()`
  - Falls back to alternative methods if primary fetch fails
  - Updates in-memory caches immediately

#### Tavily
- **Update Frequency**: Hourly (rotates through query groups)
- **Update Function**: `updateTavilyCache(groupName?)` in `src/lib/rssCron.ts`
- **Concurrency Control**: Uses `isUpdatingTavily` flag
- **Idempotency**: Skips if same group was fetched within last 55 minutes
- **Persistence**: Articles are stored in MongoDB `tavilyarticles` collection
- **Cache Invalidation**: Invalidates all `news:*` caches after Tavily update

**Query Groups** (rotated hourly):
- `ai_models` - AI model releases
- `ai_research` - Research papers
- `ai_products` - Product updates
- `ai_companies` - Company news

#### Perplexity
- **Update Frequency**: Hourly (rotates through query groups)
- **Update Function**: `updatePerplexityCache(groupName?)` in `src/lib/rssCron.ts`
- **Concurrency Control**: Uses `isUpdatingPerplexity` flag
- **Idempotency**: Skips if same group was fetched within last 55 minutes
- **Persistence**: Articles are stored in MongoDB `perplexityarticles` collection
- **Cache Invalidation**: Invalidates all `news:*` caches after Perplexity update
- **Deduplication**: Merges new articles with existing cache, deduplicates by URL/title
- **Max Articles**: Capped at 200 most recent articles

**Query Groups** (rotated hourly):
- `ai_models` - AI model releases
- `ai_research` - Research papers
- `ai_products` - Product updates
- `ai_companies` - Company news

---

### Cache Flow

```
1. API Request → Check In-Memory Cache
   ├─ Hit → Return cached data
   └─ Miss → Check MongoDB Cache
       ├─ Hit → Return cached data + populate in-memory cache
       └─ Miss → Fetch from sources → Store in both caches → Return data
```

**Example Flow** (`/api/ai-news?limit=500`):

1. **Check Memory Cache**: Look for key `news:category:null|limit:500|...`
2. **If Miss**: Check MongoDB `newscaches` collection
3. **If Still Miss**: 
   - Call `getCachedRSSArticles()` → triggers `updateAllCaches()` if cache expired
   - Call `getCachedGDELTArticles()` → returns cached or triggers update
   - Call `getCachedHNArticles()` → returns cached or triggers update
   - Merge all articles
   - Apply filters, ranking, classification
   - Store result in MongoDB cache (1 hour TTL)
   - Store result in memory cache (15 min TTL)
   - Return response

---

### Cache Invalidation

#### Automatic Expiration
- **MongoDB**: Uses TTL index on `expiresAt` field (auto-deletes after 1 hour)
- **Memory Cache**: Checked on access, refreshed if older than TTL

#### Manual Invalidation
- **Force Refresh**: Add `?refresh=true` to API request
  - Bypasses all caches
  - Triggers fresh fetch from all sources
  - Updates all cache layers

#### Post-Update Invalidation
- **Tavily/Perplexity Updates**: After successful fetch, invalidates all `news:*` caches
  - Deletes from MongoDB: `NewsCache.deleteMany({ cacheKey: { $regex: /^news:/ } })`
  - Clears from memory: Removes all keys starting with `news:`

---

### Cache Restoration on Startup

On server startup, the system restores Tavily and Perplexity caches from MongoDB:

```typescript
// Restore Tavily cache (latest 200 articles)
const tavilyDocs = await TavilyArticle.find({})
  .sort({ publishedAt: -1 })
  .limit(200)
  .lean()
  .exec();

// Restore Perplexity cache (latest 200 articles)
const perplexityDocs = await PerplexityArticle.find({})
  .sort({ publishedAt: -1 })
  .limit(200)
  .lean()
  .exec();
```

This ensures that Tavily/Perplexity articles survive server restarts and are immediately available.

---

### Cache Configuration

**TTL Durations** (`src/lib/rssCron.ts`):
```typescript
const CACHE_DURATION = 15 * 60 * 1000;           // 15 minutes (RSS/GDELT/HN)
const TAVILY_CACHE_DURATION = 60 * 60 * 1000;    // 1 hour (Tavily)
const PERPLEXITY_CACHE_DURATION = 60 * 60 * 1000; // 1 hour (Perplexity)
```

**MongoDB Cache TTL** (`src/models/NewsCache.ts`):
```typescript
expiresAt: {
  type: Date,
  default: () => new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  index: { expireAfterSeconds: 0 }
}
```

---

### Cache Statistics

You can check cache statistics using MongoDB:

```javascript
// Get cache stats
db.newscaches.aggregate([
  {
    $group: {
      _id: null,
      totalCaches: { $sum: 1 },
      validCaches: {
        $sum: {
          $cond: [{ $gt: ['$expiresAt', new Date()] }, 1, 0]
        }
      },
      expiredCaches: {
        $sum: {
          $cond: [{ $lte: ['$expiresAt', new Date()] }, 1, 0]
        }
      }
    }
  }
]);
```

---

## 🔄 Cache Update Triggers

### Automatic Updates
- **On Module Load**: `updateAllCaches()` is called automatically when `rssCron.ts` is imported
- **On Cache Expiry**: When accessing expired cache, triggers background refresh
- **Cron Jobs**: (If configured) Scheduled updates for Tavily/Perplexity

### Manual Updates
- **API Parameter**: `?refresh=true` forces immediate cache refresh
- **Development Mode**: Lazy-loads Tavily/Perplexity if cache is empty

---

## 📊 Source Priority System

Sources are ranked by **source type**, not individual company priority:

| Source Type | Priority Weight | Examples |
|------------|----------------|----------|
| `OFFICIAL_BLOG` | 100 | OpenAI, Google AI, Anthropic, xAI |
| `RESEARCH_LAB` | 80 | DeepMind, Microsoft Research |
| `TECH_NEWS` | 50 | TechCrunch, Wired, MIT Tech Review |
| `AGGREGATOR` | 20 | Perplexity (discovery only) |

This ensures that official company blogs always rank higher than tech journalism, regardless of which specific company published the article.

---

## 🛠️ Troubleshooting Cache Issues

### Cache Not Updating
1. Check if `?refresh=true` is being used
2. Verify MongoDB connection is active
3. Check server logs for cache update errors
4. Ensure `updateAllCaches()` is not blocked by concurrent update lock

### Empty Cache on Startup
- Tavily/Perplexity caches are restored from MongoDB on startup
- RSS/GDELT/HN caches start empty and populate on first request
- Use `?refresh=true` to force immediate population

### Stale Data
- Check `expiresAt` timestamp in MongoDB
- Verify TTL index is working: `db.newscaches.getIndexes()`
- Manually invalidate: `db.newscaches.deleteMany({ cacheKey: /^news:/ })`

---

## 📝 Notes

- **Listing Page Scrapers**: Anthropic, xAI, Mistral, Cohere, and Stability AI are fetched via polite web scraping (no RSS available). These scrapers:
  - Extract article links from listing pages
  - Fetch metadata (title, description, date) from individual article pages
  - Respect rate limits and avoid aggressive crawling
  - Filter out non-HTTP(S) links to prevent errors

- **Perplexity**: Currently disabled in main feed (`fetchMethod: "NONE"`). Used only for discovery/search queries.

- **Cache Versioning**: Cache keys include a version (`v3`) to invalidate old cache structures when schema changes.

---

**Last Updated**: January 2026
**Maintained By**: AInformed Development Team
