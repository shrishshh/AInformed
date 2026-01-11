import { NextResponse } from 'next/server';
import mockNews from '@/data/news.json';
import { fetchAllRSSFeeds, filterRSSArticlesByCategory, convertRSSToNewsFormat } from '@/lib/rssFetcher';
import { getCachedRSSArticles, getCachedGDELTArticles, getCachedHNArticles, getCachedTavilyArticles } from '@/lib/rssCron';
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
      tavily: 0,
      total: mockNews?.length || 0
    },
  timestamp: new Date().toISOString()
};

// Force dynamic rendering to prevent static generation during build
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  let query = searchParams.get('q') || 'AI';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const forceRefresh = searchParams.get('refresh') === 'true'; // Add ?refresh=true to bypass cache
  
  // Category to search query mapping
  const categoryQueryMap: Record<string, string> = {
    'Artificial Intelligence': 'artificial intelligence OR AI OR "generative AI" OR "AI model"',
    'Machine Learning': 'machine learning OR ML OR "supervised learning" OR "unsupervised learning"',
    'Deep Learning': 'deep learning OR "neural networks" OR "neural network" OR "deep neural"',
    'Natural Language Processing': 'natural language processing OR NLP OR "language model" OR LLM OR GPT',
    'Computer Vision': 'computer vision OR "image recognition" OR "object detection" OR CV',
    'Robotics': 'robotics OR robot OR "autonomous robot" OR "robotic automation"',
    'Data Science': 'data science OR "big data" OR "data analytics" OR "predictive analytics"',
    'Cybersecurity': 'cybersecurity OR "AI security" OR "cyber security" OR "threat detection"',
    'Quantum Computing': 'quantum computing OR "quantum AI" OR "quantum machine learning" OR qubit',
    'AI Ethics': 'AI ethics OR "ethical AI" OR "AI bias" OR "responsible AI" OR "AI governance"',
    'Neural Networks': 'neural networks OR "neural network" OR "artificial neural network" OR ANN',
    'Automation': 'automation OR "intelligent automation" OR "AI automation" OR "process automation"',
    'Big Data': 'big data OR "large-scale data" OR "data infrastructure" OR "data warehousing" OR "data lake"',
  };

  // If category is provided, use category-specific query
  if (category) {
    const decodedCategory = decodeURIComponent(category);
    const categoryQuery = categoryQueryMap[decodedCategory];
    if (categoryQuery) {
      query = categoryQuery;
      console.log(`📂 Category filter: ${decodedCategory} → Query: ${query}`);
    } else {
      // Fallback: use category name as query
      query = decodedCategory;
      console.log(`📂 Category filter (fallback): ${decodedCategory}`);
    }
  }
  
  // STRICTER: Expanded blocked queries (consumer/shopping/marketing)
  const blockedQueries = [
    'black friday', 'cyber monday', 'deal', 'deals', 'sale', 'sales',
    'shopping', 'review', 'reviews', 'gadget', 'powerbank', 'airpods',
    'bollywood', 'hollywood', 'movie', 'film', 'actor', 'actress',
    'celebrity', 'music', 'sports', 'weather', 'politics',
    'food', 'travel', 'fashion', 'entertainment', 'gossip'
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
      const cacheTime = existingCache.timestamp || (existingCache as any).createdAt;
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
    // Get cached RSS, GDELT, HN, and Tavily articles first (fast)
    let rssArticlesFormatted = getCachedRSSArticles();
    let gdeltArticlesFormatted = getCachedGDELTArticles();
    let hnArticlesFormatted = getCachedHNArticles(); // Get cached HN
    let tavilyArticlesFormatted = getCachedTavilyArticles(); // Get cached Tavily

    // Fetch from all sources (GNews, RSS, GDELT, HN) in parallel
    // Note: Tavily is updated via scheduled cron, not fetched here
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
      // Filter RSS articles by category if category is provided
      if (category) {
        const decodedCategory = decodeURIComponent(category);
        rssArticlesFormatted = filterRSSArticlesByCategory(rssArticlesFormatted, decodedCategory);
        console.log(`RSS: Filtered to ${rssArticlesFormatted.length} articles for category: ${decodedCategory}`);
      } else {
        console.log(`RSS: Using ${rssArticlesFormatted.length} articles (${rssArticlesFormatted.length === 0 ? 'from cache' : 'fresh fetch'})`);
      }
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

    // Filter Tavily articles by category if category is provided
    if (category && tavilyArticlesFormatted.length > 0) {
      const decodedCategory = decodeURIComponent(category);
      // Tavily articles already have category tags, filter by primary or secondary category
      tavilyArticlesFormatted = tavilyArticlesFormatted.filter((article: any) => {
        const articleCategory = (article.category || '').toLowerCase();
        const decodedCategoryLower = decodedCategory.toLowerCase();
        
        // Check primary category
        if (articleCategory === decodedCategoryLower) {
          return true;
        }
        
        // Check secondary categories
        if (article.secondaryCategories && Array.isArray(article.secondaryCategories)) {
          return article.secondaryCategories.some((cat: string) => 
            cat.toLowerCase() === decodedCategoryLower
          );
        }
        
        return false;
      });
      console.log(`Tavily: Filtered to ${tavilyArticlesFormatted.length} articles for category: ${decodedCategory}`);
    } else {
      console.log(`Tavily: Using ${tavilyArticlesFormatted.length} articles (from cache)`);
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

    // STRICTER: Universal consumer content filter for ALL sources
    const consumerContentKeywords = [
      'black friday', 'cyber monday', 'prime day', 'deal', 'deals', 'discount', 'discounts',
      'sale', 'sales', 'on sale', 'buy now', 'shop', 'shopping', 'purchase', 'price drop',
      'cheap', 'affordable', 'bargain', 'save money', 'best buy', 'best price',
      'product review', 'review', 'reviews', 'unboxing', 'hands-on', 'first impressions',
      'powerbank', 'power bank', 'airpods', 'air pods', 'earbuds', 'headphones',
      'gadget', 'gadgets', 'accessory', 'accessories', 'keychain', 'tool',
      'here\'s why', 'here\'s how', 'earned a permanent spot', 'best gadget',
      'this $', 'under $', 'worth it', 'worth buying', 'should you buy',
      'kindle', 'headset', 'discounted', 'drops to', 'lowest price', 'record-low',
      'vetted by experts', 'best deals', 'tech deals', 'amazon black friday',
      'marketing', 'advertising', 'promotion', 'sponsored', 'advertisement',
      'coffee maker', 'moccamaster', 'huckberry', 'lock-pick'
    ];

    function isConsumerContent(article: any): boolean {
      const title = (article.title || '').toLowerCase();
      const description = (article.description || article.summary || '').toLowerCase();
      const text = `${title} ${description}`;
      
      // AGGRESSIVE: Check for consumer content keywords (case-insensitive, anywhere in text)
      const hasConsumerKeyword = consumerContentKeywords.some(keyword => {
        return text.includes(keyword.toLowerCase());
      });
      
      // AGGRESSIVE: Check for price patterns (e.g., "$12", "under $50", "drops to $")
      const hasPricePattern = /\$\d+|\d+\s*dollars?|under\s*\$\d+|drops?\s*to\s*\$\d+|lowest\s*price|record-low/i.test(text);
      
      // AGGRESSIVE: Check for deal/sale patterns in title
      const titleHasDealPattern = /\b(deal|deals|sale|discount|black friday|cyber monday)\b/i.test(title);
      
      // REJECT if any consumer content indicator found
      return hasConsumerKeyword || hasPricePattern || titleHasDealPattern;
    }

    // Merge and deduplicate articles from all sources (GNews, RSS, GDELT, HN, Tavily)
    let allArticles = [...gnewsArticles, ...rssArticlesFormatted, ...gdeltArticlesFormatted, ...hnArticlesFormatted, ...tavilyArticlesFormatted];
    
    // STRICTER: Filter out consumer content BEFORE deduplication
    allArticles = allArticles.filter(article => !isConsumerContent(article));
    console.log(`🚫 Filtered out consumer content. Remaining articles: ${allArticles.length}`);
    // Deduplicate by URL
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
    
    // STRICTER: Final consumer content check after deduplication (double-check)
    const finalFilteredArticles = uniqueArticles.filter(article => !isConsumerContent(article));
    console.log(`🚫 Final consumer content filter. Remaining: ${finalFilteredArticles.length} (removed ${uniqueArticles.length - finalFilteredArticles.length})`);

    // Score and sort articles by relevance (using final filtered articles)
    let scoredArticles = scoreAndSortArticles(finalFilteredArticles);
    console.log(`📊 After scoring: ${scoredArticles.length} articles passed score thresholds (from ${finalFilteredArticles.length} input articles)`);
    
    // Filter by query (q) if provided and not empty - IMPROVED: semantic matching
    // NOTE: For category queries, the sources already filter by query, so we're more lenient here
    let filteredArticles = scoredArticles;
    if (query && query.trim().length > 0) {
      const qLower = query.trim().toLowerCase();
      
      // Check if this is an OR query (category queries use OR)
      const isORQuery = qLower.includes(' or ') || qLower.includes('"');
      
      if (isORQuery) {
        // Handle OR queries (category queries): Split by OR and check if ANY term matches
        // VERY LENIENT: Since articles already passed consumer content filter and scoring,
        // we just need to check if they're somewhat related to the category
        const orTerms = qLower
          .split(/\s+or\s+/i)
          .map(term => term.replace(/^["']|["']$/g, '').trim()) // Remove quotes
          .filter(term => term.length > 0);
        
        // Extract all individual words from all OR terms for very lenient matching
        const allKeywords = new Set<string>();
        orTerms.forEach(term => {
          const words = term.split(/\s+/).filter(w => w.length >= 2);
          words.forEach(word => allKeywords.add(word.toLowerCase()));
        });
        
        console.log(`🔍 OR Query detected. Terms: ${JSON.stringify(orTerms)}`);
        console.log(`🔍 Extracted keywords: ${Array.from(allKeywords).join(', ')}`);
        console.log(`🔍 Checking ${scoredArticles.length} articles against OR terms...`);
        
        filteredArticles = scoredArticles.filter((article: any) => {
          const title = (article.title || '').toLowerCase();
          const desc = (article.description || article.summary || '').toLowerCase();
          const fullText = `${title} ${desc}`;
          
          // VERY LENIENT: Check if ANY keyword from ANY OR term appears anywhere in the article
          // This is very permissive since articles already passed AI relevance scoring
          const hasAnyKeyword = Array.from(allKeywords).some(keyword => {
            // For short/common keywords (2-3 chars), allow partial match
            if (keyword.length <= 3 || ['ai', 'ml', 'nlp', 'cv', 'it', 'io'].includes(keyword)) {
              return fullText.includes(keyword);
            }
            // For longer keywords, try word boundary match first, then partial
            const exactRegex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (exactRegex.test(fullText)) return true;
            // Fallback to partial match for longer terms
            return fullText.includes(keyword);
          });
          
          // Also check if any complete OR term appears (for phrases like "artificial intelligence")
          const hasCompleteTerm = orTerms.some(term => {
            const cleanTerm = term.replace(/^["']|["']$/g, '').trim();
            // For multi-word terms, check if all words appear (in any order, very lenient)
            const words = cleanTerm.split(/\s+/).filter(w => w.length >= 2);
            if (words.length > 1) {
              // Require at least 50% of words to appear
              const matchedCount = words.filter(word => fullText.includes(word.toLowerCase())).length;
              return matchedCount >= Math.ceil(words.length * 0.5);
            }
            return fullText.includes(cleanTerm);
          });
          
          return hasAnyKeyword || hasCompleteTerm;
        });
        
        console.log(`🔍 OR Query filter: ${filteredArticles.length} articles matched (from ${scoredArticles.length})`);
        
        // FALLBACK: If category query filtered out all articles, be even more lenient
        // This can happen if the category terms don't match article wording
        if (filteredArticles.length === 0 && category) {
          console.log(`⚠️ Category query filtered out all articles. Using fallback: accepting all scored articles.`);
          filteredArticles = scoredArticles; // Accept all articles that passed scoring
        }
      } else {
        // Regular query: use existing logic but make it less strict
        const queryExpansions: Record<string, string[]> = {
          'ai': ['artificial intelligence', 'machine learning', 'ml', 'ai', 'neural network', 'deep learning'],
          'artificial intelligence': ['ai', 'artificial intelligence', 'machine learning', 'ml'],
          'machine learning': ['ml', 'machine learning', 'deep learning', 'neural network', 'ai'],
          'chatgpt': ['chatgpt', 'gpt', 'openai', 'llm', 'large language model'],
          'gpt': ['gpt', 'chatgpt', 'openai', 'llm', 'large language model'],
          'openai': ['openai', 'chatgpt', 'gpt', 'llm'],
          'tech': ['technology', 'tech', 'software', 'hardware', 'innovation'],
          'technology': ['tech', 'technology', 'software', 'hardware', 'innovation'],
          'startup': ['startup', 'startups', 'company', 'venture', 'funding'],
          'software': ['software', 'app', 'application', 'platform', 'code', 'programming'],
          'hardware': ['hardware', 'chip', 'processor', 'semiconductor', 'device'],
        };
        
        // Get query terms and their expansions
        const queryTerms = [qLower];
        if (queryExpansions[qLower]) {
          queryTerms.push(...queryExpansions[qLower]);
        }
        
        // Split query into individual words (minimum 2 chars - more lenient)
        const queryWords = qLower.split(/\s+/).filter(w => w.length >= 2);
        
        filteredArticles = scoredArticles.filter((article: any) => {
          const title = (article.title || '').toLowerCase();
          const desc = (article.description || article.summary || '').toLowerCase();
          const fullText = `${title} ${desc}`;
          
          // LESS STRICT: Check if any query term matches (word boundary or partial)
          const hasMatch = queryTerms.some(term => {
            // Try exact word boundary match first
            const exactRegex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (exactRegex.test(fullText)) return true;
            
            // Fallback: partial match for longer terms (3+ chars)
            if (term.length >= 3) {
              return fullText.includes(term);
            }
            return false;
          });
          
          if (!hasMatch) return false;
          
          // LESS STRICT: For multi-word queries, require at least 30% of words to match (was 50%)
          if (queryWords.length > 1) {
            const matchedWords = queryWords.filter(word => {
              if (word.length < 2) return false;
              const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
              return regex.test(fullText);
            });
            const matchRatio = matchedWords.length / queryWords.length;
            return matchRatio >= 0.3; // At least 30% of words must match (was 50%)
          }
          
          return true;
        });
      }
      console.log(`🔍 After query filtering: ${filteredArticles.length} articles match query "${query}" (from ${scoredArticles.length} scored articles)`);
    }

    // Final sort: prioritize newest articles first
    filteredArticles.sort((a: any, b: any) => {
      // Primary sort: by date (newest first)
      const dateA = new Date(a.publishedAt || 0).getTime();
      const dateB = new Date(b.publishedAt || 0).getTime();
      if (dateB !== dateA) {
        return dateB - dateA;
      }
      // Secondary sort: by score (highest first) - tiebreaker for same date
      return (b.score?.relevanceScore || 0) - (a.score?.relevanceScore || 0);
    });

    console.log(`Total unique articles: ${filteredArticles.length} (GNews: ${gnewsArticles.length}, RSS: ${rssArticlesFormatted.length}, GDELT: ${gdeltArticlesFormatted.length}, HN: ${hnArticlesFormatted.length}, Tavily: ${tavilyArticlesFormatted.length})`);

    const responseData = { 
      articles: filteredArticles,
      _isMockData: false,
      _sources: {
        gnews: gnewsArticles.length,
        rss: rssArticlesFormatted.length,
        gdelt: gdeltArticlesFormatted.length,
        hn: hnArticlesFormatted.length,
        tavily: tavilyArticlesFormatted.length,
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