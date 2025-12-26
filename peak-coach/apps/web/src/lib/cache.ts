/**
 * Simple In-Memory Cache with TTL
 * For API response caching and reducing redundant calls
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100; // Maximum cache entries

  /**
   * Get cached data if valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Set data with TTL (in milliseconds)
   */
  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  /**
   * Invalidate specific key or pattern
   */
  invalidate(keyOrPattern: string | RegExp): void {
    if (typeof keyOrPattern === 'string') {
      this.cache.delete(keyOrPattern);
    } else {
      // Invalidate all matching keys
      for (const key of this.cache.keys()) {
        if (keyOrPattern.test(key)) {
          this.cache.delete(key);
        }
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  stats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// Singleton instance
export const cache = new MemoryCache();

// Cache TTL presets
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,       // 1 minute
  MEDIUM: 5 * 60 * 1000,      // 5 minutes
  LONG: 15 * 60 * 1000,       // 15 minutes
  HOUR: 60 * 60 * 1000,       // 1 hour
  DAY: 24 * 60 * 60 * 1000,   // 24 hours
};

// Cache key generators
export const cacheKeys = {
  reviews: (userId: string) => `reviews:${userId}`,
  skills: (userId: string, goalId: string) => `skills:${userId}:${goalId}`,
  books: (userId: string) => `books:${userId}`,
  actions: (userId: string) => `actions:${userId}`,
  module: (goalId: string, moduleNum: number) => `module:${goalId}:${moduleNum}`,
  userSettings: (userId: string) => `settings:${userId}`,
};

/**
 * Cached fetch wrapper
 * Automatically caches responses
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = CACHE_TTL.MEDIUM
): Promise<T> {
  // Check cache first
  const cached = cache.get<T>(key);
  if (cached) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();
  
  // Cache the result
  cache.set(key, data, ttlMs);
  
  return data;
}

/**
 * React hook helper for optimistic updates
 */
export function createOptimisticUpdate<T>(
  currentData: T,
  optimisticData: T,
  onRollback: () => void
) {
  return {
    optimistic: optimisticData,
    rollback: () => {
      onRollback();
      return currentData;
    },
  };
}

