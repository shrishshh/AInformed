import { NextResponse } from 'next/server';
import axios from 'axios';
import { createCachedResponse } from '@/lib/cacheService';
import { alphaVantageCache, ALPHA_VANTAGE_CACHE_CONFIG, StockData } from '@/lib/alphaVantageCache';

const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const SYMBOLS = ['NVDA', 'GOOGL', 'MSFT', 'AMD', 'META', 'TSLA', 'ARM', 'SNOW'];

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
          const data = response.data['Global Quote'];
          
          if (!data || !data['05. price']) {
            console.warn(`No valid data for symbol: ${symbol}`, response.data);
            return null;
          }
          
          return {
            symbol: symbol,
            price: parseFloat(data['05. price']),
            change: parseFloat(data['09. change']),
            percentChange: data['10. change percent'],
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
    
    if (validResults.length === 0) {
      console.warn('No valid stock data received from Alpha Vantage API - likely rate limited');
      
      // Return a fallback response with rate limit information
      return NextResponse.json({ 
        error: 'Alpha Vantage API rate limit exceeded',
        message: 'Daily API limit of 25 requests reached. Data will be cached for 30 minutes once limit resets.',
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
    return NextResponse.json({ 
      error: 'Failed to fetch stock prices',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 