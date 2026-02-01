# News Display Logic - Complete Flow

This document explains how news articles are fetched, processed, filtered, and displayed on the AInformed website.

---

## 📊 Overview

The news display system uses a **client-side filtering and pagination** approach:
1. **Backend**: Fetches and processes all articles once
2. **Frontend**: Filters, paginates, and displays articles in the browser
3. **No API calls on filter changes** - all filtering happens in memory

---

## 🔄 Complete Flow

### Step 1: Initial Page Load (Server-Side)

**File**: `src/app/page.tsx`

```typescript
// 1. Server component fetches articles ONCE
const data = await getNews(`/api/ai-news?refresh=true&limit=500`);
const articles = data.articles || [];

// 2. Passes ALL articles to client component
<ClientFilteredNews articles={articles} />
```

**Key Points**:
- Fetches up to 500 articles on initial load
- Uses `refresh=true` to ensure fresh data
- All articles are passed to the client component
- No refetching when filters change

---

### Step 2: API Processing (Backend)

**File**: `src/app/api/ai-news/route.ts`

#### 2.1 Data Aggregation

Articles are fetched from multiple sources in parallel:

```typescript
let allArticles = [
  ...gnewsArticles,              // GNews API (currently disabled)
  ...rssArticlesFormatted,       // Official RSS feeds (866 articles)
  ...gdeltArticlesFormatted,     // GDELT API (50 articles)
  ...hnArticlesFormatted,        // HackerNews API (14 articles)
  ...instagramArticlesFormatted, // Instagram n8n webhook (24 articles)
];
```

**Total before filtering**: ~954 articles

#### 2.2 Consumer Content Filtering

**First Pass** (before deduplication):
```typescript
allArticles = allArticles.filter(article => !isConsumerContent(article));
```

**Filters out**:
- Shopping/deals content (Black Friday, sales, discounts)
- Product reviews (unboxing, hands-on, "worth buying")
- Price mentions ($12, "under $50", "drops to $")
- Marketing/promotional content

**Result**: ~842 articles remain (112 filtered out)

#### 2.3 Deduplication

```typescript
// Deduplicate by URL
const seenUrls = new Set();
const uniqueArticles = allArticles.filter((article: any) => {
  if (article.url && !seenUrls.has(article.url)) {
    seenUrls.add(article.url);
    return true;
  }
  return false;
});
```

**Result**: Removes duplicate articles with same URL

#### 2.4 Final Consumer Content Check

**Second Pass** (after deduplication):
```typescript
const finalFilteredArticles = uniqueArticles.filter(
  article => !isConsumerContent(article)
);
```

**Result**: ~842 unique, filtered articles

#### 2.5 Scoring & Ranking

**For Home Feed** (no explicit query):
```typescript
// Scoring is SKIPPED for home feed
// Articles keep their original _score from RSS ranking pipeline
```

**For Search/Query** (explicit `?q=` parameter):
```typescript
scoredArticles = scoreAndSortArticles(finalFilteredArticles);
// Filters by relevanceScore >= 15 AND aiFocusScore >= 5
// Sorts by relevanceScore, then aiFocusScore
```

#### 2.6 Final Sorting

```typescript
filteredArticles.sort((a, b) => {
  // 1. Primary: Editorial rank score (_score from RSS pipeline)
  const scoreA = a._score ?? -Infinity;
  const scoreB = b._score ?? -Infinity;
  if (scoreB !== scoreA) return scoreB - scoreA;

  // 2. Secondary: Newest first (by publishedAt)
  const dateA = new Date(a.publishedAt || 0).getTime();
  const dateB = new Date(b.publishedAt || 0).getTime();
  if (dateB !== dateA) return dateB - dateA;

  // 3. Tertiary: Content relevance score (for search queries)
  return (b.score?.relevanceScore || 0) - (a.score?.relevanceScore || 0);
});
```

