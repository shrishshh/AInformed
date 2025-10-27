import { NextResponse } from 'next/server';
import { 
  generateCacheKey, 
  createCachedResponse, 
  CACHE_CONFIG,
  memoryCache 
} from '@/lib/cacheService';
import NewsCache from '@/models/NewsCache';
import connectDB from '@/lib/mongodb';

const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours for jobs

export async function GET() {
  const cacheKey = generateCacheKey('jobs', { search: 'AI' });
  
  // Try to get from memory cache first
  const memoryCached = memoryCache.get(cacheKey);
  if (memoryCached) {
    console.log(`Memory cache hit for jobs: ${cacheKey}`);
    return createCachedResponse(memoryCached, CACHE_DURATION);
  }

  // Try to get from database cache
  try {
    await connectDB();
    const dbCached = await NewsCache.findValidCache(cacheKey);
    if (dbCached) {
      console.log(`Database cache hit for jobs: ${cacheKey}`);
      memoryCache.set(cacheKey, dbCached.data, CACHE_CONFIG.MEMORY_CACHE_DURATION);
      return createCachedResponse(dbCached.data, CACHE_DURATION);
    }
  } catch (error) {
    console.error('Database cache error for jobs:', error);
  }

  try {
    console.log('Fetching fresh job data from Remotive API...');
    const response = await fetch('https://remotive.com/api/remote-jobs?search=AI', { 
      cache: 'no-store',
      headers: {
        'User-Agent': 'AInformed-News-Platform/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Remotive API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const topJobs = (data.jobs || []).slice(0, 5).map((job: any) => ({
      title: job.title,
      company: job.company_name,
      url: job.url,
    }));

    // Store in memory cache
    memoryCache.set(cacheKey, topJobs, CACHE_CONFIG.MEMORY_CACHE_DURATION);
    
    // Store in database cache
    try {
      await connectDB();
      await NewsCache.findOneAndUpdate(
        { cacheKey },
        {
          cacheKey,
          data: topJobs,
          sources: {
            gnews: 0,
            rss: 0,
            gdelt: 0,
            hn: 0,
            alphavantage: 0,
            remotive: topJobs.length,
            total: topJobs.length,
          },
          isMockData: false,
          timestamp: new Date(),
          expiresAt: new Date(Date.now() + CACHE_DURATION),
        },
        { upsert: true, new: true }
      );
      console.log(`Cached jobs data in database: ${cacheKey}`);
    } catch (dbError) {
      console.error('Failed to cache jobs data in database:', dbError);
    }

    return createCachedResponse(topJobs, CACHE_DURATION);
  } catch (err) {
    console.error('Remotive API error:', err);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
} 