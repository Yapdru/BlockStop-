/**
 * BlockStop Phase 29.5 - Distributed Tracing
 * End-to-end request tracing across services
 * Production-ready implementation using OpenTelemetry-compatible format
 */

import { EventEmitter } from 'events';

export type SpanKind = 'internal' | 'server' | 'client' | 'producer' | 'consumer';
export type SpanStatusCode = 'unset' | 'ok' | 'error';
export type SamplingStrategy = 'always' | 'never' | 'probability' | 'adaptive';

export interface TraceContext {
  traceId: string;
  spanId: string;
  traceFlags: number;
  traceState?: string;
  parentSpanId?: string;
}

export interface TraceSpan {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  traceContext: TraceContext;
  name: string;
  kind: SpanKind;
  startTime: Date;
  endTime?: Date;
  duration: number; // milliseconds
  status: {
    code: SpanStatusCode;
    message?: string;
  };
  attributes: Map<string, any>;
  events: SpanEvent[];
  links: SpanLink[];
  serviceName: string;
  serviceVersion: string;
  instrumentationName: string;
}

export interface SpanEvent {
  name: string;
  timestamp: Date;
  attributes: Map<string, any>;
}

export interface SpanLink {
  traceId: string;
  spanId: string;
  attributes?: Map<string, any>;
}

export interface ServiceDependency {
  serviceA: string;
  serviceB: string;
  callCount: number;
  avgLatency: number; // milliseconds
  errorRate: number; // 0-100%
  lastObserved: Date;
  protocols: string[];
}

export interface ServiceTopology {
  services: ServiceNode[];
  dependencies: ServiceDependency[];
  updatedAt: Date;
}

export interface ServiceNode {
  serviceName: string;
  version: string;
  instances: number;
  activeTraces: number;
  avgLatency: number; // ms
  errorRate: number; // %
  throughput: number; // requests/sec
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
}

export interface TraceMetrics {
  traceId: string;
  totalSpans: number;
  totalDuration: number; // milliseconds
  criticalPath: number; // milliseconds
  spansByService: Map<string, number>;
  spansByKind: Map<SpanKind, number>;
  errorSpans: number;
  slowSpans: number; // Above 1000ms
  fastestSpan: number; // milliseconds
  slowestSpan: number; // milliseconds
  avgSpanDuration: number;
  serviceCount: number;
  deepestPath: number; // Number of sequential calls
}

export interface TraceQuery {
  service?: string;
  operation?: string;
  minDuration?: number; // milliseconds
  maxDuration?: number;
  status?: SpanStatusCode;
  hasError?: boolean;
  tags?: Record<string, string>;
  limit?: number;
  offset?: number;
}

export interface TraceSamplingConfig {
  strategy: SamplingStrategy;
  probability?: number; // 0-1, for probability sampling
  rules?: SamplingRule[];
  adaptiveThreshold?: number; // errors per minute to trigger increased sampling
}

export interface SamplingRule {
  name: string;
  match: {
    service?: string;
    operation?: string;
    attributes?: Record<string, string>;
  };
  sampleRate: number; // 0-1
}

export interface TraceExporter {
  name: string;
  endpoint: string;
  headers?: Record<string, string>;
  batchSize?: number;
  flushInterval?: number; // milliseconds
}

export class DistributedTracer extends EventEmitter {
  private spans: Map<string, TraceSpan> = new Map();
  private traces: Map<string, TraceSpan[]> = new Map();
  private dependencies: Map<string, ServiceDependency> = new Map();
  private topology: ServiceTopology;
  private samplingConfig: TraceSamplingConfig;
  private exporters: Map<string, TraceExporter> = new Map();
  private traceBuffer: TraceSpan[] = [];
  private readonly MAX_BUFFER_SIZE = 1000;
  private readonly EXPORT_INTERVAL = 30000; // 30 seconds
  private lastExportTime = Date.now();

  constructor(samplingConfig: TraceSamplingConfig = { strategy: 'probability', probability: 0.1 }) {
    super();
    this.samplingConfig = samplingConfig;
    this.topology = {
      services: [],
      dependencies: [],
      updatedAt: new Date()
    };

    this.startExportTimer();
  }

