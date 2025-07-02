import { useCallback, useMemo, useRef } from 'react';
import { SecureLogger } from './security';

// Debounce hook for API calls
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

// Memoized date formatter
export const useDateFormatter = () => {
  return useMemo(() => {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    
    return (dateString: string): string => {
      try {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return 'now';
        if (diffInSeconds < 3600) return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
        if (diffInSeconds < 86400) return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
        if (diffInSeconds < 2592000) return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
        
        return date.toLocaleDateString();
      } catch {
        return 'Unknown date';
      }
    };
  }, []);
};

// Number formatter with caching
export const useNumberFormatter = () => {
  return useMemo(() => {
    const cache = new Map<number, string>();
    
    return (num: number): string => {
      if (cache.has(num)) return cache.get(num)!;
      
      let result: string;
      if (num >= 1000000) {
        result = `${(num / 1000000).toFixed(1)}M`;
      } else if (num >= 1000) {
        result = `${(num / 1000).toFixed(1)}K`;
      } else {
        result = num.toString();
      }
      
      cache.set(num, result);
      return result;
    };
  }, []);
};

// Virtual scrolling helper
export const useVirtualScrolling = (
  itemHeight: number,
  containerHeight: number,
  itemCount: number
) => {
  return useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // Buffer
    
    return {
      itemHeight,
      visibleCount,
      getVisibleRange: (scrollTop: number) => {
        const start = Math.floor(scrollTop / itemHeight);
        const end = Math.min(start + visibleCount, itemCount);
        return { start, end };
      }
    };
  }, [itemHeight, containerHeight, itemCount]);
};

export interface PerformanceMetrics {
  name: string;
  duration: number;
  timestamp: number;
  memory?: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private timers: Map<string, number> = new Map();

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  start(name: string): void {
    this.timers.set(name, performance.now());
  }

  end(name: string): PerformanceMetrics | null {
    const startTime = this.timers.get(name);
    if (!startTime) {
      SecureLogger.warn(`Timer "${name}" was not started`);
      return null;
    }

    const duration = performance.now() - startTime;
    const metric: PerformanceMetrics = {
      name,
      duration,
      timestamp: Date.now(),
      memory: (performance as any).memory?.usedJSHeapSize || undefined
    };

    // Store metric
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(metric);

    // Cleanup timer
    this.timers.delete(name);

    return metric;
  }

  measure<T>(name: string, fn: () => T): T;
  measure<T>(name: string, fn: () => Promise<T>): Promise<T>;
  measure<T>(name: string, fn: () => T | Promise<T>): T | Promise<T> {
    this.start(name);
    
    try {
      const result = fn();
      
      if (result instanceof Promise) {
        return result.finally(() => {
          this.end(name);
        });
      } else {
        this.end(name);
        return result;
      }
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  getMetrics(name?: string): PerformanceMetrics[] {
    if (name) {
      return this.metrics.get(name) || [];
    }
    
    const allMetrics: PerformanceMetrics[] = [];
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics);
    }
    return allMetrics.sort((a, b) => b.timestamp - a.timestamp);
  }

  getAverageTime(name: string): number {
    const metrics = this.metrics.get(name) || [];
    if (metrics.length === 0) return 0;
    
    const total = metrics.reduce((sum, metric) => sum + metric.duration, 0);
    return total / metrics.length;
  }

  clearMetrics(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }

  logSummary(): void {
    const summary = new Map<string, { count: number; avg: number; latest: number }>();
    
    for (const [name, metrics] of this.metrics.entries()) {
      const count = metrics.length;
      const avg = this.getAverageTime(name);
      const latest = metrics[metrics.length - 1]?.duration || 0;
      
      summary.set(name, { count, avg, latest });
    }

    SecureLogger.log('Performance Summary:', Object.fromEntries(summary));
  }

  logLatest(name: string): void {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) {
      SecureLogger.warn(`No metrics found for "${name}"`);
      return;
    }

    const latest = metrics[metrics.length - 1];
    SecureLogger.log(`${name}: ${latest.duration.toFixed(2)}ms`);
  }
}

// Performance monitoring
export const usePerformanceMonitor = () => {
  const measureComponent = useCallback((name: string) => {
    return {
      start: () => performance.mark(`${name}-start`),
      end: () => {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        
        // Log in development
        if (process.env.NODE_ENV === 'development') {
          const entries = performance.getEntriesByName(name);
          const latest = entries[entries.length - 1];
          console.log(`🔍 ${name}: ${latest.duration.toFixed(2)}ms`);
        }
      }
    };
  }, []);
  
  return { measureComponent };
}; 