**Sorting Priority**:
1. **Editorial Score** (`_score`) - from RSS ranking pipeline (source priority + recency)
2. **Publication Date** - newest first
3. **Content Score** - relevance/AI focus (only for search queries)

#### 2.7 API Response

```typescript
{
  articles: filteredArticles,  // All 842 articles (sorted)
  _sources: {
    rss: 866,
    gdelt: 50,
    hn: 14,
    instagram: 24,
    total: 842
  },
  pagination: { ... },
  filters: { ... }
}
```

---

### Step 3: Client-Side Filtering

**File**: `src/components/news/ClientFilteredNews.tsx`

#### 3.1 Filter State

```typescript
const [filters, setFilters] = useState<FilterState>({
  contentType: "ALL",      // ALL | TODAY | PRODUCT_UPDATES | MODEL_RELEASES | RESEARCH | OTHER_PLATFORMS
  source: null,            // null | "OpenAI" | "Instagram" | etc.
  product: "All",          // "All" | "ChatGPT" | "Gemini" | "Claude" | "LLaMA" | "Grok"
});
```

#### 3.2 Apply Filters

**File**: `src/lib/news/applyFilters.ts`

```typescript
const filtered = applyFilters(articles, filters);
```

**Filter Logic** (AND logic across filter groups):

1. **Source Filter**:
   ```typescript
   if (filters.source === "Instagram") {
     // Match by _isInstagram flag OR source name starting with "Instagram:"
     return a._isInstagram || sourceName.startsWith("instagram:");
   } else {
     // Exact match (case-insensitive)
     return sourceName === filters.source.toLowerCase();
   }
   ```

2. **Product Filter**:
   ```typescript
   // Matches by:
   // - Entity tags (article.entities array)
   // - Keywords in title (e.g., "GPT" for ChatGPT)
   return matchesProduct(article, product);
   ```

3. **Content Type Filter**:
   ```typescript
   switch (contentType) {
     case "ALL": return true;
     case "TODAY": return publishedWithinLast24Hours;
     case "PRODUCT_UPDATES": return updateType === "PRODUCT_UPDATE";
     case "MODEL_RELEASES": return updateType === "MODEL_RELEASE";
     case "RESEARCH": return updateType === "RESEARCH";
     case "OTHER_PLATFORMS": return isOtherPlatform(article);
       // Includes: TECH_NEWS, AGGREGATOR sources, HN, GDELT, Instagram
   }
   ```

**Result**: Filtered array based on active filters

#### 3.3 Pagination

```typescript
const pageSize = 20;
const totalPages = Math.ceil(filtered.length / pageSize);
const start = (page - 1) * pageSize;
const end = start + pageSize;
const pageItems = filtered.slice(start, end);
```

**Pagination**:
- **20 articles per page**
- Client-side only (no API calls)
- Updates instantly when filters change

---

### Step 4: Display

**File**: `src/components/news/ClientFilteredNews.tsx`

#### 4.1 Filter UI

**Content Type Tabs**:
- All
- Today in AI (last 24 hours)
- Product Updates
- Model Releases
- Research
- Other Platforms

**Source Buttons**:
- All Sources
- Primary sources: OpenAI, Google AI, DeepMind, Anthropic, Meta AI, xAI, Instagram
- "+ Explore More" modal (all available sources)

**Product Pills**:
- All, ChatGPT, Gemini, Claude, LLaMA, Grok

#### 4.2 Article Grid

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
  {pageItems.map((article) => (
    <NewsCardWithBookmark
      key={article.url}
      title={article.title}
      summary={article.description || article.summary}
      imageUrl={article.imageUrl || article.image}
      source={article.source?.name || article.source}
      date={article.publishedAt || article.pubDate}
      url={article.url}
    />
  ))}
