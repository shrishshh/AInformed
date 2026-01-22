// RSS & GDELT & HN & Tavily & Perplexity Cron Job Setup
// This module handles scheduled RSS, GDELT, HN, Tavily, and Perplexity fetching for better performance

import { fetchAllRSSFeeds, convertRSSToNewsFormat } from './rssFetcher';
import { fetchGDELTArticles, fetchGDELTArticlesAlternative, convertGDELTToNewsFormat } from './gdeltFetcher';
import { fetchHNStories, fetchHNStoriesAlternative, convertHNToNewsFormat } from './hnFetcher';
import { fetchTavilyArticles, convertTavilyToNewsFormat, getGroupForHour } from './tavilyFetcher';
import { fetchPerplexityArticles, convertPerplexityToNewsFormat, getPerplexityGroupForHour, PERPLEXITY_GROUP_QUERIES } from './perplexityFetcher';
import { memoryCache } from './cacheService';
import connectDB from './mongodb';
import NewsCache from '@/models/NewsCache';
import TavilyArticle from '@/models/TavilyArticle';
import PerplexityArticle from '@/models/PerplexityArticle';

// In-memory cache for RSS, GDELT, HN, Tavily, and Perplexity articles (in production, use Redis or database)
let rssCache: any[] = [];
let gdeltCache: any[] = [];
let hnCache: any[] = []; // Added HN cache
let tavilyCache: any[] = []; // Added Tavily cache
let perplexityCache: any[] = []; // Added Perplexity cache
let lastFetchTime: Date | null = null;
let lastTavilyFetch: Date | null = null;
let lastTavilyGroup: string | null = null;
let lastPerplexityFetch: Date | null = null;
let lastPerplexityGroup: string | null = null;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes (for RSS/GDELT/HN)
const TAVILY_CACHE_DURATION = 60 * 60 * 1000; // 1 hour (for Tavily)
const PERPLEXITY_CACHE_DURATION = 60 * 60 * 1000; // 1 hour (for Perplexity)
let isUpdating = false; // Lock to prevent concurrent updates
let updateAllPromise: Promise<void> | null = null; // Shared promise for in-flight updates
let isUpdatingTavily = false; // Separate lock for Tavily to prevent concurrent updates
let isUpdatingPerplexity = false; // Separate lock for Perplexity to prevent concurrent updates

// Fetch RSS articles and cache them
export async function updateRSSCache(): Promise<void> {
  try {
    console.log('Updating RSS cache...');
    const rssArticles = await fetchAllRSSFeeds();
    const formattedArticles = convertRSSToNewsFormat(rssArticles);
    rssCache = formattedArticles;
    console.log(`RSS cache updated: ${formattedArticles.length} articles`);
  } catch (error) {
    console.error('Failed to update RSS cache:', error);
  }
}

// Fetch GDELT articles and cache them
export async function updateGDELTCache(): Promise<void> {
  try {
    console.log('Updating GDELT cache...');

    // Try main GDELT method first
    let gdeltArticles = await fetchGDELTArticles();

    // If main method fails, try alternative
    if (gdeltArticles.length === 0) {
      console.log('Main GDELT method failed, trying alternative...');
      gdeltArticles = await fetchGDELTArticlesAlternative();
    }

    const formattedArticles = convertGDELTToNewsFormat(gdeltArticles);
    gdeltCache = formattedArticles;
    console.log(`GDELT cache updated: ${formattedArticles.length} articles`);
  } catch (error) {
    console.error('Failed to update GDELT cache:', error);
  }
}

// Fetch HN articles and cache them
export async function updateHNCache(): Promise<void> {
  try {
    console.log('Updating HN cache...');

    // Try main HN method first
    let hnStories = await fetchHNStories();

    // If main method fails, try alternative
    if (hnStories.length === 0) {
      console.log('Main HN method failed, trying alternative...');
      hnStories = await fetchHNStoriesAlternative();
    }

    const formattedStories = convertHNToNewsFormat(hnStories);
    hnCache = formattedStories;
    console.log(`HN cache updated: ${formattedStories.length} stories`);
  } catch (error) {
    console.error('Failed to update HN cache:', error);
  }
}

