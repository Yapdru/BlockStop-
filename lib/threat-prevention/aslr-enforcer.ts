import { Threat } from './types';
import { generateThreatId } from './utils';

interface MemoryRegion {
  baseAddress: bigint;
  size: bigint;
  type: 'STACK' | 'HEAP' | 'CODE' | 'DATA' | 'MAPPED';
  readable: boolean;
  writable: boolean;
  executable: boolean;
}

interface ProcessMemoryLayout {
  processId: number;
  pid: number;
  regions: MemoryRegion[];
  hasASLR: boolean;
  isRandomized: boolean;
  timestamp: number;
}

interface MemoryPattern {
  processId: number;
  address: bigint;
  pattern: string; // Hex pattern or regex
  description: string;
}

export class ASLREnforcer {
  private memoryLayouts: Map<number, ProcessMemoryLayout> = new Map();
  private detectedViolations: Map<number, Threat[]> = new Map();

  async enforceASLR(
    processId: number,
    layout: ProcessMemoryLayout
  ): Promise<Threat | null> {
    const violations = this.checkASLRViolations(processId, layout);

    if (violations.length === 0) {
      this.memoryLayouts.set(processId, layout);
      return null;
    }

    const threat: Threat = {
      id: generateThreatId(),
      type: 'BUFFER_OVERFLOW',
      severity: 'CRITICAL',
      timestamp: Date.now(),
      source: 'ASLREnforcer',
      description: `ASLR violation detected: ${violations.join(', ')}`,
      processId,
      behaviorIndicators: violations,
      metadata: {
        memoryRegions: layout.regions.length,
        hasASLR: layout.hasASLR,
        isRandomized: layout.isRandomized,
      },
    };

    this.recordViolation(processId, threat);
    return threat;
  }

  private checkASLRViolations(
    processId: number,
    layout: ProcessMemoryLayout
  ): string[] {
    const violations: string[] = [];

    // Check if ASLR is disabled
    if (!layout.hasASLR) {
      violations.push('aslr_disabled');
    }

    // Check if memory is randomized
    if (!layout.isRandomized) {
      violations.push('predictable_memory_layout');
    }

    // Check for previous layout to detect address reuse
    const previousLayout = this.memoryLayouts.get(processId);
    if (previousLayout) {
      const addressChanges = this.compareLayouts(previousLayout, layout);
      if (addressChanges === 0) {
        violations.push('static_memory_addresses');
      }
    }

    // Check for suspicious region patterns
    for (const region of layout.regions) {
      // Writable and executable regions (W^X violation)
      if (region.writable && region.executable) {
        violations.push('wx_region_detected');
      }

      // RWX regions are extremely dangerous
      if (region.readable && region.writable && region.executable) {
        violations.push('rwx_region_critical');
      }

      // Code section is writable (unusual)
      if (region.type === 'CODE' && region.writable) {
        violations.push('writable_code_section');
      }
    }

    return [...new Set(violations)];
  }

  private compareLayouts(
    layout1: ProcessMemoryLayout,
    layout2: ProcessMemoryLayout
  ): number {
    let changes = 0;

    const regions1 = new Map(
      layout1.regions.map((r) => [r.type, r.baseAddress])
    );
    const regions2 = new Map(
      layout2.regions.map((r) => [r.type, r.baseAddress])
    );

    for (const [type, addr1] of regions1) {
      const addr2 = regions2.get(type);
      if (addr2 && addr1 !== addr2) {
        changes++;
      }
    }

    return changes;
  }

  detectMemoryPattern(
    processId: number,
    patterns: MemoryPattern[]
  ): string[] {
    const indicators: string[] = [];

    const layout = this.memoryLayouts.get(processId);
    if (!layout) return indicators;

    for (const pattern of patterns) {
      // Check if pattern appears in expected region
      const region = layout.regions.find(
        (r) =>
          pattern.address >= r.baseAddress &&
          pattern.address < r.baseAddress + r.size
      );

      if (!region) {
        indicators.push(`pattern_invalid_region_${pattern.description}`);
        continue;
      }

      // Check for suspicious region combinations
      if (
        region.type === 'CODE' &&
        region.writable &&
        pattern.description.includes('shellcode')
      ) {
        indicators.push('shellcode_in_code_section');
      }

      if (
        region.type === 'HEAP' &&
        region.executable &&
        pattern.description.includes('executable')
      ) {
        indicators.push('executable_heap_detected');
      }
    }

    return indicators;
  }

  validateMemoryRegions(layout: ProcessMemoryLayout): string[] {
    const issues: string[] = [];

    // Check gap between regions (should be present)
    const sortedRegions = [...layout.regions].sort(
      (a, b) => a.baseAddress - b.baseAddress
    );

    for (let i = 1; i < sortedRegions.length; i++) {
      const gap =
        sortedRegions[i].baseAddress -
        (sortedRegions[i - 1].baseAddress + sortedRegions[i - 1].size);

      if (gap < 4096n) {
        // Less than page size
        issues.push('insufficient_memory_gap');
      }
    }

    // Check stack alignment
    const stackRegions = layout.regions.filter((r) => r.type === 'STACK');
    for (const stack of stackRegions) {
      if (stack.baseAddress % 4096n !== 0n) {
        issues.push('misaligned_stack');
      }
    }

    // Check heap permissions
    const heapRegions = layout.regions.filter((r) => r.type === 'HEAP');
    for (const heap of heapRegions) {
      if (heap.executable) {
        issues.push('executable_heap');
      }
    }

    return [...new Set(issues)];
  }

  private recordViolation(processId: number, threat: Threat): void {
    if (!this.detectedViolations.has(processId)) {
      this.detectedViolations.set(processId, []);
    }
    this.detectedViolations.get(processId)!.push(threat);

    // Keep last 100 violations
    const violations = this.detectedViolations.get(processId)!;
    if (violations.length > 100) {
      violations.shift();
    }
  }

  getMemoryLayout(processId: number): ProcessMemoryLayout | undefined {
    return this.memoryLayouts.get(processId);
  }

  getViolationHistory(processId: number): Threat[] {
    return this.detectedViolations.get(processId) || [];
  }

  clearData(processId?: number): void {
    if (processId) {
      this.memoryLayouts.delete(processId);
      this.detectedViolations.delete(processId);
    } else {
      this.memoryLayouts.clear();
      this.detectedViolations.clear();
    }
  }
}

export default ASLREnforcer;
