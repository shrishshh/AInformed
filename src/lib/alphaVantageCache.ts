import { memoryCache, generateCacheKey, CACHE_CONFIG } from './cacheService';
import NewsCache from '../models/NewsCache';
import connectDB from './mongodb';

// Alpha Vantage specific cache configuration
export const ALPHA_VANTAGE_CACHE_CONFIG = {
  // Memory cache duration (30 minutes for stocks)
  MEMORY_TTL: 30 * 60 * 1000,
  // Database cache duration (2 hours for stocks)
  DB_TTL: 2 * 60 * 60 * 1000,
  // API response cache duration (15 minutes)
  API_TTL: 15 * 60 * 1000,
};

export interface StockData {
  symbol: string;
  price: number;
  change: number;
  percentChange: string;
  lastUpdated: string;
}

export class AlphaVantageCache {
  private static instance: AlphaVantageCache;
  
  static getInstance(): AlphaVantageCache {
    if (!AlphaVantageCache.instance) {
      AlphaVantageCache.instance = new AlphaVantageCache();
    }
    return AlphaVantageCache.instance;
  }

  /**
   * Get cached stock data for multiple symbols
   */
  async getCachedStocks(symbols: string[]): Promise<StockData[] | null> {
    const cacheKey = generateCacheKey('stocks', { symbols: symbols.join(',') });
    
    // Check memory cache first
    const memoryCached = memoryCache.get(cacheKey);
    if (memoryCached) {
      console.log(`✅ Memory cache hit for stocks: ${cacheKey}`);
      return memoryCached;
    }

    // Check database cache
    try {
      await connectDB();
      const dbCached = await NewsCache.findValidCache(cacheKey);
      if (dbCached) {
        console.log(`✅ Database cache hit for stocks: ${cacheKey}`);
        // Store in memory cache for faster access
        memoryCache.set(cacheKey, dbCached.data, ALPHA_VANTAGE_CACHE_CONFIG.MEMORY_TTL);
        return dbCached.data;
      }
    } catch (error) {
      console.error('Database cache error for stocks:', error);
    }

    return null;
  }

  /**
   * Cache stock data for multiple symbols
   */
  async cacheStocks(symbols: string[], stockData: StockData[]): Promise<void> {
    const cacheKey = generateCacheKey('stocks', { symbols: symbols.join(',') });
    
    // Store in memory cache
    memoryCache.set(cacheKey, stockData, ALPHA_VANTAGE_CACHE_CONFIG.MEMORY_TTL);
    console.log(`💾 Cached stocks in memory: ${cacheKey}`);

    // Store in database cache
    try {
      await connectDB();
      await NewsCache.findOneAndUpdate(
        { cacheKey },
        {
          cacheKey,
          data: stockData,
          sources: {
            gnews: 0,
            rss: 0,
            gdelt: 0,
            hn: 0,
            alphavantage: stockData.length,
            total: stockData.length,
          },
          isMockData: false,
          timestamp: new Date(),
          expiresAt: new Date(Date.now() + ALPHA_VANTAGE_CACHE_CONFIG.DB_TTL),
        },
        { upsert: true, new: true }
      );
      console.log(`💾 Cached stocks in database: ${cacheKey}`);
    } catch (error) {
      console.error('Failed to cache stocks in database:', error);
    }
  }

  /**
   * Get cache statistics for Alpha Vantage
   */
  async getCacheStats(): Promise<{
    memoryHits: number;
    dbHits: number;
    totalCached: number;
    lastUpdated?: Date;
  }> {
    try {
      await connectDB();
      const stats = await NewsCache.aggregate([
        {
          $match: {
            cacheKey: { $regex: /^stocks:/ },
            expiresAt: { $gt: new Date() }
          }
        },
        {
          $group: {
            _id: null,
            totalCached: { $sum: 1 },
            lastUpdated: { $max: '$timestamp' },
            totalStocks: { $sum: '$sources.alphavantage' }
          }
        }
      ]);

      return {
        memoryHits: 0, // TODO: Implement hit tracking
        dbHits: 0, // TODO: Implement hit tracking
        totalCached: stats[0]?.totalCached || 0,
        lastUpdated: stats[0]?.lastUpdated
      };
    } catch (error) {
      console.error('Failed to get Alpha Vantage cache stats:', error);
      return {
        memoryHits: 0,
        dbHits: 0,
        totalCached: 0
      };
    }
  }

  /**
   * Clear Alpha Vantage cache
   */
  async clearCache(): Promise<void> {
    try {
      // Clear memory cache
      const keys = Array.from(memoryCache['cache'].keys());
      keys.forEach(key => {
        if (key.includes('stocks:')) {
          memoryCache.delete(key);
        }
      });

      // Clear database cache
      await connectDB();
      await NewsCache.deleteMany({ cacheKey: { $regex: /^stocks:/ } });
      
      console.log('🧹 Cleared Alpha Vantage cache');
    } catch (error) {
      console.error('Failed to clear Alpha Vantage cache:', error);
    }
  }

  /**
   * Check if cache is valid and not expired
   */
  isCacheValid(cacheKey: string): boolean {
    const cached = memoryCache.get(cacheKey);
    return cached !== null;
  }
}

export const alphaVantageCache = AlphaVantageCache.getInstance();
