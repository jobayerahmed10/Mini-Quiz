// Simple in-memory & sessionStorage cache with TTL for Supabase queries to minimize egress and requests

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

/**
 * Get cached data if valid within ttlMs (default 5 minutes)
 */
export function getCache<T>(key: string, ttlMs: number = 300000): T | null {
  const now = Date.now();
  
  // 1. Check in-memory Map
  const entry = memoryCache.get(key);
  if (entry && now - entry.timestamp < ttlMs) {
    return entry.data as T;
  }

  // 2. Fallback to sessionStorage
  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(`app_cache_${key}`);
      if (raw) {
        const parsed: CacheEntry<T> = JSON.parse(raw);
        if (now - parsed.timestamp < ttlMs) {
          memoryCache.set(key, parsed);
          return parsed.data;
        } else {
          sessionStorage.removeItem(`app_cache_${key}`);
        }
      }
    } catch {}
  }

  return null;
}

/**
 * Save data to in-memory cache and sessionStorage
 */
export function setCache<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = { data, timestamp: Date.now() };
  memoryCache.set(key, entry);

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`app_cache_${key}`, JSON.stringify(entry));
    } catch {}
  }
}

/**
 * Invalidate specific cache keys or all cache entries
 */
export function invalidateCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    memoryCache.clear();
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          if (k && k.startsWith('app_cache_')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => sessionStorage.removeItem(k));
      } catch {}
    }
    return;
  }

  for (const k of memoryCache.keys()) {
    if (k.startsWith(keyPrefix)) {
      memoryCache.delete(k);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith(`app_cache_${keyPrefix}`)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch {}
  }
}
