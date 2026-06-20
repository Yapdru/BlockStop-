/**
 * Web Vitals Tracker
 * Tracks Core Web Vitals: LCP, FCP, CLS, FID, TTFB, INP
 * Sends metrics to analytics backend
 */

import { EventEmitter } from 'events';

export enum VitalType {
  LCP = 'LCP', // Largest Contentful Paint
  FCP = 'FCP', // First Contentful Paint
  CLS = 'CLS', // Cumulative Layout Shift
  FID = 'FID', // First Input Delay
  TTFB = 'TTFB', // Time to First Byte
  INP = 'INP', // Interaction to Next Paint
}

export interface Vital {
  type: VitalType;
  value: number;
  rating: 'good' | 'needsImprovement' | 'poor';
  timestamp: number;
  url?: string;
  userAgent?: string;
}

export interface VitalThresholds {
  [VitalType.LCP]: { good: number; poor: number };
  [VitalType.FCP]: { good: number; poor: number };
  [VitalType.CLS]: { good: number; poor: number };
  [VitalType.FID]: { good: number; poor: number };
  [VitalType.TTFB]: { good: number; poor: number };
  [VitalType.INP]: { good: number; poor: number };
}

export interface VitalMetrics {
  lcp?: Vital;
  fcp?: Vital;
  cls?: Vital;
  fid?: Vital;
  ttfb?: Vital;
  inp?: Vital;
  resourceTiming?: PerformanceResourceTiming[];
  navigationTiming?: PerformanceNavigationTiming;
}

export class WebVitalsTracker extends EventEmitter {
  private vitals: Map<VitalType, Vital> = new Map();
  private metrics: VitalMetrics = {};
  private thresholds: VitalThresholds = {
    [VitalType.LCP]: { good: 2500, poor: 4000 },
    [VitalType.FCP]: { good: 1800, poor: 3000 },
    [VitalType.CLS]: { good: 0.1, poor: 0.25 },
    [VitalType.FID]: { good: 100, poor: 300 },
    [VitalType.TTFB]: { good: 600, poor: 1800 },
    [VitalType.INP]: { good: 200, poor: 500 },
  };
  private observers: Map<string, PerformanceObserver> = new Map();
  private isInitialized = false;
  private sessionId: string;
  private pageLoadTime: number;

  constructor(sessionId?: string) {
    super();
    this.sessionId = sessionId || this.generateSessionId();
    this.pageLoadTime = Date.now();
  }

  /**
   * Initialize web vitals tracking
   */
  async initialize(): Promise<void> {
    try {
      if (!this.isSupported()) {
        this.emit('warn', { message: 'Web Vitals API not supported' });
        return;
      }

      // Track navigation timing (TTFB)
      this.trackNavigationTiming();

      // Track paint timing (FCP)
      this.trackPaintTiming();

      // Track largest contentful paint (LCP)
      this.trackLCP();

      // Track cumulative layout shift (CLS)
      this.trackCLS();

      // Track first input delay (FID)
      this.trackFID();

      // Track interaction to next paint (INP)
      this.trackINP();

      // Track resource timing
      this.trackResourceTiming();

      this.isInitialized = true;
      this.emit('initialized', { sessionId: this.sessionId });
    } catch (error) {
      this.emit('error', { error, context: 'initialize' });
    }
  }

  /**
   * Get all tracked vitals
   */
  getVitals(): Map<VitalType, Vital> {
    return new Map(this.vitals);
  }

  /**
   * Get specific vital
   */
  getVital(type: VitalType): Vital | undefined {
    return this.vitals.get(type);
  }

  /**
   * Get all metrics
   */
  getMetrics(): VitalMetrics {
    return { ...this.metrics };
  }

  /**
   * Get vitals summary for reporting
   */
  getSummary(): {
    score: number;
    rating: string;
    vitals: Record<string, any>;
  } {
    const vitals = Array.from(this.vitals.values());

    // Calculate simple score (0-100)
    let score = 100;
    for (const vital of vitals) {
      if (vital.rating === 'poor') {
        score -= 30;
      } else if (vital.rating === 'needsImprovement') {
        score -= 15;
      }
    }

    score = Math.max(0, Math.min(100, score));

    const rating =
      score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'poor';

    const vitalsData: Record<string, any> = {};
    for (const [type, vital] of this.vitals.entries()) {
      vitalsData[type] = {
        value: vital.value,
        rating: vital.rating,
      };
    }

    return { score, rating, vitals: vitalsData };
  }

  /**
   * Check if any vital is in poor rating
   */
  hasPoorVitals(): boolean {
    return Array.from(this.vitals.values()).some((v) => v.rating === 'poor');
  }