</div>
```

**Layout**:
- 1 column on mobile
- 2 columns on desktop
- Each card shows: image, title, summary, source, date

#### 4.3 Pagination Controls

```typescript
Showing {start + 1} to {end} of {totalItems} results
[Previous] Page {currentPage} of {totalPages} [Next]
```

---

## 🎯 Key Characteristics

### 1. **No API Calls on Filter Changes**
- All 500 articles are loaded once
- Filtering happens in browser memory
- Instant response to filter changes

### 2. **Client-Side Pagination**
- 20 articles per page
- Pagination resets to page 1 when filters change
- Total pages calculated from filtered results

### 3. **Filter Combination**
- Filters use **AND logic** (must match all active filters)
- Example: "Product Updates" + "OpenAI" + "ChatGPT" = articles that are:
  - Product updates
  - From OpenAI
  - About ChatGPT

### 4. **Sorting Priority**
1. **Editorial Score** (`_score`) - from RSS ranking
2. **Publication Date** - newest first
3. **Content Score** - relevance (search only)

### 5. **Source Priority** (from RSS ranking)

```typescript
OFFICIAL_BLOG: 100    // OpenAI, Google AI, Anthropic, etc.
RESEARCH_LAB: 80      // DeepMind, Microsoft Research
TECH_NEWS: 50         // TechCrunch, Wired, MIT Tech Review
AGGREGATOR: 20        // GDELT, HN, Instagram
```

---

## 📈 Data Flow Summary

```
1. Page Load
   ↓
2. API Call: /api/ai-news?refresh=true&limit=500
   ↓
3. Backend Processing:
   - Fetch from all sources (RSS, GDELT, HN, Instagram)
   - Filter consumer content
   - Deduplicate by URL
   - Sort by editorial score + date
   ↓
4. Return 500 articles to frontend
   ↓
5. Client Component:
   - Apply filters (content type, source, product)
   - Paginate (20 per page)
   - Display in grid
   ↓
6. User Interaction:
   - Change filter → Re-filter in memory → Update display
   - Change page → Slice filtered array → Update display
   - No new API calls!
```

---

## 🔍 Filter Examples

### Example 1: View All Instagram Posts

```typescript
filters = {
  contentType: "ALL",
  source: "Instagram",
  product: "All"
}
```

**Result**: Shows all 24 Instagram posts (paginated, 20 per page)

### Example 2: Today's Product Updates from OpenAI

```typescript
filters = {
  contentType: "TODAY",  // Last 24 hours
  source: "OpenAI",
  product: "All"
}
```

**Result**: OpenAI articles from last 24 hours that are product updates

### Example 3: Research About ChatGPT

```typescript
filters = {
  contentType: "RESEARCH",
  source: null,  // All sources
  product: "ChatGPT"
}
```

**Result**: Research articles mentioning ChatGPT from any source

---

## 🎨 UI Components

### Filter Sections

1. **Content Type** - Horizontal tabs
2. **Sources** - Grid of buttons (2 columns)
3. **Products** - Grid of pills (2 columns)

### Results Display

- **Info Bar**: Shows active filters and result count
- **Article Grid**: 2-column responsive grid
- **Pagination**: Previous/Next with page numbers

---

## ⚡ Performance Optimizations

1. **Single API Call**: Fetch once, filter many times
2. **Memoization**: `useMemo` for filtered results
3. **Client-Side Only**: No network requests on filter changes
4. **Efficient Filtering**: Simple array operations (fast)
5. **Pagination**: Only render 20 items at a time

---

## 🔧 Configuration

### Page Size
```typescript
const pageSize = 20;  // Change in ClientFilteredNews.tsx
```

### Initial Article Limit
```typescript
const data = await getNews(`/api/ai-news?refresh=true&limit=500`);
// Change limit=500 to fetch more/fewer articles
```

### Filter Options
- **Content Types**: Edit `CONTENT_TABS` in `ClientFilteredNews.tsx`
- **Primary Sources**: Edit `PRIMARY_SOURCES` in `ClientFilteredNews.tsx`
- **Products**: Edit `PRODUCT_PILLS` in `ClientFilteredNews.tsx`

---

**Last Updated**: January 2026