// Combined fetch for RSS, GDELT, and HN
export async function updateAllCaches(): Promise<void> {
  // Prevent concurrent updates
  if (isUpdating) {
    console.log('Cache update already in progress, skipping...');
    // If an update is already running, return the in-flight promise so callers can await it.
    return updateAllPromise ?? Promise.resolve();
  }
  
  isUpdating = true;
  updateAllPromise = (async () => {
  try {
    console.log('Updating all caches (RSS + GDELT + HN)...');

    // Fetch all three sources in parallel
    const [rssArticles, gdeltArticles, hnStories] = await Promise.allSettled([
      fetchAllRSSFeeds(),
      fetchGDELTArticles(), // Initial GDELT fetch
      fetchHNStories() // Initial HN fetch
    ]);

    // Process RSS results
    if (rssArticles.status === 'fulfilled') {
      const formattedRSS = convertRSSToNewsFormat(rssArticles.value);
      rssCache = formattedRSS;
      console.log(`RSS cache updated: ${formattedRSS.length} articles`);
    } else {
      console.error('RSS fetch failed:', rssArticles.reason);
    }

    // Process GDELT results
    if (gdeltArticles.status === 'fulfilled') {
      const formattedGDELT = convertGDELTToNewsFormat(gdeltArticles.value);
      gdeltCache = formattedGDELT;
      console.log(`GDELT cache updated: ${formattedGDELT.length} articles`);
    } else {
      console.error('GDELT fetch failed, trying alternative method...');
      // Try alternative GDELT method
      try {
        const alternativeGDELT = await fetchGDELTArticlesAlternative();
        const formattedAlternative = convertGDELTToNewsFormat(alternativeGDELT);
        gdeltCache = formattedAlternative;
        console.log(`GDELT alternative cache updated: ${formattedAlternative.length} articles`);
      } catch (altError) {
        console.error('GDELT alternative also failed:', altError);
        gdeltCache = [];
      }
    }

    // Process HN results
    if (hnStories.status === 'fulfilled') {
      const formattedHN = convertHNToNewsFormat(hnStories.value);
      hnCache = formattedHN;
      console.log(`HN cache updated: ${formattedHN.length} stories`);
    } else {
      console.error('HN fetch failed, trying alternative method...');
      // Try alternative HN method
      try {
        const alternativeHN = await fetchHNStoriesAlternative();
        const formattedAlternative = convertHNToNewsFormat(alternativeHN);
        hnCache = formattedAlternative;
        console.log(`HN alternative cache updated: ${formattedAlternative.length} stories`);
      } catch (altError) {
        console.error('HN alternative also failed:', altError);
        hnCache = [];
      }
    }

    lastFetchTime = new Date();
  } catch (error) {
    console.error('Failed to update all caches:', error);
  } finally {
    isUpdating = false; // Always reset the flag
    updateAllPromise = null;
  }
  })();

  return updateAllPromise;
}

// Get cached RSS articles
export function getCachedRSSArticles(): any[] {
  if (!lastFetchTime || Date.now() - lastFetchTime.getTime() > CACHE_DURATION) {
    updateAllCaches().catch(console.error);
  }
  return rssCache;
}

// Get cached GDELT articles
export function getCachedGDELTArticles(): any[] {
  if (!lastFetchTime || Date.now() - lastFetchTime.getTime() > CACHE_DURATION) {
    updateAllCaches().catch(console.error);
  }
  return gdeltCache;
}

// Get cached HN articles
export function getCachedHNArticles(): any[] {
  if (!lastFetchTime || Date.now() - lastFetchTime.getTime() > CACHE_DURATION) {
    updateAllCaches().catch(console.error);
  }
  return hnCache;
}

// Get cached Tavily articles
export function getCachedTavilyArticles(): any[] {
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.VERCEL;
  
  // In development/localhost: lazy-load if cache is empty or expired
  if (isDevelopment) {
    if (tavilyCache.length === 0 || !lastTavilyFetch) {
      // Cache is empty - trigger fetch in background (don't block)
      updateTavilyCache().catch(console.error);
      return []; // Return empty for now, will be populated on next request
    }
    
    const cacheAge = Date.now() - lastTavilyFetch.getTime();
    if (cacheAge >= TAVILY_CACHE_DURATION) {
      // Cache expired - refresh in background
      updateTavilyCache().catch(console.error);
      // Still return stale cache for this request
      return tavilyCache;
    }
  }
  
  // Production or cache is fresh: return cached articles
  if (tavilyCache.length > 0 && lastTavilyFetch) {
    const cacheAge = Date.now() - lastTavilyFetch.getTime();
    if (cacheAge < TAVILY_CACHE_DURATION) {
      return tavilyCache;
    }
  }
  
  // Cache expired or empty - return empty (will be updated by cron in production)
  return [];
}

