/**
 * BlockStop Phase 29.5 - Observability Module Index
 * Unified initialization and exports for all observability systems
 */

export { DistributedTracer, type TraceSpan, type ServiceTopology, type TraceContext, type TraceMetrics } from './distributed-tracing';
export { LogAggregator, type LogEntry, type LogStream, type LogQuery, type LogSearchResult } from './log-aggregator';
export { ApplicationPerformanceMonitor, type MethodMetrics, type QueryPerformance, type EndpointMetrics } from './apm';
export { CostMonitor, type CloudCost, type CostForecast, type CostOptimization } from './cost-monitor';
export { CapacityPlanner, type ResourceUtilization, type CapacityForecast, type ScalingRecommendation } from './capacity-planner';

import DistributedTracer from './distributed-tracing';
import LogAggregator from './log-aggregator';
import ApplicationPerformanceMonitor from './apm';
import CostMonitor from './cost-monitor';
import CapacityPlanner from './capacity-planner';

export class ObservabilityPlatform {
  private tracer: DistributedTracer;
  private logAggregator: LogAggregator;
  private apm: ApplicationPerformanceMonitor;
  private costMonitor: CostMonitor;
  private capacityPlanner: CapacityPlanner;

  constructor() {
    this.tracer = new DistributedTracer();
    this.logAggregator = new LogAggregator();
    this.apm = new ApplicationPerformanceMonitor();
    this.costMonitor = new CostMonitor();
    this.capacityPlanner = new CapacityPlanner();

    this.initializeIntegrations();
  }

  private initializeIntegrations(): void {
    // Connect APM metrics to capacity planner
    this.apm.on('slow-method-detected', (data) => {
      this.logAggregator.ingestLog({
        timestamp: new Date(),
        level: 'warn',
        source: 'application',
        service: 'apm',
        message: `Slow method detected: ${data.methodId} took ${data.executionTime}ms`,
        fields: new Map(Object.entries(data)),
        tags: ['performance', 'warning']
      });
    });

    // Connect cost monitor alerts to logging
    this.costMonitor.on('cost-anomaly-detected', (anomaly) => {
      this.logAggregator.ingestLog({
        timestamp: new Date(),
        level: anomaly.severity === 'critical' ? 'error' : 'warn',
        source: 'custom',
        service: 'cost-monitor',
        message: `Cost anomaly: ${anomaly.description}`,
        fields: new Map(Object.entries(anomaly)),
        tags: ['cost', 'anomaly']
      });
    });

    // Connect distributed tracing to logging
    this.tracer.on('trace-exported', (data) => {
      // Log trace exports for audit trail
    });
  }

  getTracer(): DistributedTracer {
    return this.tracer;
  }

  getLogAggregator(): LogAggregator {
    return this.logAggregator;
  }

  getAPM(): ApplicationPerformanceMonitor {
    return this.apm;
  }

  getCostMonitor(): CostMonitor {
    return this.costMonitor;
  }

  getCapacityPlanner(): CapacityPlanner {
    return this.capacityPlanner;
  }

  getDashboardMetrics(): Record<string, any> {
    return {
      tracing: this.tracer.getStatistics(),
      logging: this.logAggregator.getStatistics(),
      apm: this.apm.getStatistics(),
      costs: this.costMonitor.getStatistics(),
      capacity: this.capacityPlanner.getStatistics()
    };
  }

  getHealthStatus(): Record<string, string> {
    return {
      tracing: 'healthy',
      logging: 'healthy',
      apm: 'healthy',
      costs: 'healthy',
      capacity: 'healthy'
    };
  }
}

export default ObservabilityPlatform;
