'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Simple caching hook with stale-while-revalidate pattern
 * @param key Cache key
 * @param fetcher Data fetching function
 * @param options Configuration options
 */
export function useSWR<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    /** Refresh interval in ms (default: 30000 = 30s) */
    refreshInterval?: number;
    /** Enable revalidation on focus */
    revalidateOnFocus?: boolean;
    /** Enable revalidation on mount */
    revalidateOnMount?: boolean;
    /** Deduplicate requests */
    dedupe?: boolean;
  } = {}
) {
  const {
    refreshInterval = 30000,
    revalidateOnFocus = true,
    revalidateOnMount = true,
    dedupe = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  const lastFetchRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  const fetch = useCallback(async (force = false) => {
    const now = Date.now();
    const cached = cacheRef.current.get(key);
    
    // Check if cache is still valid (5 minutes)
    const cacheValid = cached && (now - cached.timestamp < 5 * 60 * 1000);
    
    // Deduplicate requests within 1 second
    if (dedupe && !force && now - lastFetchRef.current < 1000) {
      if (cacheValid) {
        setData(cached.data);
        setIsLoading(false);
        return;
      }
    }

    lastFetchRef.current = now;
    setIsValidating(true);

    try {
      const result = await fetcher();
      
      if (isMountedRef.current) {
        cacheRef.current.set(key, { data: result, timestamp: now });
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        // Keep stale data on error
        if (cached) {
          setData(cached.data);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsValidating(false);
      }
    }
  }, [key, fetcher, dedupe]);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (revalidateOnMount) {
      fetch();
    } else {
      const cached = cacheRef.current.get(key);
      if (cached) {
        setData(cached.data);
      }
      setIsLoading(false);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [key, revalidateOnMount]);

  // Refresh interval
  useEffect(() => {
    if (refreshInterval <= 0) return;
    
    const interval = setInterval(() => fetch(true), refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, fetch]);

  // Revalidate on focus
  useEffect(() => {
    if (!revalidateOnFocus) return;
    
    const handleFocus = () => fetch(true);
    window.addEventListener('focus', handleFocus);
    
    return () => window.removeEventListener('focus', handleFocus);
  }, [revalidateOnFocus, fetch]);

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate: () => fetch(true),
  };
}

/**
 * Prefetch data on hover
 */
export function usePrefetch<T>(
  key: string,
  fetcher: () => Promise<T>
) {
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());

  const prefetch = useCallback(async () => {
    const cached = cacheRef.current.get(key);
    if (cached) return cached.data;

    const result = await fetcher();
    cacheRef.current.set(key, { data: result, timestamp: Date.now() });
    return result;
  }, [key, fetcher]);

  return { prefetch };
}

/**
 * Batch multiple fetches
 */
export function useBatchFetch<T extends Record<string, () => Promise<any>>>(
  fetchers: T
) {
  const [data, setData] = useState<{
    [K in keyof T]: Awaited<ReturnType<T[K]>> | null;
  }>;
  const [errors, setErrors] = useState<Record<string, Error>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      setIsLoading(true);
      const results: any = {};
      const errs: Record<string, Error> = {};

      await Promise.allSettled(
        Object.entries(fetchers).map(async ([key, fetcher]) => {
          try {
            results[key] = await fetcher();
          } catch (e) {
            errs[key] = e instanceof Error ? e : new Error('Unknown error');
          }
        })
      );

      setData(results);
      setErrors(errs);
      setIsLoading(false);
    }

    loadAll();
  }, [JSON.stringify(Object.keys(fetchers))]);

  return { data, errors, isLoading };
}