// Fetch Tavily articles and cache them (called by cron job)
export async function updateTavilyCache(groupName?: string): Promise<void> {
  // Prevent concurrent updates
  if (isUpdatingTavily) {
    console.log('Tavily cache update already in progress, skipping...');
    return;
  }

  // Check if we already fetched this group recently (idempotency - within last 55 minutes)
  if (lastTavilyFetch && lastTavilyGroup) {
    const timeSinceLastFetch = Date.now() - lastTavilyFetch.getTime();
    const groupForCurrentHour = groupName || getGroupForHour();
    
    if (timeSinceLastFetch < 55 * 60 * 1000 && lastTavilyGroup === groupForCurrentHour) {
      console.log(`Tavily: Skipping ${groupForCurrentHour} - already fetched ${Math.round(timeSinceLastFetch / 60000)} minutes ago`);
      return;
    }
  }

  isUpdatingTavily = true;
  try {
    const targetGroup = groupName || getGroupForHour();
    console.log(`🔄 Updating Tavily cache for group: ${targetGroup}...`);

    const tavilyArticles = await fetchTavilyArticles(targetGroup);
    
    if (tavilyArticles.length > 0) {
      const formattedArticles = convertTavilyToNewsFormat(tavilyArticles);
      tavilyCache = formattedArticles;
      lastTavilyFetch = new Date();
      lastTavilyGroup = targetGroup;
      console.log(`✅ Tavily cache updated: ${formattedArticles.length} articles (group: ${targetGroup})`);

      // Persist Tavily articles so they survive restarts
      try {
        await connectDB();

        for (const article of tavilyCache) {
          try {
            await TavilyArticle.findOneAndUpdate(
              { url: article.url },
              {
                title: article.title,
                description: article.description ?? article.summary ?? '',
                source: (article.source && (article.source.name || article.source)) || 'Tavily',
                publishedAt: article.publishedAt ? new Date(article.publishedAt) : new Date(),
                group: targetGroup,
              },
              { upsert: true, setDefaultsOnInsert: true }
            );
          } catch (e) {
            console.error('⚠️ Failed to upsert Tavily article:', article.url, e);
          }
        }

        console.log(`💾 Persisted ${tavilyCache.length} Tavily articles to MongoDB`);
      } catch (dbError) {
        console.error('⚠️ Failed to persist Tavily articles to MongoDB:', dbError);
      }
      
      // Invalidate database and memory caches that might be stale
      // This ensures the next /api/ai-news call includes fresh Tavily articles
      try {
        await connectDB();
        
        // Delete all news caches that were created before this Tavily update
        const deleteResult = await NewsCache.deleteMany({
          cacheKey: { $regex: /^news:/ }
        });
        
        if (deleteResult.deletedCount > 0) {
          console.log(`🗑️ Invalidated ${deleteResult.deletedCount} stale database caches after Tavily update`);
        }
        
        // Also clear in-memory cache keys that start with "news:"
        // Access the private cache map (same pattern as invalidateCache function in cacheService)
        const cacheMap = (memoryCache as any)['cache'] as Map<string, any>;
        if (cacheMap) {
          const keysToDelete: string[] = [];
          cacheMap.forEach((value, key) => {
            if (key.startsWith('news:')) {
              keysToDelete.push(key);
            }
          });
          
          keysToDelete.forEach(key => {
            memoryCache.delete(key);
          });
          
          if (keysToDelete.length > 0) {
            console.log(`🗑️ Cleared ${keysToDelete.length} stale memory cache entries after Tavily update`);
          }
        }
      } catch (cacheError) {
        console.error('⚠️ Failed to invalidate caches after Tavily update:', cacheError);
        // Don't throw - Tavily update succeeded, cache invalidation is best-effort
      }
    } else {
      console.warn(`⚠️ Tavily: No articles fetched for group ${targetGroup}`);
      // Don't clear cache if fetch fails - keep previous cache
    }
  } catch (error) {
    console.error('❌ Failed to update Tavily cache:', error);
    // Don't throw - fail gracefully, keep previous cache
  } finally {
    isUpdatingTavily = false;
  }
}

