import { Threat } from './types';
import { generateThreatId } from './utils';

interface MemoryAccess {
  address: bigint;
  size: number;
  type: 'read' | 'write';
  processId: number;
  timestamp: number;
  stackTrace?: string[];
}

interface ShadowMemory {
  address: bigint;
  state: 'accessible' | 'freed' | 'poisoned' | 'uninitialized';
  allocatorId?: string;
}

interface MemoryAllocation {
  address: bigint;
  size: number;
  allocatedAt: number;
  freedAt?: number;
  stackTrace?: string[];
}

export class MemorySanitizer {
  private shadowMap: Map<number, Map<bigint, ShadowMemory>> = new Map();
  private allocations: Map<number, MemoryAllocation[]> = new Map();
  private violations: Map<number, Threat[]> = new Map();

  async checkMemoryAccess(
    processId: number,
    access: MemoryAccess
  ): Promise<Threat | null> {
    const shadowMem = this.getShadowMemory(processId, access.address);

    if (
      shadowMem &&
      (shadowMem.state === 'freed' ||
        shadowMem.state === 'poisoned' ||
        shadowMem.state === 'uninitialized')
    ) {
      const threat: Threat = {
        id: generateThreatId(),
        type: 'BUFFER_OVERFLOW',
        severity: 'CRITICAL',
        timestamp: access.timestamp,
        source: 'MemorySanitizer',
        description: `Memory safety violation: ${access.type} access to ${shadowMem.state} memory at ${access.address.toString()}`,
        processId,
        behaviorIndicators: [
          `${access.type}_${shadowMem.state}_memory`,
          'memory_safety_violation',
        ],
        metadata: {
          address: access.address.toString(),
          accessSize: access.size,
          memoryState: shadowMem.state,
          stackTrace: access.stackTrace,
        },
      };

      this.recordViolation(processId, threat);
      return threat;
    }

    return null;
  }

  recordAllocation(
    processId: number,
    allocation: MemoryAllocation
  ): void {
    if (!this.allocations.has(processId)) {
      this.allocations.set(processId, []);
    }

    this.allocations.get(processId)!.push(allocation);

    // Mark in shadow memory
    this.setShadowMemory(processId, allocation.address, {
      address: allocation.address,
      state: 'accessible',
      allocatorId: 'malloc',
    });

    // Limit allocations per process
    const allocs = this.allocations.get(processId)!;
    if (allocs.length > 10000) {
      allocs.shift();
    }
  }

  recordDeallocation(processId: number, address: bigint): void {
    const allocations = this.allocations.get(processId) || [];
    const allocation = allocations.find((a) => a.address === address);

    if (allocation) {
      allocation.freedAt = Date.now();

      // Mark in shadow memory as freed
      this.setShadowMemory(processId, address, {
        address,
        state: 'freed',
      });
    }
  }

  recordPoisoning(processId: number, address: bigint, size: number): void {
    for (let i = 0n; i < BigInt(size); i += 8n) {
      this.setShadowMemory(processId, address + i, {
        address: address + i,
        state: 'poisoned',
      });
    }
  }

  detectUseAfterFree(processId: number): Threat[] {
    const allocations = this.allocations.get(processId) || [];
    const threats: Threat[] = [];

    for (const alloc of allocations) {
      if (!alloc.freedAt) continue;

      const shadowMem = this.getShadowMemory(processId, alloc.address);
      if (shadowMem && shadowMem.state === 'freed') {
        // Additional check: look for accesses after free time
        // This is simplified; real implementation would track access logs
        threats.push({
          id: generateThreatId(),
          type: 'BUFFER_OVERFLOW',
          severity: 'HIGH',
          timestamp: Date.now(),
          source: 'MemorySanitizer',
          description: `Use-after-free detected at ${alloc.address.toString()}`,
          processId,
          behaviorIndicators: ['use_after_free', 'freed_memory_access'],
          metadata: {
            address: alloc.address.toString(),
            allocatedAt: alloc.allocatedAt,
            freedAt: alloc.freedAt,
          },
        });
      }
    }

    return threats;
  }

  detectMemoryLeak(
    processId: number,
    windowMs: number = 60000
  ): MemoryAllocation[] {
    const allocations = this.allocations.get(processId) || [];
    const cutoff = Date.now() - windowMs;

    return allocations.filter(
      (a) => a.allocatedAt < cutoff && !a.freedAt
    );
  }

  detectDoubleFreq(processId: number): Threat[] {
    const allocations = this.allocations.get(processId) || [];
    const threats: Threat[] = [];
    const addresses = new Set<bigint>();
    const freeCounts = new Map<bigint, number>();

    // Count how many times each address is freed
    for (const alloc of allocations.filter((a) => a.freedAt)) {
      const count = (freeCounts.get(alloc.address) || 0) + 1;
      freeCounts.set(alloc.address, count);
    }

    // Detect double-free
    for (const [address, count] of freeCounts) {
      if (count > 1) {
        threats.push({
          id: generateThreatId(),
          type: 'BUFFER_OVERFLOW',
          severity: 'HIGH',
          timestamp: Date.now(),
          source: 'MemorySanitizer',
          description: `Double-free detected at ${address.toString()}`,
          processId,
          behaviorIndicators: ['double_free', 'heap_corruption'],
          metadata: {
            address: address.toString(),
            freeCount: count,
          },
        });
      }
    }

    return threats;
  }

  private getShadowMemory(
    processId: number,
    address: bigint
  ): ShadowMemory | null {
    const shadowMap = this.shadowMap.get(processId);
    if (!shadowMap) return null;

    // Check for exact address or range
    for (const [addr, mem] of shadowMap) {
      if (address >= addr && address < addr + BigInt(8)) {
        return mem;
      }
    }

    return null;
  }

  private setShadowMemory(
    processId: number,
    address: bigint,
    memory: ShadowMemory
  ): void {
    let shadowMap = this.shadowMap.get(processId);
    if (!shadowMap) {
      shadowMap = new Map();
      this.shadowMap.set(processId, shadowMap);
    }

    shadowMap.set(address, memory);

    // Limit shadow memory size
    if (shadowMap.size > 100000) {
      const entries = Array.from(shadowMap.entries());
      for (let i = 0; i < 10000; i++) {
        shadowMap.delete(entries[i][0]);
      }
    }
  }

  private recordViolation(processId: number, threat: Threat): void {
    if (!this.violations.has(processId)) {
      this.violations.set(processId, []);
    }

    this.violations.get(processId)!.push(threat);

    // Keep last 500 violations
    const threats = this.violations.get(processId)!;
    if (threats.length > 500) {
      threats.shift();
    }
  }

  getViolations(processId: number): Threat[] {
    return this.violations.get(processId) || [];
  }

  getAllocations(processId: number): MemoryAllocation[] {
    return this.allocations.get(processId) || [];
  }

  clearData(processId?: number): void {
    if (processId) {
      this.shadowMap.delete(processId);
      this.allocations.delete(processId);
      this.violations.delete(processId);
    } else {
      this.shadowMap.clear();
      this.allocations.clear();
      this.violations.clear();
    }
  }

  getStatistics(processId: number): {
    allocations: number;
    freedAllocations: number;
    leakedBytes: number;
  } {
    const allocations = this.getAllocations(processId);
    const leakedBytes = allocations
      .filter((a) => !a.freedAt)
      .reduce((sum, a) => sum + a.size, 0);

    return {
      allocations: allocations.length,
      freedAllocations: allocations.filter((a) => a.freedAt).length,
      leakedBytes,
    };
  }
}

export default MemorySanitizer;
