import { NextResponse } from 'next/server';
import axios from 'axios';
import { createCachedResponse, generateCacheKey } from '@/lib/cacheService';
import { alphaVantageCache, ALPHA_VANTAGE_CACHE_CONFIG, StockData } from '@/lib/alphaVantageCache';
import NewsCache from '@/models/NewsCache';
import connectDB from '@/lib/mongodb';

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const SYMBOLS = ['NVDA', 'GOOGL', 'MSFT', 'AMD', 'META', 'TSLA', 'ARM', 'SNOW'];

// Helper to check if Alpha Vantage response indicates rate limit
function isRateLimited(responseData: any): boolean {
  if (!responseData) return false;
  
  // Alpha Vantage returns an "Information" field when rate limited
  const info = responseData['Information'] || responseData['Note'] || '';
  const infoStr = typeof info === 'string' ? info.toLowerCase() : '';
  
  return infoStr.includes('rate limit') || 
         infoStr.includes('api call frequency') ||
         infoStr.includes('thank you for using alpha vantage');
}

// Helper to get stale cache data (even if expired)
async function getStaleCacheData(): Promise<StockData[] | null> {
  try {
    const cacheKey = generateCacheKey('stocks', { symbols: SYMBOLS.join(',') });
    await connectDB();
    
    // Get cache even if expired
    const staleCache = await NewsCache.findOne({ cacheKey });
    if (staleCache && staleCache.data && Array.isArray(staleCache.data) && staleCache.data.length > 0) {
      console.log('📦 Returning stale cache data (API rate limited)');
      return staleCache.data;
    }
  } catch (error) {
    console.error('Error getting stale cache:', error);
  }
  return null;
}

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json({ error: 'Alpha Vantage API key not set' }, { status: 500 });
  }

  try {
    // Try to get cached data first
    const cachedStocks = await alphaVantageCache.getCachedStocks(SYMBOLS);
    if (cachedStocks) {
      console.log('📈 Returning cached stock data');
      return createCachedResponse(cachedStocks, ALPHA_VANTAGE_CACHE_CONFIG.API_TTL);
    }

    // Fetch fresh data from Alpha Vantage API
    console.log('🔄 Fetching fresh stock data from Alpha Vantage API...');
    const results = await Promise.all(
      SYMBOLS.map(async (symbol) => {
        try {
          const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
          const response = await axios.get(url);
          const data = response.data;
          
          // Check for rate limit error
          if (isRateLimited(data)) {
            console.warn(`Rate limit detected for ${symbol}:`, data['Information'] || data['Note']);
            return null; // Signal rate limit
          }
          
          const quoteData = data['Global Quote'];
          if (!quoteData || !quoteData['05. price']) {
            console.warn(`No valid data for symbol: ${symbol}`, data);
            return null;
          }
          
          return {
            symbol: symbol,
            price: parseFloat(quoteData['05. price']),
            change: parseFloat(quoteData['09. change']),
            percentChange: quoteData['10. change percent'],
            lastUpdated: new Date().toISOString(),
          } as StockData;
        } catch (symbolError) {
          console.error(`Error fetching data for ${symbol}:`, symbolError);
          return null;
        }
      })
    );
    
    // Filter out any nulls (invalid/missing data)
    const validResults = results.filter(Boolean) as StockData[];
    
    // Check if we got rate limited (no valid results)
    if (validResults.length === 0) {
      console.warn('No valid stock data received from Alpha Vantage API - likely rate limited');
      
      // Try to get stale cache data as fallback
      const staleCache = await getStaleCacheData();
      if (staleCache) {
        console.log('📦 Returning stale cache data due to rate limit');
        return createCachedResponse(staleCache, ALPHA_VANTAGE_CACHE_CONFIG.API_TTL);
      }
      
      // No cache available at all - return error
      return NextResponse.json({ 
        error: 'Alpha Vantage API rate limit exceeded',
        message: 'Daily API limit of 25 requests reached. No cached data available.',
        fallbackData: SYMBOLS.map(symbol => ({
          symbol,
          price: 0,
          change: 0,
          percentChange: '0.00%',
          lastUpdated: new Date().toISOString(),
          status: 'rate_limited'
        })),
        cacheInfo: {
          nextReset: 'Daily limit resets at midnight UTC',
          cacheDuration: '30 minutes',
          recommendation: 'Try again in a few hours or upgrade to premium plan'
        }
      }, { status: 503 });
    }
    
    // Cache the results
    await alphaVantageCache.cacheStocks(SYMBOLS, validResults);
    
    console.log(`✅ Successfully fetched and cached ${validResults.length} stock prices`);
    return createCachedResponse(validResults, ALPHA_VANTAGE_CACHE_CONFIG.API_TTL);
    
  } catch (error) {
    console.error('Alpha Vantage API error:', error);
    
    // On error, try to return stale cache
    const staleCache = await getStaleCacheData();
    if (staleCache) {
      console.log('📦 Returning stale cache data due to error');
      return createCachedResponse(staleCache, ALPHA_VANTAGE_CACHE_CONFIG.API_TTL);
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch stock prices',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 