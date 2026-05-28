import { useCallback, useRef, useState, useEffect } from 'react';

// Debounce hook for search and API calls
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook for scroll events
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now());

  return useCallback(
    ((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }) as T,
    [callback, delay]
  );
};

// Performance monitoring
export const performanceMonitor = {
  startTimer: (label: string) => {
    if (typeof window !== 'undefined') {
      performance.mark(`${label}-start`);
    }
  },
  
  endTimer: (label: string) => {
    if (typeof window !== 'undefined') {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
      const measure = performance.getEntriesByName(label)[0];
      console.log(`${label}: ${measure.duration.toFixed(2)}ms`);
    }
  }
};

// Optimized fetch with caching
const cache = new Map();

export const cachedFetch = async (url: string, options: RequestInit = {}) => {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  // Cache for 5 minutes
  cache.set(cacheKey, data);
  setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);
  
  return data;
};