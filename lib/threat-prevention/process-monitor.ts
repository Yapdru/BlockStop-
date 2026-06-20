import { MonitoringEvent } from './types';
import { generateEventId } from './utils';

interface ProcessInfo {
  pid: number;
  name: string;
  parentPid: number;
  command: string;
  creationTime: number;
  user: string;
  priority: number;
  threads: number;
}

interface ProcessMemory {
  rss: number; // Resident set size
  vms: number; // Virtual memory size
  percentMemory: number;
  heapSize: number;
}

interface ProcessResources {
  cpuUsage: number;
  memoryUsage: ProcessMemory;
  fileHandles: number;
  networkConnections: number;
  threads: number;
}

export class ProcessMonitor {
  private processMap: Map<number, ProcessInfo> = new Map();
  private resourceSnapshots: Map<number, ProcessResources[]> = new Map();
  private eventQueue: MonitoringEvent[] = [];
  private maxEventQueueSize = 5000;

  monitorProcess(process: ProcessInfo): void {
    this.processMap.set(process.pid, process);
  }

  recordResourceUsage(pid: number, resources: ProcessResources): void {
    if (!this.resourceSnapshots.has(pid)) {
      this.resourceSnapshots.set(pid, []);
    }

    const snapshots = this.resourceSnapshots.get(pid)!;
    snapshots.push(resources);

    // Keep last 1000 snapshots per process
    if (snapshots.length > 1000) {
      snapshots.shift();
    }
  }

  createEvent(
    type: string,
    processId: number,
    details: Record<string, any> = {}
  ): MonitoringEvent {
    const event: MonitoringEvent = {
      eventId: generateEventId(),
      type,
      timestamp: Date.now(),
      processId,
      severity: details.severity || 'INFO',
      indicators: details.indicators || [],
    };

    if (details.filePath) event.filePath = details.filePath;
    if (details.registryPath) event.registryPath = details.registryPath;
    if (details.networkInfo) event.networkInfo = details.networkInfo;

    this.enqueueEvent(event);
    return event;
  }

  private enqueueEvent(event: MonitoringEvent): void {
    this.eventQueue.push(event);

    if (this.eventQueue.length > this.maxEventQueueSize) {
      this.eventQueue.shift();
    }
  }

  getEvents(type?: string, processId?: number): MonitoringEvent[] {
    return this.eventQueue.filter((e) => {
      if (type && e.type !== type) return false;
      if (processId && e.processId !== processId) return false;
      return true;
    });
  }

  getRecentEvents(
    windowMs: number = 60000,
    type?: string
  ): MonitoringEvent[] {
    const cutoff = Date.now() - windowMs;
    return this.getEvents(type).filter((e) => e.timestamp >= cutoff);
  }

  getProcessInfo(pid: number): ProcessInfo | undefined {
    return this.processMap.get(pid);
  }

  getResourceSnapshots(pid: number): ProcessResources[] {
    return this.resourceSnapshots.get(pid) || [];
  }

  getAverageResourceUsage(
    pid: number,
    windowMs: number = 60000
  ): ProcessResources | null {
    const snapshots = this.getResourceSnapshots(pid);
    if (snapshots.length === 0) return null;

    const now = Date.now();
    const recent = snapshots.filter((s) => {
      // We don't have timestamp in ProcessResources, so we use all
      return true;
    });

    if (recent.length === 0) return null;

    const avgCpu = recent.reduce((sum, s) => sum + s.cpuUsage, 0) / recent.length;
    const avgMemory = {
      rss: recent.reduce((sum, s) => sum + s.memoryUsage.rss, 0) / recent.length,
      vms: recent.reduce((sum, s) => sum + s.memoryUsage.vms, 0) / recent.length,
      percentMemory:
        recent.reduce((sum, s) => sum + s.memoryUsage.percentMemory, 0) /
        recent.length,
      heapSize:
        recent.reduce((sum, s) => sum + s.memoryUsage.heapSize, 0) / recent.length,
    };

    const avgFileHandles = recent.reduce((sum, s) => sum + s.fileHandles, 0) / recent.length;
    const avgNetworkConnections =
      recent.reduce((sum, s) => sum + s.networkConnections, 0) / recent.length;
    const avgThreads = recent.reduce((sum, s) => sum + s.threads, 0) / recent.length;

    return {
      cpuUsage: avgCpu,
      memoryUsage: avgMemory,
      fileHandles: avgFileHandles,
      networkConnections: avgNetworkConnections,
      threads: avgThreads,
    };
  }

  detectResourceAnomaly(
    pid: number,
    threshold: number = 2.0
  ): string[] {
    const snapshots = this.getResourceSnapshots(pid);
    if (snapshots.length < 5) return [];

    const anomalies: string[] = [];
    const recent = snapshots.slice(-10);
    const baseline = snapshots.slice(0, -10);

    const recentAvgCpu = recent.reduce((sum, s) => sum + s.cpuUsage, 0) / recent.length;
    const baselineAvgCpu = baseline.reduce((sum, s) => sum + s.cpuUsage, 0) / baseline.length;

    if (recentAvgCpu > baselineAvgCpu * threshold) {
      anomalies.push('cpu_usage_spike');
    }

    const recentAvgMem = recent.reduce((sum, s) => sum + s.memoryUsage.rss, 0) / recent.length;
    const baselineAvgMem = baseline.reduce((sum, s) => sum + s.memoryUsage.rss, 0) / baseline.length;

    if (recentAvgMem > baselineAvgMem * threshold) {
      anomalies.push('memory_usage_spike');
    }

    return anomalies;
  }

  removeProcess(pid: number): void {
    this.processMap.delete(pid);
    this.resourceSnapshots.delete(pid);
  }

  getAllProcesses(): ProcessInfo[] {
    return Array.from(this.processMap.values());
  }

  clearEvents(): void {
    this.eventQueue = [];
  }

  getEventQueueStats(): {
    totalEvents: number;
    maxSize: number;
    utilization: number;
  } {
    return {
      totalEvents: this.eventQueue.length,
      maxSize: this.maxEventQueueSize,
      utilization: (this.eventQueue.length / this.maxEventQueueSize) * 100,
    };
  }
}

export default ProcessMonitor;
