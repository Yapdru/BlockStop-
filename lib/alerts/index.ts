/**
 * BlockStop Real-Time Alerting Module
 * Exports for alerts functionality
 */

export {
  RealTimeAlertsManager,
  AlertPriority,
  AlertStatus,
  AlertCategory,
  type Alert,
  type AlertPayload,
  type ThreatSignature,
  type AlertDeduplicationConfig,
  type AlertAggregation,
  type AlertHistoryEntry,
  type WebSocketAlert,
  type AlertAnalytics,
  type RealTimeAlertsConfig,
  type EscalationStrategy,
  type EscalationEvent,
} from './real-time-alerts';

export default RealTimeAlertsManager;
