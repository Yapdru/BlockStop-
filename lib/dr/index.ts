/**
 * Disaster Recovery Module
 * Exports failover manager, RTO/RPO manager, geo-redundancy, and chaos tester
 */

export { FailoverManager, type FailoverPolicy, type FailoverNode, type FailoverEvent, type FailoverTrigger } from './failover-manager';
export { RTORPOManager as RTORPOManager, type RTOTarget, type RPOTarget, type BackupPolicy, type BackupJob, type RecoveryTest, type DisasterRecoveryDrill, type RecoveryPlan } from './rto-rpo-manager';
export { ChaosTester, type ChaosScenario, type ChaosTest, type ResilienceMetrics, type ResilienceReport } from './chaos-tester';

// Re-export as default for convenience
import FailoverManager from './failover-manager';
import RTORPOManager from './rto-rpo-manager';
import ChaosTester from './chaos-tester';

export default {
  FailoverManager,
  RTORPOManager,
  ChaosTester,
};