// Get cached Perplexity articles
export function getCachedPerplexityArticles(): any[] {
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.VERCEL;
  
  // If update is in progress, return existing cache (if any) instead of empty
  if (isUpdatingPerplexity && perplexityCache.length > 0) {
    return perplexityCache;
  }
  
  // In development/localhost: lazy-load if cache is empty or expired
  if (isDevelopment) {
    if (perplexityCache.length === 0 || !lastPerplexityFetch) {
      // Cache is empty - trigger fetch in background (don't block)
      updatePerplexityCache().catch(console.error);
      return []; // Return empty for now, will be populated on next request
    }
    
    const cacheAge = Date.now() - lastPerplexityFetch.getTime();
    if (cacheAge >= PERPLEXITY_CACHE_DURATION) {
      // Cache expired - refresh in background
      updatePerplexityCache().catch(console.error);
      // Still return stale cache for this request
      return perplexityCache;
    }
  }
  
  // Production or cache is fresh: return cached articles
  if (perplexityCache.length > 0 && lastPerplexityFetch) {
    const cacheAge = Date.now() - lastPerplexityFetch.getTime();
    if (cacheAge < PERPLEXITY_CACHE_DURATION) {
      return perplexityCache;
    }
  }
  
  // Cache expired or empty - return empty (will be updated by cron in production)
  return [];
}