  /**
   * Set custom thresholds
   */
  setThresholds(thresholds: Partial<VitalThresholds>): void {
    Object.assign(this.thresholds, thresholds);
    this.emit('thresholds:updated');
  }

  /**
   * Report vitals to backend
   */
  async reportVitals(endpoint: string, callback?: (vitals: any) => Promise<void>): Promise<void> {
    try {
      const summary = this.getSummary();
      const payload = {
        sessionId: this.sessionId,
        timestamp: Date.now(),
        pageLoadTime: this.pageLoadTime,
        ...summary,
        metrics: this.getMetrics(),
      };

      if (callback) {
        await callback(payload);
      } else {
        // Default fetch to endpoint
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      this.emit('reported', { sessionId: this.sessionId });
    } catch (error) {
      this.emit('error', { error, context: 'reportVitals' });
    }
  }

  /**
   * Private: Track navigation timing
   */
  private trackNavigationTiming(): void {
    try {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (perfData) {
        const ttfb = perfData.responseStart - perfData.fetchStart;
        const vital = this.createVital(VitalType.TTFB, ttfb);

        this.vitals.set(VitalType.TTFB, vital);
        this.metrics.navigationTiming = perfData;

        this.emit('vital:updated', vital);
      }
    } catch (error) {
      this.emit('warn', { message: 'Failed to track navigation timing', error });
    }
  }

  /**
   * Private: Track paint timing
   */
  private trackPaintTiming(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            const vital = this.createVital(VitalType.FCP, entry.startTime);
            this.vitals.set(VitalType.FCP, vital);
            this.emit('vital:updated', vital);
          }
        }
      });

      observer.observe({ entryTypes: ['paint'] });
      this.observers.set('paint', observer);
    } catch (error) {
      this.emit('warn', { message: 'Failed to track paint timing', error });
    }
  }

  /**
   * Private: Track largest contentful paint
   */
  private trackLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];

        const vital = this.createVital(VitalType.LCP, lastEntry.startTime);
        this.vitals.set(VitalType.LCP, vital);
        this.emit('vital:updated', vital);
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', observer);
    } catch (error) {
      this.emit('warn', { message: 'Failed to track LCP', error });
    }
  }

  /**
   * Private: Track cumulative layout shift
   */
  private trackCLS(): void {
    try {
      let clsValue = 0;

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }

        const vital = this.createVital(VitalType.CLS, clsValue);
        this.vitals.set(VitalType.CLS, vital);
        this.emit('vital:updated', vital);
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', observer);
    } catch (error) {
      this.emit('warn', { message: 'Failed to track CLS', error });
    }
  }

  /**
   * Private: Track first input delay
   */
  private trackFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entry = list.getEntries()[0];
        const fid = (entry as any).processingStart - entry.startTime;

        const vital = this.createVital(VitalType.FID, fid);
        this.vitals.set(VitalType.FID, vital);
        this.emit('vital:updated', vital);
      });

      observer.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', observer);
    } catch (error) {
      this.emit('warn', { message: 'Failed to track FID', error });
    }
  }

  /**
   * Private: Track interaction to next paint
   */
  private trackINP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const entry = entries[entries.length - 1];
          const inp = (entry as any).duration;

          const vital = this.createVital(VitalType.INP, inp);
          this.vitals.set(VitalType.INP, vital);
          this.emit('vital:updated', vital);
        }
      });

      observer.observe({ entryTypes: ['event'] });
      this.observers.set('inp', observer);
    } catch (error) {
      this.emit('warn', { message: 'Failed to track INP', error });
    }
  }

  /**
   * Private: Track resource timing
   */
  private trackResourceTiming(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[];
        this.metrics.resourceTiming = entries;
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', observer);
    } catch (error) {
      this.emit('warn', { message: 'Failed to track resource timing', error });
    }
  }

  /**
   * Private: Create vital object with rating
   */
  private createVital(type: VitalType, value: number): Vital {
    const thresholds = this.thresholds[type];
    let rating: 'good' | 'needsImprovement' | 'poor';

    if (value <= thresholds.good) {
      rating = 'good';
    } else if (value <= thresholds.poor) {
      rating = 'needsImprovement';
    } else {
      rating = 'poor';
    }

    return {
      type,
      value,
      rating,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };
  }

  /**
   * Private: Check if API is supported
   */
  private isSupported(): boolean {
    return typeof window !== 'undefined' && 'PerformanceObserver' in window;
  }

  /**
   * Private: Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup and stop tracking
   */
  destroy(): void {
    try {
      for (const observer of this.observers.values()) {
        observer.disconnect();
      }

      this.observers.clear();
      this.vitals.clear();
      this.removeAllListeners();

      this.emit('destroyed');
    } catch (error) {
      this.emit('error', { error, context: 'destroy' });
    }
  }
}
