/**
 * Performance monitoring utilities
 */

export function measurePerformance(name: string, fn: () => void) {
  const start = performance.now();
  fn();
  const end = performance.now();
  const duration = end - start;
  
  console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  
  // Log to telemetry if available
  if (duration > 100) {
    console.warn(`[Performance] Slow operation detected: ${name}`);
  }
  
  return duration;
}

export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;
  
  console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
  
  if (duration > 1000) {
    console.warn(`[Performance] Slow async operation: ${name}`);
  }
  
  return result;
}

export function reportWebVitals() {
  if (typeof window === 'undefined') return;

  // Report Core Web Vitals
  if ('PerformanceObserver' in window) {
    try {
      // LCP - Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('[WebVitals] LCP:', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // FID - First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          console.log('[WebVitals] FID:', fid);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // CLS - Cumulative Layout Shift
      let clsScore = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsScore += (entry as any).value;
          }
        }
        console.log('[WebVitals] CLS:', clsScore);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.error('[WebVitals] Error setting up observers:', e);
    }
  }
}
