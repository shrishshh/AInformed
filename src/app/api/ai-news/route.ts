import { NextResponse } from 'next/server';
import mockNews from '@/data/news.json';
import { getCachedRSSArticles, getCachedGDELTArticles, getCachedHNArticles, getCachedInstagramArticles } from '@/lib/rssCron';
import { 
  withCache, 
  generateCacheKey, 
  createCachedResponse, 
  CACHE_CONFIG,
  memoryCache 
} from '@/lib/cacheService';
import NewsCache from '@/models/NewsCache';
import connectDB from '@/lib/mongodb';
import { OFFICIAL_AI_SOURCES } from '@/lib/sources/officialSources';
import { searchTavilyArticles } from '@/lib/tavilyFetcher';
import { searchPerplexityArticles } from '@/lib/perplexityFetcher';

// Mock news data for fallback
const mockNewsData = {
  articles: mockNews || [],
  _isMockData: true,
    _sources: {
      gnews: 0,
      rss: 0,
      gdelt: 0,
      hn: 0,
      instagram: 0,
      tavily: 0,
      total: mockNews?.length || 0
    },
  timestamp: new Date().toISOString()
};

// Force dynamic rendering to prevent static generation during build
export const dynamic = 'force-dynamic';

const CACHE_VERSION = 'v4-backend-filters-searchonly';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const withTimeout = async <T,>(p: Promise<T>, ms: number): Promise<T> => {
    return await Promise.race([
      p,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`timeout:${ms}ms`)), ms)),
    ]);
  };
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const bulk = searchParams.get('bulk') === 'true';
  const limitCap = bulk ? 1000 : 100;
  const limit = Math.min(limitCap, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const forceRefresh = searchParams.get('refresh') === 'true';
  const statsOnly = searchParams.get('stats') === 'true';

  // Filters (backend-driven)
  const query = (searchParams.get('q') || searchParams.get('query') || '').trim();
  const content = (searchParams.get('section') || searchParams.get('content') || searchParams.get('contentType') || 'ALL').toUpperCase();
  const sourceParam = (searchParams.get('source') || '').trim();
  const productParam = (searchParams.get('product') || '').trim();
  const platformParam = (searchParams.get('platform') || '').trim().toLowerCase(); // all | official | other
  const sourcesParam = (searchParams.get('sources') || '').trim(); // CSV
  const topicsParam = (searchParams.get('topics') || '').trim(); // CSV
  const timeParam = (searchParams.get('time') || '').trim();
  const locationParam = (searchParams.get('location') || '').trim(); // CSV

  const hasExplicitQuery = query.length > 0;
  
  // STRICTER: Expanded blocked queries (consumer/shopping/marketing)
  const blockedQueries = [
    'black friday', 'cyber monday', 'deal', 'deals', 'sale', 'sales',
    'shopping', 'review', 'reviews', 'gadget', 'powerbank', 'airpods',
    'bollywood', 'hollywood', 'movie', 'film', 'actor', 'actress',
    'celebrity', 'music', 'sports', 'weather', 'politics',
    'food', 'travel', 'fashion', 'entertainment', 'gossip'
  ];
  
  const queryLower = query.toLowerCase().trim();
  const isBlocked = hasExplicitQuery && blockedQueries.some(blocked => queryLower === blocked || queryLower.includes(blocked));
  
  if (isBlocked) {
    return NextResponse.json({
      articles: [],
      _isMockData: false,
      _sources: { gnews: 0, rss: 0, gdelt: 0, hn: 0, instagram: 0, tavily: 0, total: 0 },
      timestamp: new Date().toISOString(),
      message: 'Sorry, this search is not AI/tech focused. Please try searching for AI-related topics like "machine learning", "chatgpt", "artificial intelligence", etc.'
    });
  }

  // Generate cache key based on request parameters
  const cacheKey = generateCacheKey(`news:${CACHE_VERSION}`, { q: query || null, content, source: sourceParam || null, sources: sourcesParam || null, topics: topicsParam || null, time: timeParam || null, location: locationParam || null, product: productParam || null, platform: platformParam || null, stats: statsOnly ? '1' : null, page, limit });
  
  // Always clean up expired caches first - be aggressive about it
  try {
    await withTimeout(connectDB(), 2500);
    const deletedCount = await withTimeout(NewsCache.cleanExpired(), 2500);
    if (deletedCount.deletedCount > 0) {
      console.log(`🗑️ Cleaned up ${deletedCount.deletedCount} expired cache entries`);
    }
    
    // Also manually delete any cache for this specific key if it's older than 1 hour
    const existingCache = await withTimeout(NewsCache.findOne({ cacheKey }), 2500);
    if (existingCache) {
      const cacheTime = existingCache.timestamp || (existingCache as any).createdAt;
      const cacheAge = Date.now() - new Date(cacheTime).getTime();
      if (cacheAge > CACHE_CONFIG.DB_CACHE_DURATION) {
        console.log(`🗑️ Deleting stale cache for ${cacheKey} (age: ${Math.floor(cacheAge / 3600000)} hours)`);
        await withTimeout(NewsCache.deleteOne({ cacheKey }), 2500);
      }
    }
  } catch (error) {
    console.error('Error during cache cleanup:', error);
  }
  
  // If force refresh is requested, skip cache entirely
  if (!forceRefresh) {
    // Try to get from memory cache first (fastest)
    const memoryCached = memoryCache.get(cacheKey);
    if (memoryCached) {
      // Avoid serving "empty cache artifacts" created during cold start.
      const cachedTotal = (memoryCached as any)?.total ?? (memoryCached as any)?.pagination?.totalItems ?? 0;
      const cachedRss = (memoryCached as any)?._sources?.rss ?? 0;
      const currentRss = getCachedRSSArticles()?.length || 0;

      if ((cachedTotal === 0 || cachedRss === 0) && currentRss > 0) {
        console.log(`⚠️ Ignoring stale empty memory cache for: ${cacheKey}`);
      } else {
        console.log(`💾 Memory cache hit for: ${cacheKey}`);
        return createCachedResponse(memoryCached, CACHE_CONFIG.API_CACHE_DURATION);
      }
    }

    // Try to get from database cache
    try {
      await withTimeout(connectDB(), 2500);
      const dbCached = await withTimeout(NewsCache.findValidCache(cacheKey), 2500);
      if (dbCached) {
        // Double-check cache age to ensure it's actually fresh (within 1 hour)
        const cacheTime = dbCached.timestamp || (dbCached as any).createdAt;
        const cacheAge = Date.now() - new Date(cacheTime).getTime();
        const cacheAgeMinutes = Math.floor(cacheAge / 60000);
        const cacheAgeHours = Math.floor(cacheAge / 3600000);
        
        console.log(`📦 Database cache found for: ${cacheKey}`);
        console.log(`   Cache timestamp: ${new Date(cacheTime).toISOString()}`);
        console.log(`   Cache age: ${cacheAgeMinutes} minutes (${cacheAgeHours} hours)`);
        console.log(`   DB_CACHE_DURATION: ${CACHE_CONFIG.DB_CACHE_DURATION}ms (${CACHE_CONFIG.DB_CACHE_DURATION / 3600000} hours)`);
        
        // If cache is older than 1 hour, ignore it and fetch fresh data
        if (cacheAge > CACHE_CONFIG.DB_CACHE_DURATION) {
          console.log(`⚠️ Cache EXPIRED (age: ${cacheAgeHours} hours > 1 hour), DELETING and fetching fresh data`);
          // Delete expired cache entry
          const deleteResult = await withTimeout(NewsCache.deleteOne({ cacheKey }), 2500);
          console.log(`   Delete result: ${JSON.stringify(deleteResult)}`);
          // Also remove from memory cache
          memoryCache.delete(cacheKey);
          // Continue to fetch fresh data below
        } else {
          // Cache is still valid, but avoid serving "empty cache artifacts" created during cold start.
          const cachedData: any = dbCached.data;
          const cachedTotal = cachedData?.total ?? cachedData?.pagination?.totalItems ?? 0;
          const cachedRss = cachedData?._sources?.rss ?? 0;
          const currentRss = getCachedRSSArticles()?.length || 0;

          if ((cachedTotal === 0 || cachedRss === 0) && currentRss > 0) {
            console.log(`⚠️ Ignoring stale empty DB cache for ${cacheKey} (rss now available)`);
            // proceed to fetch fresh below
          } else {
            console.log(`✅ Using cached data (${cacheAgeMinutes} minutes old)`);
            // Store in memory cache for faster subsequent access
            memoryCache.set(cacheKey, cachedData, CACHE_CONFIG.MEMORY_CACHE_DURATION);
            return createCachedResponse(cachedData, CACHE_CONFIG.API_CACHE_DURATION);
          }
        }
      } else {
        console.log(`📭 No valid cache found for: ${cacheKey}, will fetch fresh data`);
      }
    } catch (error) {
      console.error('Database cache error:', error);
    }
  } else {
    console.log(`🔄 Force refresh requested, bypassing cache for: ${cacheKey}`);
    // Remove from both caches if force refresh
    memoryCache.delete(cacheKey);
    try {
      await withTimeout(connectDB(), 2500);
      await withTimeout(NewsCache.deleteOne({ cacheKey }), 2500);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

  try {
    // IMPORTANT: This route must be fast.
    // Use cached sources by default; only refresh when ?refresh=true is provided.
    // (This prevents 30s+ requests and makes pagination/filters usable.)

    let rssArticlesFormatted = getCachedRSSArticles();
    let gdeltArticlesFormatted = getCachedGDELTArticles();
    let hnArticlesFormatted = getCachedHNArticles();
    let instagramArticlesFormatted = getCachedInstagramArticles();
    let tavilyArticlesFormatted: any[] = [];
    let perplexityArticlesFormatted: any[] = [];

    // Cold-start guard: if caches are empty and refresh wasn't requested,
    // wait for a single cache fill (bounded) so first-load isn't blank.
    const cachedCount =
      (rssArticlesFormatted?.length || 0) +
      (gdeltArticlesFormatted?.length || 0) +
      (hnArticlesFormatted?.length || 0) +
      (instagramArticlesFormatted?.length || 0);
    if (!forceRefresh && cachedCount === 0) {
      try {
        const { updateAllCaches } = await import('@/lib/rssCron');
        await withTimeout(updateAllCaches(), 20000);
        rssArticlesFormatted = getCachedRSSArticles();
        gdeltArticlesFormatted = getCachedGDELTArticles();
        hnArticlesFormatted = getCachedHNArticles();
        instagramArticlesFormatted = getCachedInstagramArticles();
      } catch (e) {
        console.error('Cold-start cache fill failed:', e);
      }
    }

    // Optionally refresh cached sources if requested
    if (forceRefresh) {
      try {
        const { refreshAllCaches } = await import('@/lib/rssCron');
        await refreshAllCaches();
        rssArticlesFormatted = getCachedRSSArticles();
        gdeltArticlesFormatted = getCachedGDELTArticles();
        hnArticlesFormatted = getCachedHNArticles();
        instagramArticlesFormatted = getCachedInstagramArticles();
      } catch (e) {
        console.error('Refresh caches failed:', e);
      }
    }

    // Search-only mode: Tavily + Perplexity only when user explicitly searches
    if (hasExplicitQuery) {
      const [tavilyRes, perplexityRes] = await Promise.allSettled([
        searchTavilyArticles(query),
        searchPerplexityArticles(query),
      ]);

      if (tavilyRes.status === 'fulfilled') tavilyArticlesFormatted = tavilyRes.value;
      if (perplexityRes.status === 'fulfilled') perplexityArticlesFormatted = perplexityRes.value;
    }

    // Optional: only pull GNews when:
    // - user is explicitly searching, OR
    // - platform=other, OR
    // - source explicitly targets it
    const wantsOtherPlatform = platformParam === 'other';
    const wantsGNews = !!GNEWS_API_KEY && (hasExplicitQuery || wantsOtherPlatform || sourceParam.toLowerCase() === 'gnews');

    let gnewsArticles: any[] = [];
    if (wantsGNews && GNEWS_API_KEY) {
      try {
        const gnewsQuery = hasExplicitQuery ? query : 'AI';
        const gnewsUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(gnewsQuery)}&lang=en&country=us&max=50&apikey=${GNEWS_API_KEY}`;
        console.log('Fetching from GNews API...');
        const response = await fetch(gnewsUrl, {
          headers: { Accept: 'application/json' },
          next: { revalidate: 300 },
        });
        if (response.ok) {
          const data = await response.json();
          gnewsArticles = (data.articles || []).map((article: any) => {
            const image = article.image || '';
            return {
              ...article,
              image,
              imageUrl: image,
              url: article.url || article.link,
              publishedAt: article.publishedAt || article.pubDate,
              description: article.description || article.content || '',
              source: article.source || { name: 'GNews' },
              _isGNews: true,
              sourceType: 'AGGREGATOR',
            };
          });
          console.log(`GNews: Fetched ${gnewsArticles.length} articles`);
        } else {
          console.error(`GNews API request failed: ${response.status} ${response.statusText}`);
        }
      } catch (e) {
        console.error('GNews fetch failed:', e);
      }
    }

    // Normalize non-RSS sources to include sourceType
    const gdeltWithType = (gdeltArticlesFormatted || []).map((a: any) => ({ ...a, sourceType: a.sourceType || 'AGGREGATOR' }));
    const hnWithType = (hnArticlesFormatted || []).map((a: any) => ({ ...a, sourceType: a.sourceType || 'AGGREGATOR' }));
    const instaWithType = (instagramArticlesFormatted || []).map((a: any) => ({ ...a, sourceType: a.sourceType || 'AGGREGATOR' }));
    const tavilyWithType = (tavilyArticlesFormatted || []).map((a: any) => ({ ...a, sourceType: a.sourceType || 'AGGREGATOR' }));
    const perplexityWithType = (perplexityArticlesFormatted || []).map((a: any) => ({ ...a, sourceType: a.sourceType || 'AGGREGATOR' }));

    // Merge all
    let allArticles: any[] = [
      ...rssArticlesFormatted,
      ...gdeltWithType,
      ...hnWithType,
      ...instaWithType,
      ...gnewsArticles,
      ...tavilyWithType,
      ...perplexityWithType,
    ];

    // Helpers
    const getSourceName = (a: any) => (a?.source?.name || a?.source || '').toString();
    const getPublishedAt = (a: any): Date | null => {
      const raw = a?.publishedAt || a?.pubDate;
      if (!raw) return null;
      const d = new Date(raw);
      return Number.isFinite(d.getTime()) ? d : null;
    };

    // Stats-only: return breakdown by source (no pagination/filtering)
    if (statsOnly) {
      const inc = (obj: Record<string, number>, key: string) => {
        obj[key] = (obj[key] || 0) + 1;
      };

      const bySourceRaw: Record<string, number> = {};
      for (const a of allArticles) {
        const name = getSourceName(a) || 'Unknown';
        inc(bySourceRaw, name);
      }

      // Dedup by URL for a "unique articles" view
      const seen = new Set<string>();
      const bySourceDeduped: Record<string, number> = {};
      for (const a of allArticles) {
        const u = (a?.url || '').toString();
        if (!u) continue;
        if (seen.has(u)) continue;
        seen.add(u);
        const name = getSourceName(a) || 'Unknown';
        inc(bySourceDeduped, name);
      }

      const toSortedArray = (obj: Record<string, number>) =>
        Object.entries(obj)
          .map(([source, count]) => ({ source, count }))
          .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source));

      return NextResponse.json({
        _isMockData: false,
        timestamp: new Date().toISOString(),
        stats: {
          pools: {
            rss: (rssArticlesFormatted || []).length,
            gdelt: (gdeltArticlesFormatted || []).length,
            hn: (hnArticlesFormatted || []).length,
            instagram: (instagramArticlesFormatted || []).length,
            gnews: (gnewsArticles || []).length,
            tavily: (tavilyArticlesFormatted || []).length,
            perplexity: (perplexityArticlesFormatted || []).length,
            mergedRawTotal: allArticles.length,
            mergedDedupedTotal: seen.size,
          },
          bySourceRaw: toSortedArray(bySourceRaw),
          bySourceDeduped: toSortedArray(bySourceDeduped),
        },
      });
    }

    // IMPORTANT: Only HIGH-trust sources bypass the non-official filters.
    // Tech journalism sources in the registry should still be filtered for AI relevance.
    const trustedSourceNames = new Set(
      OFFICIAL_AI_SOURCES.filter((s) => s.trust === 'HIGH').map((s) => s.company.toLowerCase())
    );
    const isTrustedSource = (a: any) => trustedSourceNames.has(getSourceName(a).toLowerCase());

    const consumerContentKeywords = [
      'black friday','cyber monday','prime day','deal','deals','discount','discounts','sale','sales','buy now','shopping','price drop',
      'review','reviews','unboxing','hands-on','best deals','lowest price','record-low','kindle','airpods','earbuds','headphones',
      'coupon','coupons','sponsored','advertisement','marketing','promotion','coffee maker','moccamaster','huckberry',
      // Non-AI “noise” patterns we consistently see from tech sites
      'wordle','quordle','connections','nyt connections','hints','answers','game #',
      'wwe','royal rumble','how to watch','stream','espn','netflix'
    ];
    const educationalKeywords = [
      'course','courses','bootcamp','tutorial','learn','certification','certified','udemy','coursera','edx','skillshare'
    ];

    const isConsumerContent = (a: any): boolean => {
      const t = `${(a?.title || '')} ${(a?.description || a?.summary || '')}`.toLowerCase();
      if (consumerContentKeywords.some((k) => t.includes(k))) return true;
      if (/\$\d+|\bunder\s*\$\d+\b|record-?low|lowest price/i.test(t)) return true;
      return false;
    };

    const isEducationalContent = (a: any): boolean => {
      const t = `${(a?.title || '')} ${(a?.description || a?.summary || '')}`.toLowerCase();
      return educationalKeywords.some((k) => t.includes(k));
    };

    const aiKeywords = [
      // Phrases
      'artificial intelligence',
      'machine learning',
      'deep learning',
      'large language model',
      'generative ai',
      'computer vision',
      'natural language processing',
      // Models / products / companies
      'chatgpt',
      'openai',
      'anthropic',
      'claude',
      'gemini',
      'deepmind',
      'meta ai',
      'llama',
      'grok',
      'xai',
      'mistral',
      'cohere',
      'nvidia',
      // Common tech terms (use word boundary)
      'ai',
      'ml',
      'llm',
      'gpt',
      'rag',
      'agent',
      'agents',
      'inference',
      'fine-tuning',
    ];
    const isAIRelevant = (a: any): boolean => {
      const t = `${(a?.title || '')} ${(a?.description || a?.summary || '')}`.toLowerCase();
      return aiKeywords.some((k) => {
        const kw = k.toLowerCase();
        // For very short tokens, require word boundaries to avoid matching "said"/"air"/etc.
        if (kw.length <= 3) {
          const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`, 'i');
          return re.test(t);
        }
        return t.includes(kw);
      });
    };

    const stopWords = new Set(['news','update','updates','today','latest','breaking','ai','the','a','an','and','or','of','to','in','on','for']);
    const meaningfulQueryTokens = (q: string): string[] =>
      q
        .toLowerCase()
        .split(/[^a-z0-9]+/g)
        .map((x) => x.trim())
        .filter((x) => x.length >= 2 && !stopWords.has(x));

    const matchesQuery = (a: any): boolean => {
      if (!hasExplicitQuery) return true;
      const tokens = meaningfulQueryTokens(query);
      if (tokens.length === 0) return true;
      const t = `${(a?.title || '')} ${(a?.description || a?.summary || '')}`.toLowerCase();
      // Strict for search API items, lenient for others (at least one token)
      const isSearchResult = !!a?._isTavily || !!a?._isPerplexity;
      if (isSearchResult) return tokens.every((tok) => t.includes(tok));
      return tokens.some((tok) => t.includes(tok));
    };

    const detectEntities = (a: any): string[] => {
      const t = `${(a?.title || '')} ${(a?.description || a?.summary || '')}`.toLowerCase();
      const entities: string[] = [];
      const add = (name: string) => { if (!entities.includes(name)) entities.push(name); };

      if (/\bchatgpt\b|\bgpt[-\s]?\d|\bopenai\b/.test(t)) add('ChatGPT');
      if (/\bgemini\b|\bvertex\b|\bgoogle ai\b|\bdeepmind\b/.test(t)) add('Gemini');
      if (/\bclaude\b|\banthropic\b/.test(t)) add('Claude');
      if (/\bgrok\b|\bxai\b|\bx ai\b/.test(t)) add('Grok');
      if (/\bllama\b|\bmeta ai\b/.test(t)) add('Llama');
      if (/\bcopilot\b|\bazure ai\b|\bmicrosoft ai\b/.test(t)) add('Copilot');
      if (/\bnvidia\b|\bcuda\b|\btensorrt\b/.test(t)) add('NVIDIA');
      return entities;
    };

    const classifyUpdateType = (a: any): string => {
      const t = `${(a?.title || '')} ${(a?.description || a?.summary || '')}`.toLowerCase();
      const has = (arr: string[]) => arr.some((k) => t.includes(k));
      if (has(['deprecated','deprecate','sunset','retire','end of life'])) return 'PRODUCT_UPDATE';
      if (has(['api','sdk','endpoint','rate limit','pricing'])) return 'API_UPDATE';
      if (has(['model','release','weights','checkpoint','sota','benchmark','new gpt','gpt-','llama','gemini','claude'])) return 'MODEL_RELEASE';
      if (has(['paper','arxiv','research','preprint','study'])) return 'RESEARCH';
      if (has(['launch','announced','introducing','now available','rollout','update'])) return 'PRODUCT_UPDATE';
      return 'NEWS';
    };

    // Enrich + filter
    allArticles = allArticles.map((a) => ({
      ...a,
      updateType: a.updateType || classifyUpdateType(a),
      entities: Array.isArray(a.entities) && a.entities.length > 0 ? a.entities : detectEntities(a),
    }));

    // Filtering rules:
    // - Never consumer/edu filter trusted sources
    // - Apply AI relevance + consumer/edu filters to non-trusted unless user explicitly searched
    allArticles = allArticles.filter((a) => {
      if (isTrustedSource(a)) return true;
      if (hasExplicitQuery) return true; // don't over-filter user search mode
      if (isEducationalContent(a)) return false;
      if (isConsumerContent(a)) return false;
      return isAIRelevant(a);
    });

    // Apply query match (even in search mode, but stricter for search API results)
    allArticles = allArticles.filter(matchesQuery);

    // Topics filter (UI: topics pills)
    if (topicsParam) {
      const requestedTopics = topicsParam
        .split(',')
        .map((s) => decodeURIComponent(s).trim())
        .filter(Boolean)
        .filter((t) => t !== 'All Topics');

      if (requestedTopics.length > 0) {
        const topicKeywords: Record<string, string[]> = {
          'Artificial Intelligence': ['artificial intelligence', 'ai', 'generative ai', 'agentic ai', 'ai system'],
          'Machine Learning': ['machine learning', 'ml', 'training', 'model training'],
          'Deep Learning': ['deep learning', 'neural network', 'neural networks', 'transformer'],
          'Natural Language Processing': ['natural language processing', 'nlp', 'llm', 'language model'],
          'Computer Vision': ['computer vision', 'image recognition', 'object detection', 'vision model'],
          Robotics: ['robotics', 'robot', 'autonomous', 'humanoid'],
          'Data Science': ['data science', 'analytics', 'data', 'pipeline'],
          Cybersecurity: ['security', 'cybersecurity', 'threat', 'vulnerability', 'malware'],
          'Quantum Computing': ['quantum', 'qubit', 'quantum computing'],
          'AI Ethics': ['ai ethics', 'responsible ai', 'safety', 'alignment', 'bias'],
          'Neural Networks': ['neural network', 'neural networks', 'ann'],
          Automation: ['automation', 'workflow', 'agent', 'agents'],
        };

        allArticles = allArticles.filter((a) => {
          const t = `${(a?.title || '')} ${(a?.description || a?.summary || '')}`.toLowerCase();
          return requestedTopics.some((topic) => {
            const kws = topicKeywords[topic] || [topic.toLowerCase()];
            return kws.some((kw) => t.includes(kw));
          });
        });
      }
    }

    // Sources filter (UI: source checkboxes)
    if (sourcesParam) {
      const requestedSources = sourcesParam
        .split(',')
        .map((s) => decodeURIComponent(s).trim())
        .filter(Boolean);

      if (requestedSources.length > 0) {
        const requestedLower = new Set(requestedSources.map((s) => s.toLowerCase()));
        allArticles = allArticles.filter((a) => {
          const name = getSourceName(a).toLowerCase();

          // Normalize special pooled sources so selecting "Instagram"/"GDELT"/"HackerNews"/"GNews" works
          const normalized =
            a?._isInstagram ? 'instagram' :
            a?._isGDELT ? 'gdelt' :
            a?._isHN ? 'hackernews' :
            a?._isGNews ? 'gnews' :
            name;

          // Also treat Instagram handles as instagram when user selected instagram
          const isInstagramName = name.startsWith('instagram');

          if (requestedLower.has(normalized)) return true;
          if (isInstagramName && requestedLower.has('instagram')) return true;
          return false;
        });
      }
    }

    // Time filter (UI: time radios)
    if (timeParam) {
      const now = Date.now();
      const tp = decodeURIComponent(timeParam);
      const maxAgeMs =
        tp === 'Last 24 hours'
          ? 24 * 60 * 60 * 1000
          : tp === 'Past week'
            ? 7 * 24 * 60 * 60 * 1000
            : tp === 'Past month'
              ? 30 * 24 * 60 * 60 * 1000
              : tp === 'Past year'
                ? 365 * 24 * 60 * 60 * 1000
                : null;

      if (maxAgeMs) {
        allArticles = allArticles.filter((a) => {
          const d = getPublishedAt(a);
          if (!d) return false;
          const ts = d.getTime();
          if (ts > now) return false;
          return now - ts <= maxAgeMs;
        });
      }
    }

    // Location filter (best-effort; based on domain TLD). "Global" means no filter.
    if (locationParam) {
      const requestedLocs = locationParam
        .split(',')
        .map((s) => decodeURIComponent(s).trim())
        .filter(Boolean)
        .filter((l) => l !== 'Global');

      if (requestedLocs.length > 0) {
        const isMatch = (u: string, loc: string): boolean => {
          const urlLower = u.toLowerCase();
          if (loc === 'United States') return urlLower.endsWith('.us') || urlLower.includes('.com/');
          if (loc === 'Europe') return ['.co.uk', '.eu', '.de', '.fr', '.nl', '.it', '.es'].some((tld) => urlLower.includes(tld + '/'));
          if (loc === 'Asia') return ['.in', '.jp', '.cn', '.sg', '.kr', '.hk'].some((tld) => urlLower.includes(tld + '/'));
          return true;
        };

        allArticles = allArticles.filter((a) => {
          const u = (a?.url || '').toString();
          if (!u) return false;
          return requestedLocs.some((loc) => isMatch(u, loc));
        });
      }
    }

    // Source filter
    if (sourceParam) {
      const sLower = sourceParam.toLowerCase();
      if (sLower === 'instagram') {
        allArticles = allArticles.filter((a) => !!a?._isInstagram || getSourceName(a).toLowerCase().startsWith('instagram'));
      } else if (sLower === 'gnews') {
        allArticles = allArticles.filter((a) => !!a?._isGNews || getSourceName(a).toLowerCase() === 'gnews');
      } else {
        allArticles = allArticles.filter((a) => getSourceName(a).toLowerCase() === sLower);
      }
    }

    // Platform filter
    if (platformParam === 'official') {
      allArticles = allArticles.filter((a) => ['OFFICIAL_BLOG','RESEARCH_LAB','CHANGELOG'].includes((a?.sourceType || '').toString()));
    } else if (platformParam === 'other') {
      allArticles = allArticles.filter((a) => {
        if (a?._isGDELT || a?._isHN || a?._isInstagram || a?._isGNews) return true;
        return ['TECH_NEWS','AGGREGATOR'].includes((a?.sourceType || '').toString());
      });
    }

    // Product filter
    if (productParam) {
      const pLower = productParam.toLowerCase();
      allArticles = allArticles.filter((a) => {
        const ents = (a?.entities || []) as string[];
        if (ents.some((e) => e.toLowerCase() === pLower)) return true;
        const t = `${(a?.title || '')} ${(a?.description || a?.summary || '')}`.toLowerCase();
        return t.includes(pLower);
      });
    }

    // Content/type filter
    const now = Date.now();
    if (content === 'TODAY') {
      allArticles = allArticles.filter((a) => {
        const d = getPublishedAt(a);
        if (!d) return false;
        const ts = d.getTime();
        if (ts > now) return false;
        const hours = (now - ts) / (1000 * 60 * 60);
        return hours >= 0 && hours <= 24;
      });
    } else if (content === 'PRODUCT_UPDATES' || content === 'PRODUCT_UPDATE') {
      allArticles = allArticles.filter((a) => (a?.updateType || '') === 'PRODUCT_UPDATE' || (a?.updateType || '') === 'API_UPDATE');
    } else if (content === 'MODEL_RELEASES' || content === 'MODEL_RELEASE') {
      allArticles = allArticles.filter((a) => (a?.updateType || '') === 'MODEL_RELEASE');
    } else if (content === 'RESEARCH') {
      allArticles = allArticles.filter((a) => (a?.updateType || '') === 'RESEARCH');
    }

    // Dedup by URL
    const seen = new Set<string>();
    allArticles = allArticles.filter((a) => {
      const u = (a?.url || '').toString();
      if (!u) return false;
      if (seen.has(u)) return false;
      seen.add(u);
      return true;
    });

    // Sort newest-first by published date; invalid/future to bottom
    allArticles.sort((a, b) => {
      const da = getPublishedAt(a)?.getTime() ?? -Infinity;
      const db = getPublishedAt(b)?.getTime() ?? -Infinity;
      const aFuture = da > now;
      const bFuture = db > now;
      if (aFuture !== bFuture) return aFuture ? 1 : -1;
      return db - da;
    });

    // Pagination
    const totalItems = allArticles.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const items = allArticles.slice(start, start + limit);

    // Filters metadata (available sources based on current pool)
    const availableSources = Array.from(new Set(allArticles.map(getSourceName).filter(Boolean))).sort((a, b) => a.localeCompare(b));

    const responseData = {
      items,
      // Backward compat (page.tsx currently reads data.articles)
      articles: items,
      total: totalItems,
      pagination: {
        page: safePage,
        limit,
        totalItems,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
      filters: {
        availableSources,
      },
      _isMockData: false,
      _sources: {
        gnews: gnewsArticles.length,
        rss: (rssArticlesFormatted || []).length,
        gdelt: (gdeltArticlesFormatted || []).length,
        hn: (hnArticlesFormatted || []).length,
        instagram: (instagramArticlesFormatted || []).length,
        tavily: (tavilyArticlesFormatted || []).length,
        perplexity: (perplexityArticlesFormatted || []).length,
        total: totalItems,
      },
      timestamp: new Date().toISOString(),
    };

    // Store in memory+db cache
    memoryCache.set(cacheKey, responseData, CACHE_CONFIG.MEMORY_CACHE_DURATION);
    try {
      // Avoid caching an "all empty" response (usually cold start)
      const shouldPersist =
        (responseData?._sources?.rss || 0) +
          (responseData?._sources?.gdelt || 0) +
          (responseData?._sources?.hn || 0) +
          (responseData?._sources?.instagram || 0) >
        0;
      if (!shouldPersist) {
        return createCachedResponse(responseData, CACHE_CONFIG.API_CACHE_DURATION);
      }

      const expiresAt = new Date(Date.now() + CACHE_CONFIG.DB_CACHE_DURATION);
      await withTimeout(connectDB(), 2500);
      await withTimeout(
        NewsCache.findOneAndUpdate(
          { cacheKey },
          {
            data: responseData,
            sources: responseData._sources,
            isMockData: false,
            timestamp: new Date(),
            expiresAt,
          },
          { upsert: true, new: true }
        ),
        2500
      );
    } catch (error) {
      console.error('Failed to store in database cache:', error);
    }

    return createCachedResponse(responseData, CACHE_CONFIG.API_CACHE_DURATION);
  } catch (error: any) {
    console.error('Error fetching news in API route:', error);
    return NextResponse.json(mockNewsData);
  }
} 