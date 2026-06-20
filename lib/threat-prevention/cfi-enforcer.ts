import { Threat } from './types';
import { generateThreatId } from './utils';

interface ControlFlowEdge {
  source: bigint;
  target: bigint;
  type: 'call' | 'return' | 'jmp' | 'cond_jmp';
  expected: boolean;
}

interface ValidCallTarget {
  address: bigint;
  function: string;
  module: string;
}

interface ControlFlowViolation {
  source: bigint;
  target: bigint;
  type: string;
  timestamp: number;
}

export class CFIEnforcer {
  private validTargets: Map<number, Set<bigint>> = new Map();
  private violations: Map<number, ControlFlowViolation[]> = new Map();
  private threats: Map<number, Threat[]> = new Map();

  async enforceControlFlow(
    processId: number,
    edges: ControlFlowEdge[]
  ): Promise<Threat | null> {
    const violations = this.validateControlFlow(processId, edges);

    if (violations.length === 0) {
      return null;
    }

    const indicators = violations.map((v) => `${v.type}_violation`);

    const threat: Threat = {
      id: generateThreatId(),
      type: 'EXPLOIT',
      severity: 'CRITICAL',
      timestamp: Date.now(),
      source: 'CFIEnforcer',
      description: `Control flow integrity violation detected: ${[...new Set(indicators)].join(', ')}`,
      processId,
      behaviorIndicators: [...new Set(indicators)],
      metadata: {
        violationCount: violations.length,
        violations: violations.map((v) => ({
          source: v.source.toString(),
          target: v.target.toString(),
          type: v.type,
        })),
      },
    };

    this.recordViolation(processId, threat);
    this.storeViolations(processId, violations);

    return threat;
  }

  private validateControlFlow(
    processId: number,
    edges: ControlFlowEdge[]
  ): ControlFlowViolation[] {
    const violations: ControlFlowViolation[] = [];
    const validTargets = this.validTargets.get(processId) || new Set();

    for (const edge of edges) {
      if (!edge.expected) {
        // Unexpected edge
        violations.push({
          source: edge.source,
          target: edge.target,
          type: 'unexpected_edge',
          timestamp: Date.now(),
        });
        continue;
      }

      // Check for return address tampering
      if (
        edge.type === 'return' &&
        !this.isValidReturnTarget(edge.target, validTargets)
      ) {
        violations.push({
          source: edge.source,
          target: edge.target,
          type: 'invalid_return_target',
          timestamp: Date.now(),
        });
      }

      // Check for indirect call to invalid target
      if (
        edge.type === 'call' &&
        edge.target !== this.getNextExpectedCall(edge.source)
      ) {
        if (!validTargets.has(edge.target)) {
          violations.push({
            source: edge.source,
            target: edge.target,
            type: 'indirect_call_violation',
            timestamp: Date.now(),
          });
        }
      }

      // Check for jump to data section
      if (edge.type === 'jmp' && this.isDataSection(edge.target)) {
        violations.push({
          source: edge.source,
          target: edge.target,
          type: 'jump_to_data',
          timestamp: Date.now(),
        });
      }

      // Check for ROP gadget patterns
      if (this.detectROPPattern(edge)) {
        violations.push({
          source: edge.source,
          target: edge.target,
          type: 'rop_gadget_detected',
          timestamp: Date.now(),
        });
      }

      // Check for JOP gadget patterns
      if (this.detectJOPPattern(edge)) {
        violations.push({
          source: edge.source,
          target: edge.target,
          type: 'jop_gadget_detected',
          timestamp: Date.now(),
        });
      }
    }

    return violations;
  }

  private isValidReturnTarget(address: bigint, validTargets: Set<bigint>): boolean {
    if (validTargets.has(address)) {
      return true;
    }

    // Valid return targets are typically after call instructions
    // or at function entry points
    const addr32 = Number(address & BigInt('0xFFFFFFFF'));

    // Check for known return instruction patterns
    return (addr32 & 0xFF) === 0x00 || (addr32 & 0xFF) === 0x90; // NOP or aligned
  }

  private getNextExpectedCall(source: bigint): bigint {
    // This is simplified; real implementation would analyze bytecode
    return source + BigInt(5); // Typical x86 call instruction length
  }

  private isDataSection(address: bigint): boolean {
    // Simplified check; real implementation would check memory mappings
    // Generally, data sections have lower entropy
    return (address & BigInt('0xFFF')) === BigInt('0');
  }

  private detectROPPattern(edge: ControlFlowEdge): boolean {
    // ROP chains typically have:
    // 1. Short instruction sequences
    // 2. Followed by ret instruction
    // 3. Multiple gadgets chained together

    if (edge.type !== 'return') {
      return false;
    }

    // Check if source is suspiciously small (gadget indicator)
    const distance = edge.target > edge.source ? edge.target - edge.source : edge.source - edge.target;
    return distance < BigInt(64); // Gadgets are typically <64 bytes
  }

  private detectJOPPattern(edge: ControlFlowEdge): boolean {
    // JOP chains use indirect jumps instead of returns
    if (edge.type !== 'jmp') {
      return false;
    }

    // Detect rapid sequence of jumps (characteristic of JOP)
    const distance = edge.target > edge.source ? edge.target - edge.source : edge.source - edge.target;
    return distance < BigInt(128) && distance > BigInt(0);
  }

  registerValidTargets(
    processId: number,
    targets: ValidCallTarget[]
  ): void {
    let targetSet = this.validTargets.get(processId);
    if (!targetSet) {
      targetSet = new Set();
      this.validTargets.set(processId, targetSet);
    }

    for (const target of targets) {
      targetSet.add(target.address);
    }
  }

  private recordViolation(processId: number, threat: Threat): void {
    if (!this.threats.has(processId)) {
      this.threats.set(processId, []);
    }

    this.threats.get(processId)!.push(threat);

    // Keep last 100 threats
    const threatList = this.threats.get(processId)!;
    if (threatList.length > 100) {
      threatList.shift();
    }
  }

  private storeViolations(
    processId: number,
    violations: ControlFlowViolation[]
  ): void {
    if (!this.violations.has(processId)) {
      this.violations.set(processId, []);
    }

    this.violations.get(processId)!.push(...violations);

    // Keep last 500 violations
    const violationList = this.violations.get(processId)!;
    if (violationList.length > 500) {
      violationList.splice(0, violationList.length - 500);
    }
  }

  getThreats(processId: number): Threat[] {
    return this.threats.get(processId) || [];
  }

  getViolations(processId: number): ControlFlowViolation[] {
    return this.violations.get(processId) || [];
  }

  clearData(processId?: number): void {
    if (processId) {
      this.validTargets.delete(processId);
      this.violations.delete(processId);
      this.threats.delete(processId);
    } else {
      this.validTargets.clear();
      this.violations.clear();
      this.threats.clear();
    }
  }
}

export default CFIEnforcer;
