/**
 * Simple in-memory cache with TTL
 */
class SimpleCache<T> {
  private cache = new Map<string, { data: T; expiresAt: number }>();
  private maxSize = 100;

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

// Global cache instances by namespace
const caches = new Map<string, SimpleCache<any>>();

export function getCache<T>(namespace: string): SimpleCache<T> {
  if (!caches.has(namespace)) {
    caches.set(namespace, new SimpleCache<T>());
  }
  return caches.get(namespace)!;
}

/**
 * Cache decorator for async functions
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    namespace?: string;
    ttl?: number;
    keyGenerator?: (...args: Parameters<T>) => string;
  } = {}
): T {
  const namespace = options.namespace || 'default';
  const ttl = options.ttl || 5 * 60 * 1000; // 5 minutes
  const keyGenerator = options.keyGenerator || ((...args) => JSON.stringify(args));

  return (async (...args: Parameters<T>) => {
    const cache = getCache(namespace);
    const key = keyGenerator(...args);
    
    const cachedData = cache.get(key);
    if (cachedData !== null) {
      return cachedData;
    }

    const result = await fn(...args);
    cache.set(key, result, ttl);
    return result;
  }) as T;
}

/**
 * Prefetch and cache data
 */
export async function prefetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 5 * 60 * 1000
): Promise<T> {
  const cache = getCache<T>('prefetch');
  const cachedData = cache.get(key);
  
  if (cachedData !== null) {
    return cachedData;
  }

  const data = await fetcher();
  cache.set(key, data, ttl);
  return data;
}

/**
 * Invalidate cache entries
 */
export function invalidateCache(namespace?: string): void {
  if (namespace) {
    const cache = caches.get(namespace);
    if (cache) cache.clear();
  } else {
    caches.forEach(cache => cache.clear());
  }
}

export { SimpleCache };