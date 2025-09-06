import { NextResponse } from 'next/server';

// Cache configuration
export const CACHE_CONFIG = {
  // Memory cache duration (5 minutes)
  MEMORY_CACHE_DURATION: 5 * 60 * 1000,
  // Database cache duration (1 hour)
  DB_CACHE_DURATION: 60 * 60 * 1000,
  // API response cache duration (10 minutes)
  API_CACHE_DURATION: 10 * 60 * 1000,
  // Stale-while-revalidate window (5 minutes)
  STALE_WHILE_REVALIDATE: 5 * 60 * 1000,
};

// In-memory cache store
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = CACHE_CONFIG.MEMORY_CACHE_DURATION): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global memory cache instance
export const memoryCache = new MemoryCache();

// Cache key generator
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  return `${prefix}:${sortedParams}`;
}

// Cache headers for Next.js responses
export function getCacheHeaders(
  maxAge: number = CACHE_CONFIG.API_CACHE_DURATION,
  staleWhileRevalidate: number = CACHE_CONFIG.STALE_WHILE_REVALIDATE
): Record<string, string> {
  if (process.env.NODE_ENV === 'development') {
    return {
      'Cache-Control': 'no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
  }

  return {
    'Cache-Control': `public, max-age=${Math.floor(maxAge / 1000)}, stale-while-revalidate=${Math.floor(staleWhileRevalidate / 1000)}`,
    'Vary': 'Accept-Encoding, Accept-Language',
    'ETag': `"${Date.now()}"`,
  };
}

// Cache response wrapper
export function createCachedResponse(
  data: any,
  maxAge: number = CACHE_CONFIG.API_CACHE_DURATION,
  staleWhileRevalidate: number = CACHE_CONFIG.STALE_WHILE_REVALIDATE
): NextResponse {
  return NextResponse.json(data, {
    headers: getCacheHeaders(maxAge, staleWhileRevalidate),
  });
}

// Cache middleware for API routes
export function withCache<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // Check memory cache first
  const cached = memoryCache.get(key);
  if (cached) {
    console.log(`Cache hit for key: ${key}`);
    return Promise.resolve(cached);
  }

  // Fetch fresh data
  console.log(`Cache miss for key: ${key}, fetching fresh data...`);
  return fetcher().then(data => {
    memoryCache.set(key, data, ttl);
    return data;
  });
}

// Cache invalidation
export function invalidateCache(pattern: string): void {
  const keys = Array.from(memoryCache['cache'].keys());
  keys.forEach(key => {
    if (key.includes(pattern)) {
      memoryCache.delete(key);
    }
  });
}

// Cache statistics
export function getCacheStats(): {
  size: number;
  keys: string[];
  hitRate: number;
} {
  const keys = Array.from(memoryCache['cache'].keys());
  return {
    size: memoryCache.size(),
    keys,
    hitRate: 0, // TODO: Implement hit rate tracking
  };
}

