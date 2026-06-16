// Threat Intelligence System Initialization
// Single entry point for initializing all threat intel components

import { feedManager } from './feed-manager';
import { feedScheduler } from './feed-scheduler';
import { attributionEngine } from './attribution-engine';
import { threatPredictor } from './ml/threat-predictor';
import { anomalyDetector } from './ml/anomaly-detector';
import { FEED_CONFIG } from './config';

/**
 * Initialize all threat intelligence components
 * Call this once on application startup
 */
export async function initializeThreatIntel(): Promise<{
  success: boolean;
  components: string[];
  errors?: string[];
}> {
  console.log('[ThreatIntel] Initializing threat intelligence system...');

  const components: string[] = [];
  const errors: string[] = [];

  try {
    // Initialize feed manager
    console.log('[ThreatIntel] Initializing feed manager...');
    await feedManager.initialize();
    components.push('feed-manager');

    // Register feeds
    console.log('[ThreatIntel] Registering threat feeds...');
    for (const [key, config] of Object.entries(FEED_CONFIG)) {
      if (config.enabled) {
        await feedManager.registerFeed({
          id: key,
          ...config,
        });
      }
    }

    // Start feed scheduler
    console.log('[ThreatIntel] Starting feed scheduler...');
    await feedScheduler.start();
    components.push('scheduler');

    // Initialize attribution engine
    console.log('[ThreatIntel] Initializing attribution engine...');
    await attributionEngine.initialize();
    components.push('attribution-engine');

    // Initialize ML models
    console.log('[ThreatIntel] Initializing ML models...');
    await threatPredictor.initialize();
    components.push('threat-predictor');

    await anomalyDetector.initialize();
    components.push('anomaly-detector');

    console.log('[ThreatIntel] ✓ Initialization complete');

    return {
      success: true,
      components,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ThreatIntel] Initialization error:', errorMsg);

    errors.push(errorMsg);

    // Return partial success if some components initialized
    return {
      success: components.length > 0,
      components,
      errors,
    };
  }
}

/**
 * Shutdown all threat intelligence components
 * Call this on application shutdown
 */
export async function shutdownThreatIntel(): Promise<void> {
  console.log('[ThreatIntel] Shutting down threat intelligence system...');

  try {
    await feedScheduler.stop();
    await feedManager.destroy();
    threatPredictor.destroy();

    console.log('[ThreatIntel] ✓ Shutdown complete');
  } catch (error) {
    console.error('[ThreatIntel] Shutdown error:', error);
  }
}

/**
 * Health check for threat intel system
 */
export async function healthCheckThreatIntel(): Promise<{
  healthy: boolean;
  status: Record<string, unknown>;
}> {
  const status: Record<string, unknown> = {};

  try {
    // Check scheduler
    const schedulerStatus = feedScheduler.getStatus();
    status.scheduler = schedulerStatus;

    // Check feed stats
    const stats = await feedManager.getIndicatorStats();
    status.indicators = stats;

    // Check models
    status.threatPredictorMeta = threatPredictor.getMetadata();

    const healthy = schedulerStatus.running && stats.totalIndicators > 0;

    return {
      healthy,
      status,
    };
  } catch (error) {
    return {
      healthy: false,
      status: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Export commonly used components for easy access
 */
export {
  feedManager,
  feedScheduler,
  attributionEngine,
  threatPredictor,
  anomalyDetector,
  correlationEngine,
  campaignDetector,
  threatClassifier,
  iocMatcher,
  zeroDayDetector,
  cacheManager,
  rateLimiter,
} from './index';

// Re-export types
export type { IOC, ThreatFeed, Campaign, ThreatActor, MLThreatPrediction } from './types';
