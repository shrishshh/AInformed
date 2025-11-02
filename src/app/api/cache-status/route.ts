import { NextResponse } from 'next/server';
import { alphaVantageCache } from '../../../../lib/alphaVantageCache';
import { memoryCache, getCacheStats } from '../../../../lib/cacheService';

export async function GET() {
  try {
    // Get Alpha Vantage cache stats
    const alphaVantageStats = await alphaVantageCache.getCacheStats();
    
    // Get general cache stats
    const generalStats = getCacheStats();
    
    // Check if Alpha Vantage cache has any data
    const hasAlphaVantageCache = alphaVantageStats.totalCached > 0;
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      alphaVantage: {
        ...alphaVantageStats,
        hasData: hasAlphaVantageCache,
        status: hasAlphaVantageCache ? 'cached' : 'no_data'
      },
      general: {
        memoryCache: {
          size: generalStats.size,
          keys: generalStats.keys.slice(0, 5) // Show first 5 keys
        }
      },
      recommendations: {
        rateLimit: hasAlphaVantageCache 
          ? 'Cache is working! Data will be served from cache for 30 minutes.'
          : 'Alpha Vantage API rate limit reached. Cache will populate once limit resets.',
        nextSteps: hasAlphaVantageCache
          ? 'Your caching system is working perfectly!'
          : 'Wait for API limit reset (midnight UTC) or upgrade to premium plan'
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get cache status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
