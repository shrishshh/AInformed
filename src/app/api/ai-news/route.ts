import { NextResponse } from 'next/server';
import mockNews from '@/data/news.json';
import { fetchAllRSSFeeds, filterRSSArticlesByCategory, convertRSSToNewsFormat } from '@/lib/rssFetcher';
import { getCachedRSSArticles, getCachedGDELTArticles, getCachedHNArticles } from '@/lib/rssCron';
import { fetchGDELTArticles, convertGDELTToNewsFormat } from '@/lib/gdeltFetcher';
import { fetchHNStories, convertHNToNewsFormat } from '@/lib/hnFetcher';
import { 
  withCache, 
  generateCacheKey, 
  createCachedResponse, 
  CACHE_CONFIG,
  memoryCache 
} from '@/lib/cacheService';
import NewsCache from '@/models/NewsCache';
import { connectDB } from '@/lib/mongodb';

// Mock news data for fallback
const mockNewsData = {
  articles: mockNews || [],
  _isMockData: true,
  _sources: {
    gnews: 0,
    rss: 0,
    gdelt: 0,
    hn: 0,
    total: mockNews?.length || 0
  },
  timestamp: new Date().toISOString()
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const query = searchParams.get('q') || 'AI';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  // Generate cache key based on request parameters
  const cacheKey = generateCacheKey('news', { category, query, page, limit });
  
  // Try to get from memory cache first (fastest)
  const memoryCached = memoryCache.get(cacheKey);
  if (memoryCached) {
    console.log(`Memory cache hit for: ${cacheKey}`);
    return createCachedResponse(memoryCached, CACHE_CONFIG.API_CACHE_DURATION);
  }

  // Try to get from database cache
  try {
    await connectDB();
    const dbCached = await NewsCache.findValidCache(cacheKey);
    if (dbCached) {
      console.log(`Database cache hit for: ${cacheKey}`);
      // Store in memory cache for faster subsequent access
      memoryCache.set(cacheKey, dbCached.data, CACHE_CONFIG.MEMORY_CACHE_DURATION);
      return createCachedResponse(dbCached.data, CACHE_CONFIG.API_CACHE_DURATION);
    }
  } catch (error) {
    console.error('Database cache error:', error);
  }

  const API_KEY = process.env.GNEWS_API_KEY;
  if (!API_KEY) {
    console.error('GNews API key not found');
    return NextResponse.json(mockNewsData);
  }

  try {
    // Get cached RSS, GDELT, and HN articles first (fast)
    let rssArticlesFormatted = getCachedRSSArticles();
    let gdeltArticlesFormatted = getCachedGDELTArticles();
    let hnArticlesFormatted = getCachedHNArticles(); // Get cached HN

    // Fetch from all four sources (GNews, RSS, GDELT, HN) in parallel
    const [gnewsResponse, freshRSSResponse, freshGDELTResponse, freshHNResponse] = await Promise.allSettled([
      // GNews API call
      (async () => {
        const gnewsUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&country=us&max=50&apikey=${API_KEY}`;
        console.log('Fetching from GNews API...');
        
        const response = await fetch(gnewsUrl, {
          headers: {
            'Accept': 'application/json',
          },
          next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!response.ok) {
          throw new Error(`GNews API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.errors && data.errors.length > 0) {
          console.error('GNews API errors:', data.errors);
          // Check if it's a rate limit error
          if (data.errors.some((error: any) => error.message?.includes('rate limit'))) {
            console.log('GNews rate limit reached, returning empty array');
            return { articles: [] };
          }
          throw new Error(`GNews API errors: ${JSON.stringify(data.errors)}`);
        }

        return data;
      })(),

      // Fresh RSS feeds fetch (only if cache is empty)
      (async () => {
        if (rssArticlesFormatted.length === 0) {
          console.log('RSS cache empty, fetching fresh RSS feeds...');
          const rssArticles = await fetchAllRSSFeeds();
          rssArticlesFormatted = convertRSSToNewsFormat(rssArticles);
        }
        return rssArticlesFormatted;
      })(),

      // Fresh GDELT fetch (only if cache is empty)
      (async () => {
        if (gdeltArticlesFormatted.length === 0) {
          console.log('GDELT cache empty, fetching fresh GDELT articles...');
          const gdeltArticles = await fetchGDELTArticles();
          gdeltArticlesFormatted = convertGDELTToNewsFormat(gdeltArticles);
        }
        return gdeltArticlesFormatted;
      })(),

      // Fresh HN fetch (only if cache is empty)
      (async () => {
        if (hnArticlesFormatted.length === 0) {
          console.log('HN cache empty, fetching fresh HN stories...');
          const hnStories = await fetchHNStories();
          hnArticlesFormatted = convertHNToNewsFormat(hnStories);
        }
        return hnArticlesFormatted;
      })()
    ]);

    // Process results
    let gnewsArticles: any[] = [];

    if (gnewsResponse.status === 'fulfilled') {
      gnewsArticles = gnewsResponse.value.articles || [];
      console.log(`GNews: Fetched ${gnewsArticles.length} articles`);
    } else {
      console.error('GNews fetch failed:', gnewsResponse.reason);
    }

    if (freshRSSResponse.status === 'fulfilled') {
      rssArticlesFormatted = freshRSSResponse.value;
      console.log(`RSS: Using ${rssArticlesFormatted.length} articles (${rssArticlesFormatted.length === 0 ? 'from cache' : 'fresh fetch'})`);
    } else {
      console.error('RSS fetch failed:', freshRSSResponse.reason);
      }

    if (freshGDELTResponse.status === 'fulfilled') {
      gdeltArticlesFormatted = freshGDELTResponse.value;
      console.log(`GDELT: Using ${gdeltArticlesFormatted.length} articles (${gdeltArticlesFormatted.length === 0 ? 'from cache' : 'fresh fetch'})`);
    } else {
      console.error('GDELT fetch failed:', freshGDELTResponse.reason);
    }

    if (freshHNResponse.status === 'fulfilled') {
      hnArticlesFormatted = freshHNResponse.value;
      console.log(`HN: Using ${hnArticlesFormatted.length} stories (${hnArticlesFormatted.length === 0 ? 'from cache' : 'fresh fetch'})`);
    } else {
      console.error('HN fetch failed:', freshHNResponse.reason);
    }

    // Merge and deduplicate articles from all four sources
    const allArticles = [...gnewsArticles, ...rssArticlesFormatted, ...gdeltArticlesFormatted, ...hnArticlesFormatted];
    const seenUrls = new Set();
    const uniqueArticles = allArticles.filter((article: any) => {
      if (article.url && !seenUrls.has(article.url)) {
        seenUrls.add(article.url);
        return true;
      }
      return false;
    });

    // Sort by date (newest first)
    uniqueArticles.sort((a: any, b: any) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    console.log(`Total unique articles: ${uniqueArticles.length} (GNews: ${gnewsArticles.length}, RSS: ${rssArticlesFormatted.length}, GDELT: ${gdeltArticlesFormatted.length}, HN: ${hnArticlesFormatted.length})`);

    const responseData = { 
      articles: uniqueArticles,
      _isMockData: false,
      _sources: {
        gnews: gnewsArticles.length,
        rss: rssArticlesFormatted.length,
        gdelt: gdeltArticlesFormatted.length,
        hn: hnArticlesFormatted.length,
        total: uniqueArticles.length
      },
      timestamp: new Date().toISOString()
    };

    // Store in memory cache (fastest access)
    memoryCache.set(cacheKey, responseData, CACHE_CONFIG.MEMORY_CACHE_DURATION);

    // Store in database cache (persistent)
    try {
      await NewsCache.findOneAndUpdate(
        { cacheKey },
        { 
          data: responseData,
          sources: responseData._sources,
          isMockData: false,
          expiresAt: new Date(Date.now() + CACHE_CONFIG.DB_CACHE_DURATION)
        },
        { upsert: true, new: true }
      );
      console.log(`Stored in database cache: ${cacheKey}`);
    } catch (error) {
      console.error('Failed to store in database cache:', error);
    }

    return createCachedResponse(responseData, CACHE_CONFIG.API_CACHE_DURATION);
  } catch (error: any) {
    console.error('Error fetching news in API route:', error);
    return NextResponse.json(mockNewsData);
  }
} 