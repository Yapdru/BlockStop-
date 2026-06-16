// Threat Intelligence Configuration

export const FEED_CONFIG = {
  'abuse-ch': {
    name: 'Abuse.ch',
    type: 'abuse-ch' as const,
    url: 'https://urlhaus-api.abuse.ch/v1',
    updateInterval: 6 * 60 * 60 * 1000, // 6 hours
    enabled: true,
    rateLimit: {
      requests: 60,
      period: 60000,
    },
  },

  'otx': {
    name: 'AlienVault OTX',
    type: 'otx' as const,
    url: 'https://otx.alienvault.com/api/v1',
    updateInterval: 8 * 60 * 60 * 1000, // 8 hours
    enabled: true,
    rateLimit: {
      requests: 120,
      period: 3600000,
    },
  },

  'virustotal': {
    name: 'VirusTotal',
    type: 'virustotal' as const,
    url: 'https://www.virustotal.com/api/v3',
    updateInterval: 12 * 60 * 60 * 1000, // 12 hours
    enabled: true,
    rateLimit: {
      requests: 4,
      period: 60000,
    },
  },

  'phishtank': {
    name: 'PhishTank',
    type: 'phishtank' as const,
    url: 'https://data.phishtank.com/api/v2',
    updateInterval: 4 * 60 * 60 * 1000, // 4 hours
    enabled: true,
    rateLimit: {
      requests: 120,
      period: 3600000,
    },
  },

  'urlhaus': {
    name: 'URLhaus',
    type: 'urlhaus' as const,
    url: 'https://urlhaus-api.abuse.ch/v1',
    updateInterval: 6 * 60 * 60 * 1000, // 6 hours
    enabled: true,
    rateLimit: {
      requests: 60,
      period: 60000,
    },
  },

  'shodan': {
    name: 'Shodan',
    type: 'shodan' as const,
    url: 'https://api.shodan.io',
    updateInterval: 24 * 60 * 60 * 1000, // 24 hours
    enabled: false, // Requires API key
    rateLimit: {
      requests: 1,
      period: 1000,
    },
  },
};

export const ML_CONFIG = {
  threatPredictor: {
    modelVersion: '1.0.0',
    quantized: true,
    batchSize: 32,
    confidenceThreshold: 0.6,
  },

  anomalyDetector: {
    numTrees: 100,
    maxDepth: 8,
    anomalyThreshold: 0.6,
  },

  zeroDayDetector: {
    suspiciousPatternsThreshold: 0.7,
    noveltyThreshold: 14, // days
  },

  classifier: {
    classes: [
      'malware',
      'phishing',
      'c2',
      'ransomware',
      'apt',
      'data-exfiltration',
      'exploit',
      'botnet',
    ],
    minConfidence: 0.5,
  },
};

export const CACHE_CONFIG = {
  ttl: {
    indicators: 1800000, // 30 minutes
    predictions: 3600000, // 1 hour
    correlations: 1800000, // 30 minutes
    campaigns: 3600000, // 1 hour
    actors: 3600000, // 1 hour
  },

  maxSize: {
    indicators: 10000,
    predictions: 5000,
    correlations: 1000,
  },
};

export const CORRELATION_CONFIG = {
  minStrength: 50,
  maxDepth: 3,
  timeWindow: 30 * 24 * 60 * 60 * 1000, // 30 days
};

export const SCHEDULER_CONFIG = {
  masterCheckInterval: 3600000, // 1 hour
  gracefulShutdownTimeout: 30000, // 30 seconds
  maxRetries: 3,
  retryBackoff: 1000, // 1 second
};

export const API_CONFIG = {
  batchLimit: 100,
  queryLimit: 50,
  searchTimeout: 30000, // 30 seconds
  rateLimit: {
    requests: 100,
    period: 60000,
  },
};

export function getFeedConfig(feedType: string) {
  return FEED_CONFIG[feedType as keyof typeof FEED_CONFIG];
}

export function getMLConfig(modelType: string) {
  return ML_CONFIG[modelType as keyof typeof ML_CONFIG];
}
