import { MonitoringEvent } from './types';
import { generateEventId } from './utils';

interface NetworkFlow {
  processId: number;
  sourceIp: string;
  sourcePort: number;
  destinationIp: string;
  destinationPort: number;
  protocol: string;
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
  startTime: number;
  lastActivity: number;
  state: 'ESTABLISHED' | 'LISTENING' | 'CLOSED';
}

interface NetworkSnapshot {
  activeConnections: number;
  totalBytesTransferred: number;
  totalPackets: number;
  uniqueDestinations: number;
  timestamp: number;
}

export class NetworkTrafficMonitor {
  private flows: Map<number, NetworkFlow[]> = new Map();
  private destinationMap: Map<string, number> = new Map(); // IP -> access count
  private snapshots: NetworkSnapshot[] = [];
  private maxFlowsPerProcess = 1000;

  recordNetworkFlow(flow: NetworkFlow): MonitoringEvent {
    const flowKey = `${flow.sourceIp}:${flow.sourcePort}-${flow.destinationIp}:${flow.destinationPort}`;

    if (!this.flows.has(flow.processId)) {
      this.flows.set(flow.processId, []);
    }

    const flowList = this.flows.get(flow.processId)!;
    const existingFlow = flowList.find(
      (f) =>
        f.sourceIp === flow.sourceIp &&
        f.sourcePort === flow.sourcePort &&
        f.destinationIp === flow.destinationIp &&
        f.destinationPort === flow.destinationPort
    );

    if (existingFlow) {
      existingFlow.bytesIn += flow.bytesIn;
      existingFlow.bytesOut += flow.bytesOut;
      existingFlow.packetsIn += flow.packetsIn;
      existingFlow.packetsOut += flow.packetsOut;
      existingFlow.lastActivity = flow.lastActivity;
      existingFlow.state = flow.state;
    } else {
      flowList.push(flow);
    }

    if (flowList.length > this.maxFlowsPerProcess) {
      // Remove oldest flows
      flowList.splice(0, flowList.length - this.maxFlowsPerProcess);
    }

    // Track destination
    this.destinationMap.set(
      flow.destinationIp,
      (this.destinationMap.get(flow.destinationIp) || 0) + 1
    );

    return {
      eventId: generateEventId(),
      type: 'network_flow',
      timestamp: flow.startTime,
      processId: flow.processId,
      networkInfo: {
        srcIp: flow.sourceIp,
        dstIp: flow.destinationIp,
        srcPort: flow.sourcePort,
        dstPort: flow.destinationPort,
        protocol: flow.protocol,
      },
      severity: 'INFO',
      indicators: [flow.protocol],
    };
  }

  getProcessFlows(processId: number): NetworkFlow[] {
    return this.flows.get(processId) || [];
  }

  getAllFlows(): NetworkFlow[] {
    return Array.from(this.flows.values()).flat();
  }

  detectAnomalousActivity(processId: number): string[] {
    const flows = this.getProcessFlows(processId);
    if (flows.length === 0) return [];

    const indicators: string[] = [];

    // Detect many connections to different hosts
    const uniqueDests = new Set(flows.map((f) => f.destinationIp)).size;
    if (uniqueDests > 50) {
      indicators.push('multiple_host_connections');
    }

    // Detect high volume transfers
    const totalBytes = flows.reduce((sum, f) => sum + f.bytesOut, 0);
    if (totalBytes > 1024 * 1024 * 1024) {
      // > 1GB
      indicators.push('high_volume_transfer');
    }

    // Detect connections to suspicious ports
    const suspiciousPorts = [
      4444, 5555, 6666, 7777, 8888, 9999, 31337, 27374, 27889, 6667, 6697,
    ];
    const suspiciousFlows = flows.filter((f) =>
      suspiciousPorts.includes(f.destinationPort)
    );
    if (suspiciousFlows.length > 0) {
      indicators.push('suspicious_port_access');
    }

    // Detect DNS over unusual protocols
    const dnsFlows = flows.filter((f) => f.destinationPort === 53);
    const nonUdpDns = dnsFlows.filter((f) => f.protocol !== 'UDP');
    if (nonUdpDns.length > 0) {
      indicators.push('non_standard_dns');
    }

    // Detect connections without data transfer (possible port scanning)
    const emptyFlows = flows.filter((f) => f.bytesIn === 0 && f.bytesOut === 0);
    if (emptyFlows.length > flows.length * 0.5) {
      indicators.push('port_scanning_pattern');
    }

    // Detect rapid connection churn
    if (flows.length > 100 && flows.length > this.maxFlowsPerProcess * 0.8) {
      indicators.push('connection_exhaustion');
    }

    // Detect reverse connections (process initiating to random/high ports)
    const reverseConns = flows.filter(
      (f) => f.destinationPort > 10000 && f.bytesIn > f.bytesOut
    );
    if (reverseConns.length > 5) {
      indicators.push('reverse_connection_pattern');
    }

    return [...new Set(indicators)];
  }

  recordSnapshot(): NetworkSnapshot {
    const allFlows = this.getAllFlows();
    const uniqueDests = new Set(allFlows.map((f) => f.destinationIp)).size;

    const snapshot: NetworkSnapshot = {
      activeConnections: allFlows.filter((f) => f.state === 'ESTABLISHED').length,
      totalBytesTransferred: allFlows.reduce((sum, f) => sum + f.bytesOut, 0),
      totalPackets: allFlows.reduce(
        (sum, f) => sum + f.packetsIn + f.packetsOut,
        0
      ),
      uniqueDestinations: uniqueDests,
      timestamp: Date.now(),
    };

    this.snapshots.push(snapshot);

    if (this.snapshots.length > 1000) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  getSnapshots(windowMs: number = 3600000): NetworkSnapshot[] {
    const cutoff = Date.now() - windowMs;
    return this.snapshots.filter((s) => s.timestamp >= cutoff);
  }

  getTopDestinations(limit: number = 10): Array<[string, number]> {
    return Array.from(this.destinationMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }

  closeFlow(processId: number, flow: Partial<NetworkFlow>): void {
    const flows = this.flows.get(processId);
    if (!flows) return;

    const index = flows.findIndex(
      (f) =>
        f.sourceIp === flow.sourceIp &&
        f.sourcePort === flow.sourcePort &&
        f.destinationIp === flow.destinationIp &&
        f.destinationPort === flow.destinationPort
    );

    if (index !== -1) {
      flows[index].state = 'CLOSED';
    }
  }

  getAllProcesses(): number[] {
    return Array.from(this.flows.keys());
  }

  clear(processId?: number): void {
    if (processId) {
      this.flows.delete(processId);
    } else {
      this.flows.clear();
      this.destinationMap.clear();
      this.snapshots = [];
    }
  }

  getStatistics(): {
    trackedProcesses: number;
    activeFlows: number;
    uniqueDestinations: number;
  } {
    return {
      trackedProcesses: this.flows.size,
      activeFlows: this.getAllFlows().length,
      uniqueDestinations: this.destinationMap.size,
    };
  }
}

export default NetworkTrafficMonitor;