// Fetch Perplexity articles and cache them (called by cron job)
export async function updatePerplexityCache(groupName?: string): Promise<void> {
  // Prevent concurrent updates
  if (isUpdatingPerplexity) {
    console.log('Perplexity cache update already in progress, skipping...');
    return;
  }

  const isAllGroups = groupName === '__ALL__';

  // Check if we already fetched this group recently (idempotency - within last 55 minutes)
  // NOTE: For the special "__ALL__" mode (dev refresh), we intentionally skip this check
  // so that each refresh can fetch fresh data across all categories.
  if (!isAllGroups && lastPerplexityFetch && lastPerplexityGroup) {
    const timeSinceLastFetch = Date.now() - lastPerplexityFetch.getTime();
    const groupForCurrentHour = groupName || getPerplexityGroupForHour();
    
    if (timeSinceLastFetch < 55 * 60 * 1000 && lastPerplexityGroup === groupForCurrentHour) {
      console.log(`Perplexity: Skipping ${groupForCurrentHour} - already fetched ${Math.round(timeSinceLastFetch / 60000)} minutes ago`);
      return;
    }
  }

  isUpdatingPerplexity = true;
  try {
    let targetGroup = groupName || getPerplexityGroupForHour();
    let perplexityArticles: any[] = [];

    if (isAllGroups) {
      const allGroups = Object.keys(PERPLEXITY_GROUP_QUERIES);
      targetGroup = 'ALL_GROUPS';
      console.log(`🔄 Updating Perplexity cache for ALL groups: ${allGroups.join(', ')}...`);

      const results = await Promise.all(
        allGroups.map(group => fetchPerplexityArticles(group))
      );

      perplexityArticles = results.flat();
    } else {
      console.log(`🔄 Updating Perplexity cache for group: ${targetGroup}...`);
      perplexityArticles = await fetchPerplexityArticles(targetGroup);
    }

    if (perplexityArticles.length > 0) {
      const formattedArticles = convertPerplexityToNewsFormat(perplexityArticles);
      
      // Merge new Perplexity articles with existing cache so older items stay available
      const existing = Array.isArray(perplexityCache) ? perplexityCache : [];
      const combined = [...formattedArticles, ...existing]; // newest first

      // Deduplicate by URL (fallback to title)
      const seen = new Set<string>();
      const deduped = combined.filter((article: any) => {
        const key = (article.url || article.title || '').toLowerCase().trim();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Optional safety cap: keep only the most recent N Perplexity articles
      const MAX_PERPLEXITY_ARTICLES = 200;
      perplexityCache = deduped.slice(0, MAX_PERPLEXITY_ARTICLES);

      lastPerplexityFetch = new Date();
      lastPerplexityGroup = targetGroup;
      console.log(
        `✅ Perplexity cache updated: ${formattedArticles.length} new (group: ${targetGroup}), ` +
        `total stored: ${perplexityCache.length} articles`
      );

      // Persist Perplexity articles so they survive restarts
      try {
        await connectDB();

        for (const article of perplexityCache) {
          try {
            await PerplexityArticle.findOneAndUpdate(
              { url: article.url },
              {
                title: article.title,
                description: article.description ?? article.summary ?? '',
                source: (article.source && (article.source.name || article.source)) || 'Perplexity',
                publishedAt: article.publishedAt ? new Date(article.publishedAt) : new Date(),
                group: targetGroup,
              },
              { upsert: true, setDefaultsOnInsert: true }
            );
          } catch (e) {
            console.error('⚠️ Failed to upsert Perplexity article:', article.url, e);
          }
        }

        console.log(`💾 Persisted ${perplexityCache.length} Perplexity articles to MongoDB`);
      } catch (dbError) {
        console.error('⚠️ Failed to persist Perplexity articles to MongoDB:', dbError);
      }
      
      // Invalidate database and memory caches that might be stale
      // This ensures the next /api/ai-news call includes fresh Perplexity articles
      try {
        await connectDB();
        
        // Delete all news caches that were created before this Perplexity update
        const deleteResult = await NewsCache.deleteMany({
          cacheKey: { $regex: /^news:/ }
        });
        
        if (deleteResult.deletedCount > 0) {
          console.log(`🗑️ Invalidated ${deleteResult.deletedCount} stale database caches after Perplexity update`);
        }
        
        // Also clear in-memory cache keys that start with "news:"
        const cacheMap = (memoryCache as any)['cache'] as Map<string, any>;
        if (cacheMap) {
          const keysToDelete: string[] = [];
          cacheMap.forEach((value, key) => {
            if (key.startsWith('news:')) {
              keysToDelete.push(key);
            }
          });
          
          keysToDelete.forEach(key => {
            memoryCache.delete(key);
          });
          
          if (keysToDelete.length > 0) {
            console.log(`🗑️ Cleared ${keysToDelete.length} stale memory cache entries after Perplexity update`);
          }
        }
      } catch (cacheError) {
        console.error('⚠️ Failed to invalidate caches after Perplexity update:', cacheError);
        // Don't throw - Perplexity update succeeded, cache invalidation is best-effort
      }
    } else {
      console.warn(`⚠️ Perplexity: No articles fetched for group ${targetGroup}`);
      // Don't clear cache if fetch fails - keep previous cache
    }
  } catch (error) {
    console.error('❌ Failed to update Perplexity cache:', error);
    // Don't throw - fail gracefully, keep previous cache
  } finally {
    isUpdatingPerplexity = false;
  }
}

// Get all cached articles (RSS + GDELT + HN + Tavily + Perplexity)
export function getAllCachedArticles(): any[] {
  if (!lastFetchTime || Date.now() - lastFetchTime.getTime() > CACHE_DURATION) {
    updateAllCaches().catch(console.error);
  }
  return [...rssCache, ...gdeltCache, ...hnCache, ...getCachedTavilyArticles(), ...getCachedPerplexityArticles()];
}

// Force refresh all caches
export async function refreshAllCaches(): Promise<{ rss: any[], gdelt: any[], hn: any[], tavily: any[], perplexity: any[] }> {
  await updateAllCaches();
  await updateTavilyCache();
  await updatePerplexityCache();
  return { rss: rssCache, gdelt: gdeltCache, hn: hnCache, tavily: tavilyCache, perplexity: perplexityCache };
}

// Initialize cache on module load
updateAllCaches().catch(console.error);

// Restore Tavily and Perplexity caches from MongoDB on startup so news survives restarts
(async () => {
  try {
    await connectDB();

    // Restore Tavily cache (latest 200 by published date)
    const tavilyDocs = await TavilyArticle.find({})
      .sort({ publishedAt: -1 })
      .limit(200)
      .lean()
      .exec();

    if (tavilyDocs.length > 0) {
      tavilyCache = tavilyDocs;
      lastTavilyFetch = new Date();
      lastTavilyGroup = 'restored-from-db';
      console.log(
        `🔁 Restored ${tavilyDocs.length} Tavily articles from MongoDB into in-memory cache on startup`
      );
    } else {
      console.log('🔁 No Tavily articles found in MongoDB on startup');
    }

    // Restore Perplexity cache (latest 200 by published date)
    const perplexityDocs = await PerplexityArticle.find({})
      .sort({ publishedAt: -1 })
      .limit(200)
      .lean()
      .exec();

    if (perplexityDocs.length > 0) {
      perplexityCache = perplexityDocs;
      lastPerplexityFetch = new Date();
      lastPerplexityGroup = 'restored-from-db';
      console.log(
        `🔁 Restored ${perplexityDocs.length} Perplexity articles from MongoDB into in-memory cache on startup`
      );
    } else {
      console.log('🔁 No Perplexity articles found in MongoDB on startup');
    }
  } catch (err) {
    console.error('⚠️ Failed to restore Tavily/Perplexity caches from MongoDB on startup:', err);
  }
})();