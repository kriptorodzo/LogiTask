'use client';

import React, { Suspense, lazy, ReactNode, ComponentType } from 'react';
import { SkeletonCard } from '@/components/Skeleton';

/**
 * Lazy load a component with loading fallback
 */
export function lazyWithFallback<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  Fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyWrapper(props: any) {
    return (
      <Suspense fallback={Fallback || <SkeletonCard />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Preload component on hover
 */
export function preloadOnHover<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  let loaded = false;
  
  return () => {
    if (!loaded) {
      loaded = true;
      importFn();
    }
  };
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [options.root, options.rootMargin, options.threshold]);

  return { ref, isIntersecting };
}

/**
 * Lazy load when in view
 */
export function LazyInView({ 
  children, 
  threshold = 0.1 
}: { 
  children: React.ReactNode;
  threshold?: number;
}) {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold,
    rootMargin: '100px',
  });

  return (
    <div ref={ref}>
      {isIntersecting ? children : <SkeletonCard />}
    </div>
  );
}