import { NextResponse } from 'next/server';
import { getCacheStats, memoryCache, invalidateCache } from '@/lib/cacheService';
import NewsCache from '@/models/NewsCache';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    // Get memory cache stats
    const memoryStats = getCacheStats();
    
    // Get database cache stats
    let dbStats = { totalCaches: 0, validCaches: 0, expiredCaches: 0 };
    try {
      await connectDB();
      const dbStatsResult = await NewsCache.getStats();
      if (dbStatsResult.length > 0) {
        dbStats = dbStatsResult[0];
      }
    } catch (error) {
      console.error('Failed to get database cache stats:', error);
    }

    return NextResponse.json({
      memory: {
        size: memoryStats.size,
        keys: memoryStats.keys.slice(0, 10), // Show first 10 keys
        hitRate: memoryStats.hitRate,
      },
      database: dbStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    return NextResponse.json({ error: 'Failed to get cache stats' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pattern = searchParams.get('pattern') || 'all';
    
    if (pattern === 'all') {
      // Clear all memory cache
      memoryCache.clear();
      console.log('Cleared all memory cache');
      
      // Clear all database cache
      try {
        await connectDB();
        await NewsCache.deleteMany({});
        console.log('Cleared all database cache');
      } catch (error) {
        console.error('Failed to clear database cache:', error);
      }
      
      return NextResponse.json({ message: 'All caches cleared' });
    } else {
      // Clear specific pattern
      invalidateCache(pattern);
      console.log(`Cleared cache pattern: ${pattern}`);
      
      // Clear database cache with pattern
      try {
        await connectDB();
        await NewsCache.deleteMany({ cacheKey: { $regex: pattern } });
        console.log(`Cleared database cache pattern: ${pattern}`);
      } catch (error) {
        console.error('Failed to clear database cache pattern:', error);
      }
      
      return NextResponse.json({ message: `Cache pattern '${pattern}' cleared` });
    }
  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 });
  }
}

