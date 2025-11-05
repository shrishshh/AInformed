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
import connectDB from '@/lib/mongodb';
import { scoreAndSortArticles } from '@/lib/contentScoring';

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
  let query = searchParams.get('q') || 'AI';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const forceRefresh = searchParams.get('refresh') === 'true'; // Add ?refresh=true to bypass cache
  
  // Block non-AI related searches to prevent irrelevant results
  const blockedQueries = [
    'bollywood', 'hollywood', 'movie', 'film', 'actor', 'actress',
    'celebrity', 'music', 'sports', 'weather', 'politics',
    'food', 'travel', 'fashion', 'entertainment'
  ];
  
  const queryLower = query.toLowerCase().trim();
  const isBlocked = blockedQueries.some(blocked => queryLower === blocked || queryLower.includes(blocked));
  
  if (isBlocked) {
    return NextResponse.json({
      articles: [],
      _isMockData: false,
      _sources: { gnews: 0, rss: 0, gdelt: 0, hn: 0, total: 0 },
      timestamp: new Date().toISOString(),
      message: 'Sorry, this search is not AI/tech focused. Please try searching for AI-related topics like "machine learning", "chatgpt", "artificial intelligence", etc.'
    });
  }

  // Generate cache key based on request parameters
  const cacheKey = generateCacheKey('news', { category, query, page, limit });
  
  // Always clean up expired caches first - be aggressive about it
  try {
    await connectDB();
    const deletedCount = await NewsCache.cleanExpired();
    if (deletedCount.deletedCount > 0) {
      console.log(`🗑️ Cleaned up ${deletedCount.deletedCount} expired cache entries`);
    }
    
    // Also manually delete any cache for this specific key if it's older than 1 hour
    const existingCache = await NewsCache.findOne({ cacheKey });
    if (existingCache) {
      const cacheTime = existingCache.timestamp || existingCache.createdAt;
      const cacheAge = Date.now() - new Date(cacheTime).getTime();
      if (cacheAge > CACHE_CONFIG.DB_CACHE_DURATION) {
        console.log(`🗑️ Deleting stale cache for ${cacheKey} (age: ${Math.floor(cacheAge / 3600000)} hours)`);
        await NewsCache.deleteOne({ cacheKey });
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
      console.log(`💾 Memory cache hit for: ${cacheKey}`);
      return createCachedResponse(memoryCached, CACHE_CONFIG.API_CACHE_DURATION);
    }

    // Try to get from database cache
    try {
      await connectDB();
      const dbCached = await NewsCache.findValidCache(cacheKey);
      if (dbCached) {
        // Double-check cache age to ensure it's actually fresh (within 1 hour)
        const cacheTime = dbCached.timestamp || dbCached.createdAt;
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
          const deleteResult = await NewsCache.deleteOne({ cacheKey });
          console.log(`   Delete result: ${JSON.stringify(deleteResult)}`);
          // Also remove from memory cache
          memoryCache.delete(cacheKey);
          // Continue to fetch fresh data below
        } else {
          // Cache is still valid, use it
          console.log(`✅ Using cached data (${cacheAgeMinutes} minutes old)`);
          // Store in memory cache for faster subsequent access
          memoryCache.set(cacheKey, dbCached.data, CACHE_CONFIG.MEMORY_CACHE_DURATION);
          return createCachedResponse(dbCached.data, CACHE_CONFIG.API_CACHE_DURATION);
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
      await connectDB();
      await NewsCache.deleteOne({ cacheKey });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
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

        // Log GNews response details for debugging
        const articleCount = data.articles?.length || 0;
        const totalArticles = data.totalArticles || 'unknown';
        console.log(`GNews API response: ${articleCount} articles returned (requested max=50, total available: ${totalArticles})`);
        
        if (articleCount < 50 && totalArticles !== 'unknown' && totalArticles > articleCount) {
          console.log(`⚠️ GNews: Only ${articleCount} articles returned despite ${totalArticles} available. This may be due to free tier limitations.`);
        }

        return data;
      })(),

      // Always fetch fresh RSS for the response to avoid stale results on first load after DB expiry
      (async () => {
        console.log('Fetching fresh RSS feeds for response...');
        const rssArticles = await fetchAllRSSFeeds();
        rssArticlesFormatted = convertRSSToNewsFormat(rssArticles);
        return rssArticlesFormatted;
      })(),

      (async () => {
        console.log('Fetching fresh GDELT articles for response...');
        const gdeltArticles = await fetchGDELTArticles();
        gdeltArticlesFormatted = convertGDELTToNewsFormat(gdeltArticles);
        return gdeltArticlesFormatted;
      })(),

      (async () => {
        console.log('Fetching fresh HN stories for response...');
        const hnStories = await fetchHNStories();
        hnArticlesFormatted = convertHNToNewsFormat(hnStories);
        return hnArticlesFormatted;
      })()
    ]);

    // Process results
    let gnewsArticles: any[] = [];

    if (gnewsResponse.status === 'fulfilled') {
      gnewsArticles = (gnewsResponse.value.articles || []).map((article: any) => {
        // Normalize GNews articles: ensure both image and imageUrl are set
        // GNews API uses 'image' field, but we want both for consistency
        const image = article.image || '';
        return {
          ...article,
          image: image,
          imageUrl: image, // Also set imageUrl for consistency
          url: article.url || article.link,
          publishedAt: article.publishedAt || article.pubDate,
          description: article.description || article.content || '',
          source: article.source || { name: 'GNews' }
        };
      });
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

    // Helper function to decode HTML entities in image URLs
    const decodeHtmlEntities = (str: string): string => {
      if (!str) return '';
      return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/');
    };

    // Merge and deduplicate articles from all four sources
    const allArticles = [...gnewsArticles, ...rssArticlesFormatted, ...gdeltArticlesFormatted, ...hnArticlesFormatted];
    const seenUrls = new Set();
    const uniqueArticles = allArticles.filter((article: any) => {
      if (article.url && !seenUrls.has(article.url)) {
        seenUrls.add(article.url);
        // Decode HTML entities in image URL if present
        if (article.image) {
          article.image = decodeHtmlEntities(article.image);
        }
        if (article.imageUrl) {
          article.imageUrl = decodeHtmlEntities(article.imageUrl);
        }
        return true;
      }
      return false;
    });

    // Score and sort articles by relevance
    let scoredArticles = scoreAndSortArticles(uniqueArticles);
    
    // Filter by query (q) if provided and not empty
    let filteredArticles = scoredArticles;
    if (query && query.trim().length > 0) {
      const qLower = query.trim().toLowerCase();
      filteredArticles = scoredArticles.filter((article: any) => {
        const title = (article.title || '').toLowerCase();
        const desc = (article.description || article.summary || '').toLowerCase();
        return title.includes(qLower) || desc.includes(qLower);
      });
    }

    // Final sort: prioritize high-scoring recent articles
    filteredArticles.sort((a: any, b: any) => {
      // Primary sort: by score (highest first)
      if (b.score.relevanceScore !== a.score.relevanceScore) {
        return b.score.relevanceScore - a.score.relevanceScore;
      }
      // Secondary sort: by date (newest first)
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    console.log(`Total unique articles: ${filteredArticles.length} (GNews: ${gnewsArticles.length}, RSS: ${rssArticlesFormatted.length}, GDELT: ${gdeltArticlesFormatted.length}, HN: ${hnArticlesFormatted.length})`);

    const responseData = { 
      articles: filteredArticles,
      _isMockData: false,
      _sources: {
        gnews: gnewsArticles.length,
        rss: rssArticlesFormatted.length,
        gdelt: gdeltArticlesFormatted.length,
        hn: hnArticlesFormatted.length,
        total: filteredArticles.length
      },
      timestamp: new Date().toISOString()
    };

    // Store in memory cache (fastest access)
    memoryCache.set(cacheKey, responseData, CACHE_CONFIG.MEMORY_CACHE_DURATION);

    // Store in database cache (persistent)
    try {
      const expiresAt = new Date(Date.now() + CACHE_CONFIG.DB_CACHE_DURATION);
      await NewsCache.findOneAndUpdate(
        { cacheKey },
        { 
          data: responseData,
          sources: responseData._sources,
          isMockData: false,
          timestamp: new Date(), // Ensure timestamp is set for age calculation
          expiresAt: expiresAt
        },
        { upsert: true, new: true }
      );
      console.log(`✅ Stored in database cache: ${cacheKey} (expires at: ${expiresAt.toISOString()})`);
    } catch (error) {
      console.error('Failed to store in database cache:', error);
    }

    return createCachedResponse(responseData, CACHE_CONFIG.API_CACHE_DURATION);
  } catch (error: any) {
    console.error('Error fetching news in API route:', error);
    return NextResponse.json(mockNewsData);
  }
} 