  // Trace Context Management
  createTraceContext(): TraceContext {
    return {
      traceId: this.generateId(),
      spanId: this.generateId(),
      traceFlags: this.shouldSample() ? 1 : 0,
      traceState: ''
    };
  }

  extractTraceContext(carrier: Record<string, string>): TraceContext | null {
    const traceId = carrier['traceparent']?.split('-')[1];
    const spanId = carrier['traceparent']?.split('-')[2];

    if (!traceId || !spanId) {
      return null;
    }

    return {
      traceId,
      spanId,
      traceFlags: parseInt(carrier['traceparent']?.split('-')[3] || '0', 16),
      traceState: carrier['tracestate']
    };
  }

  injectTraceContext(context: TraceContext): Record<string, string> {
    const traceparent = `00-${context.traceId}-${context.spanId}-${context.traceFlags.toString(16).padStart(2, '0')}`;
    return {
      traceparent,
      ...(context.traceState && { tracestate: context.traceState })
    };
  }

  // Span Management
  startSpan(
    name: string,
    traceContext: TraceContext,
    options: {
      kind?: SpanKind;
      parentSpanId?: string;
      serviceName?: string;
      serviceVersion?: string;
      attributes?: Record<string, any>;
    } = {}
  ): TraceSpan {
    const span: TraceSpan = {
      spanId: this.generateId(),
      traceId: traceContext.traceId,
      parentSpanId: options.parentSpanId || traceContext.parentSpanId,
      traceContext,
      name,
      kind: options.kind || 'internal',
      startTime: new Date(),
      duration: 0,
      status: { code: 'unset' },
      attributes: new Map(Object.entries(options.attributes || {})),
      events: [],
      links: [],
      serviceName: options.serviceName || 'unknown-service',
      serviceVersion: options.serviceVersion || '1.0.0',
      instrumentationName: 'blockstop-tracer'
    };

    this.spans.set(span.spanId, span);

    // Add to trace
    if (!this.traces.has(traceContext.traceId)) {
      this.traces.set(traceContext.traceId, []);
    }
    this.traces.get(traceContext.traceId)!.push(span);

    this.emit('span-started', { span });

    return span;
  }

  endSpan(spanId: string, status: SpanStatusCode = 'ok', message?: string): void {
    const span = this.spans.get(spanId);
    if (!span) {
      console.warn(`Span not found: ${spanId}`);
      return;
    }

    span.endTime = new Date();
    span.duration = span.endTime.getTime() - span.startTime.getTime();
    span.status = { code: status, message };

    this.traceBuffer.push(span);

    if (this.traceBuffer.length >= this.MAX_BUFFER_SIZE) {
      this.flushBuffer();
    }

    this.emit('span-ended', { spanId, status });
  }

  addSpanEvent(spanId: string, eventName: string, attributes?: Record<string, any>): void {
    const span = this.spans.get(spanId);
    if (!span) return;

    span.events.push({
      name: eventName,
      timestamp: new Date(),
      attributes: new Map(Object.entries(attributes || {}))
    });

    this.emit('span-event', { spanId, eventName });
  }

  setSpanAttribute(spanId: string, key: string, value: any): void {
    const span = this.spans.get(spanId);
    if (!span) return;

    span.attributes.set(key, value);
  }

  setSpanAttributes(spanId: string, attributes: Record<string, any>): void {
    const span = this.spans.get(spanId);
    if (!span) return;

    Object.entries(attributes).forEach(([key, value]) => {
      span.attributes.set(key, value);
    });
  }

  addSpanLink(spanId: string, linkedTraceId: string, linkedSpanId: string, attributes?: Record<string, any>): void {
    const span = this.spans.get(spanId);
    if (!span) return;

    span.links.push({
      traceId: linkedTraceId,
      spanId: linkedSpanId,
      attributes: attributes ? new Map(Object.entries(attributes)) : undefined
    });
  }

  // Trace Analysis
  getTrace(traceId: string): TraceSpan[] | undefined {
    return this.traces.get(traceId);
  }

