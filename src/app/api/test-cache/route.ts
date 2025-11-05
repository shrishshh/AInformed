import { NextResponse } from 'next/server';
import { alphaVantageCache } from '@/lib/alphaVantageCache';

const SYMBOLS = ['NVDA', 'GOOGL', 'MSFT'];

export async function GET() {
  try {
    // Test cache functionality
    const cachedStocks = await alphaVantageCache.getCachedStocks(SYMBOLS);
    
    if (cachedStocks) {
      return NextResponse.json({
        status: 'cache_hit',
        message: 'Data retrieved from cache',
        data: cachedStocks,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        status: 'cache_miss',
        message: 'No cached data available - would fetch from API',
        symbols: SYMBOLS,
        cacheInfo: {
          memoryTTL: '30 minutes',
          dbTTL: '2 hours',
          nextFetch: 'Would call Alpha Vantage API'
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    return NextResponse.json({
      error: 'Cache test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
