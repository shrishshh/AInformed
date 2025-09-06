// Simple in-memory cache for immediate testing
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    console.log(`💾 Cached: ${key}`);
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) {
      console.log(`❌ Cache miss: ${key}`);
      return null;
    }

    const now = Date.now();
    if (now - item.timestamp > this.TTL) {
      this.cache.delete(key);
      console.log(`⏰ Cache expired: ${key}`);
      return null;
    }

    console.log(`✅ Cache hit: ${key}`);
    return item.data;
  }

  clear(): void {
    this.cache.clear();
    console.log('🧹 Cache cleared');
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

export const simpleCache = new SimpleCache();

// Cache key generator
export function createCacheKey(params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  return `news:${sortedParams}`;
}