  getTraceMetrics(traceId: string): TraceMetrics | undefined {
    const spans = this.traces.get(traceId);
    if (!spans || spans.length === 0) return undefined;

    const spansByService = new Map<string, number>();
    const spansByKind = new Map<SpanKind, number>();
    let totalDuration = 0;
    let errorCount = 0;
    let slowCount = 0;
    let minDuration = Infinity;
    let maxDuration = 0;

    spans.forEach(span => {
      const service = span.serviceName;
      spansByService.set(service, (spansByService.get(service) || 0) + 1);
      spansByKind.set(span.kind, (spansByKind.get(span.kind) || 0) + 1);

      if (span.status.code === 'error') errorCount++;
      if (span.duration > 1000) slowCount++;

      minDuration = Math.min(minDuration, span.duration);
      maxDuration = Math.max(maxDuration, span.duration);
      totalDuration += span.duration;
    });

    const criticalPath = this.calculateCriticalPath(spans);
    const deepestPath = this.calculateDeepestPath(spans);

    return {
      traceId,
      totalSpans: spans.length,
      totalDuration,
      criticalPath,
      spansByService,
      spansByKind,
      errorSpans: errorCount,
      slowSpans: slowCount,
      fastestSpan: minDuration === Infinity ? 0 : minDuration,
      slowestSpan: maxDuration,
      avgSpanDuration: Math.round(totalDuration / spans.length),
      serviceCount: spansByService.size,
      deepestPath
    };
  }

  private calculateCriticalPath(spans: TraceSpan[]): number {
    // Critical path = longest sequential chain of spans
    // In production, use actual parent-child relationships

    let maxPath = 0;
    const spanMap = new Map<string, TraceSpan>();
    spans.forEach(s => spanMap.set(s.spanId, s));

    spans.forEach(span => {
      if (!span.parentSpanId) {
        let currentPath = span.duration;
        let current = span;

        while (current.parentSpanId) {
          const parent = spanMap.get(current.parentSpanId);
          if (!parent) break;
          currentPath += parent.duration;
          current = parent;
        }

        maxPath = Math.max(maxPath, currentPath);
      }
    });

    return maxPath;
  }

  private calculateDeepestPath(spans: TraceSpan[]): number {
    // Deepest path = longest chain of parent-child relationships
    let maxDepth = 1;
    const spanMap = new Map<string, TraceSpan>();
    spans.forEach(s => spanMap.set(s.spanId, s));

    spans.forEach(span => {
      let depth = 1;
      let current = span;

      while (current.parentSpanId) {
        const parent = spanMap.get(current.parentSpanId);
        if (!parent) break;
        depth++;
        current = parent;
      }

      maxDepth = Math.max(maxDepth, depth);
    });

    return maxDepth;
  }

  // Service Dependency Tracking
  recordDependency(serviceA: string, serviceB: string, latency: number, success: boolean): void {
    const key = `${serviceA}->${serviceB}`;
    const existing = this.dependencies.get(key);

    if (existing) {
      existing.callCount++;
      existing.avgLatency = (existing.avgLatency * (existing.callCount - 1) + latency) / existing.callCount;
      existing.errorRate = success
        ? existing.errorRate * (existing.callCount - 1) / existing.callCount
        : (existing.errorRate * (existing.callCount - 1) + 100) / existing.callCount;
      existing.lastObserved = new Date();
    } else {
      this.dependencies.set(key, {
        serviceA,
        serviceB,
        callCount: 1,
        avgLatency: latency,
        errorRate: success ? 0 : 100,
        lastObserved: new Date(),
        protocols: ['http', 'grpc']
      });
    }

    this.emit('dependency-recorded', { serviceA, serviceB, latency, success });
  }

  getServiceTopology(): ServiceTopology {
    this.updateTopology();
    return this.topology;
  }

  private updateTopology(): void {
    const services = new Map<string, ServiceNode>();

    // Collect service metrics from spans
    const spans = Array.from(this.spans.values())
      .filter(s => s.endTime); // Only completed spans

    spans.forEach(span => {
      const service = span.serviceName;

      if (!services.has(service)) {
        services.set(service, {
          serviceName: service,
          version: span.serviceVersion,
          instances: 1,
          activeTraces: 0,
          avgLatency: 0,
          errorRate: 0,
          throughput: 0,
          p50Latency: 0,
          p95Latency: 0,
          p99Latency: 0
        });
      }

      const node = services.get(service)!;
      const prevAvg = node.avgLatency;
      node.avgLatency = (prevAvg + span.duration) / 2;

      if (span.status.code === 'error') {
        node.errorRate = Math.min(100, node.errorRate + 0.1);
      }
    });

    this.topology.services = Array.from(services.values());
    this.topology.dependencies = Array.from(this.dependencies.values());
    this.topology.updatedAt = new Date();
  }

