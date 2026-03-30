'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface PersistedState {
  [key: string]: any;
}

/**
 * Custom hook for persisting page state across navigation
 * Saves filters, search, tabs, pagination, date range to sessionStorage
 */
export function useStatePersistence(
  key: string,
  defaultState?: Partial<PersistedState>
) {
  const storageKey = `logistate_${key}`;
  const isMounted = useRef(true);

  // Load state from sessionStorage
  const loadState = useCallback((): Partial<PersistedState> => {
    if (typeof window === 'undefined') {
      return defaultState || {};
    }
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        return { ...defaultState, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load persisted state:', e);
    }
    return defaultState || {};
  }, [storageKey, defaultState]);

  // Save state to sessionStorage
  const saveState = useCallback((state: Partial<PersistedState>) => {
    if (!isMounted.current || typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save persisted state:', e);
    }
  }, [storageKey]);

  // Clear persisted state
  const clearState = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(storageKey);
    } catch (e) {
      console.error('Failed to clear persisted state:', e);
    }
  }, [storageKey]);

  // Check if this is a back navigation
  const isBackNavigation = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    return window.performance?.getEntriesByType('navigation')
      .some((nav: any) => nav.type === 'back_forward') || false;
  }, []);

  // Mark as mounted on mount, unmounted on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    loadState,
    saveState,
    clearState,
    isBackNavigation,
  };
}

/**
 * Hook for debouncing value changes - SSR safe version
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
