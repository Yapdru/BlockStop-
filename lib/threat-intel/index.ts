// Threat Intelligence System - Central Export Index
// Import commonly used components from this file

// Core managers
export { feedManager } from './feed-manager';
export { feedScheduler } from './feed-scheduler';
export { cacheManager } from './cache-manager';
export { rateLimiter, retryWithBackoff } from './rate-limiter';

// Analysis engines
export { correlationEngine } from './correlation-engine';
export { iocMatcher } from './ioc-matcher';
export { campaignDetector } from './campaign-detector';
export { attributionEngine } from './attribution-engine';
export { threatClassifier } from './classifier';

// ML Models
export { threatPredictor } from './ml/threat-predictor';
export { anomalyDetector } from './ml/anomaly-detector';
export { zeroDayDetector } from './ml/zero-day-detector';

// Feed integrations
export { abuseCHFeed } from './feed-integrations/abuse-ch';
export { otxFeed } from './feed-integrations/otx';
export { virusTotalFeed } from './feed-integrations/virustotal';
export { phishTankFeed } from './feed-integrations/phishtank';
export { urlhausFeed } from './feed-integrations/urlhaus';
export { shodanFeed } from './feed-integrations/shodan';

// Types
export type {
  IOC,
  ThreatFeed,
  ThreatCorrelation,
  IOCRelationship,
  MLThreatPrediction,
  AnomalyDetectionResult,
  ZeroDayIndicator,
  Campaign,
  ThreatActor,
  FeedUpdateResult,
  MLModelMetadata,
  CacheEntry,
  RateLimitConfig,
} from './types';

// Utilities
export {
  validateIOC,
  detectIOCType,
  generateIOCId,
  calculateRiskScore,
  getThreatLevel,
  extractDomain,
  extractHost,
  formatDate,
  formatDuration,
  batchArray,
  normalizeString,
  isRecent,
  deduplicateIOCs,
  mergeIOCs,
  formatIOC,
  getIOCColor,
} from './utils';

// Configuration
export {
  FEED_CONFIG,
  ML_CONFIG,
  CACHE_CONFIG,
  CORRELATION_CONFIG,
  SCHEDULER_CONFIG,
  API_CONFIG,
  getFeedConfig,
  getMLConfig,
} from './config';

// Initialization
export {
  initializeThreatIntel,
  shutdownThreatIntel,
  healthCheckThreatIntel,
} from './init';