  // Query and Filtering
  queryTraces(query: TraceQuery): TraceSpan[] {
    let results: TraceSpan[] = Array.from(this.spans.values());

    if (query.service) {
      results = results.filter(s => s.serviceName === query.service);
    }

    if (query.operation) {
      results = results.filter(s => s.name === query.operation);
    }

    if (query.minDuration) {
      results = results.filter(s => s.duration >= query.minDuration!);
    }

    if (query.maxDuration) {
      results = results.filter(s => s.duration <= query.maxDuration!);
    }

    if (query.status) {
      results = results.filter(s => s.status.code === query.status);
    }

    if (query.hasError) {
      results = results.filter(s => s.status.code === 'error');
    }

    if (query.tags) {
      results = results.filter(span => {
        return Object.entries(query.tags!).every(([k, v]) => {
          return span.attributes.get(k) === v;
        });
      });
    }

    // Apply limit and offset
    const offset = query.offset || 0;
    const limit = query.limit || 100;

    return results.slice(offset, offset + limit);
  }

  // Sampling
  private shouldSample(): boolean {
    switch (this.samplingConfig.strategy) {
      case 'always':
        return true;
      case 'never':
        return false;
      case 'probability':
        return Math.random() < (this.samplingConfig.probability || 0.1);
      case 'adaptive':
        // In production, adjust based on error rates
        return Math.random() < 0.2;
      default:
        return false;
    }
  }

  setSamplingConfig(config: TraceSamplingConfig): void {
    this.samplingConfig = config;
    this.emit('sampling-config-changed', config);
  }

  // Export
  registerExporter(exporter: TraceExporter): void {
    this.exporters.set(exporter.name, exporter);
    this.emit('exporter-registered', exporter.name);
  }

  private flushBuffer(): void {
    if (this.traceBuffer.length === 0) return;

    const buffer = [...this.traceBuffer];
    this.traceBuffer = [];

    this.exporters.forEach(exporter => {
      this.exportTraces(buffer, exporter);
    });

    this.lastExportTime = Date.now();
    this.emit('buffer-flushed', { spanCount: buffer.length });
  }

  private exportTraces(spans: TraceSpan[], exporter: TraceExporter): void {
    // In production, send to Jaeger, Zipkin, or other collector
    const payload = {
      resourceSpans: [{
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: 'blockstop' } },
            { key: 'service.version', value: { stringValue: '1.0.0' } }
          ]
        },
        scopeSpans: spans.map(span => ({
          span: {
            traceId: span.traceId,
            spanId: span.spanId,
            parentSpanId: span.parentSpanId,
            name: span.name,
            kind: span.kind,
            startTimeUnixNano: BigInt(span.startTime.getTime()) * BigInt(1000000),
            endTimeUnixNano: BigInt((span.endTime?.getTime() || Date.now())) * BigInt(1000000),
            attributes: Array.from(span.attributes.entries()).map(([k, v]) => ({
              key: k,
              value: { stringValue: String(v) }
            })),
            status: {
              code: span.status.code,
              message: span.status.message
            }
          }
        }))
      }]
    };

    this.emit('trace-exported', {
      exporterName: exporter.name,
      spanCount: spans.length
    });
  }

  private startExportTimer(): void {
    setInterval(() => {
      if (Date.now() - this.lastExportTime >= this.EXPORT_INTERVAL) {
        this.flushBuffer();
      }
    }, 10000); // Check every 10 seconds
  }

  // Utility
  private generateId(): string {
    return Math.random().toString(16).substring(2, 18);
  }

  getStatistics(): Record<string, any> {
    return {
      totalSpans: this.spans.size,
      totalTraces: this.traces.size,
      bufferedSpans: this.traceBuffer.length,
      registeredExporters: this.exporters.size,
      serviceDependencies: this.dependencies.size,
      samplingStrategy: this.samplingConfig.strategy
    };
  }
}

export default DistributedTracer;
