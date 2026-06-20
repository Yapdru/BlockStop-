import { Threat } from './types';
import { generateThreatId } from './utils';

interface BufferAccess {
  processId: number;
  bufferAddress: bigint;
  bufferSize: number;
  accessOffset: number;
  accessSize: number;
  isWrite: boolean;
  timestamp: number;
}

interface StackFrame {
  functionName: string;
  returnAddress: bigint;
  stackPointer: bigint;
}

export class BufferOverflowBlocker {
  private accessLog: Map<number, BufferAccess[]> = new Map();
  private detectionHistory: Map<number, Threat[]> = new Map();

  async detectBufferOverflow(
    processId: number,
    accesses: BufferAccess[],
    stackTrace?: StackFrame[]
  ): Promise<Threat | null> {
    const violations = this.analyzeAccesses(accesses);

    if (violations.length === 0) {
      return null;
    }

    const indicators = this.buildIndicators(violations, stackTrace);

    const threat: Threat = {
      id: generateThreatId(),
      type: 'BUFFER_OVERFLOW',
      severity: 'CRITICAL',
      timestamp: Date.now(),
      source: 'BufferOverflowBlocker',
      description: `Buffer overflow attempt detected: ${indicators.join(', ')}`,
      processId,
      behaviorIndicators: indicators,
      metadata: {
        violations: violations.map((v) => ({
          type: v.type,
          offset: v.offset,
          size: v.size,
        })),
        stackTrace: stackTrace?.map((f) => ({
          function: f.functionName,
          address: f.returnAddress.toString(),
        })),
      },
    };

    this.recordDetection(processId, threat);
    this.recordAccesses(processId, accesses);

    return threat;
  }

  private analyzeAccesses(
    accesses: BufferAccess[]
  ): Array<{
    type: string;
    offset: number;
    size: number;
  }> {
    const violations: Array<{
      type: string;
      offset: number;
      size: number;
    }> = [];

    for (const access of accesses) {
      // Check for out-of-bounds access
      if (access.accessOffset + access.accessSize > access.bufferSize) {
        const overflow = access.accessOffset + access.accessSize - access.bufferSize;
        violations.push({
          type: 'out_of_bounds_access',
          offset: access.accessOffset,
          size: overflow,
        });
      }

      // Check for negative offset (underflow)
      if (access.accessOffset < 0) {
        violations.push({
          type: 'buffer_underflow',
          offset: access.accessOffset,
          size: Math.abs(access.accessOffset),
        });
      }

      // Check for suspicious size (very large write to small buffer)
      if (
        access.isWrite &&
        access.accessSize > access.bufferSize * 2 &&
        access.bufferSize < 256
      ) {
        violations.push({
          type: 'excessive_write_size',
          offset: access.accessOffset,
          size: access.accessSize - access.bufferSize,
        });
      }
    }

    return violations;
  }

  private buildIndicators(
    violations: Array<{
      type: string;
      offset: number;
      size: number;
    }>,
    stackTrace?: StackFrame[]
  ): string[] {
    const indicators: string[] = [];

    for (const violation of violations) {
      indicators.push(violation.type);
    }

    // Check for unsafe functions in stack trace
    if (stackTrace) {
      const unsafeFuncs = ['strcpy', 'strcat', 'sprintf', 'gets', 'scanf'];
      for (const frame of stackTrace) {
        if (
          unsafeFuncs.some((fn) =>
            frame.functionName.toLowerCase().includes(fn)
          )
        ) {
          indicators.push('unsafe_function_detected');
          break;
        }
      }
    }

    // Check for sequential overflows (likely controlled attack)
    if (violations.length > 3) {
      indicators.push('multiple_buffer_violations');
    }

    return [...new Set(indicators)];
  }

  private recordDetection(processId: number, threat: Threat): void {
    if (!this.detectionHistory.has(processId)) {
      this.detectionHistory.set(processId, []);
    }
    this.detectionHistory.get(processId)!.push(threat);

    // Keep last 100 detections
    const history = this.detectionHistory.get(processId)!;
    if (history.length > 100) {
      history.shift();
    }
  }

  private recordAccesses(processId: number, accesses: BufferAccess[]): void {
    if (!this.accessLog.has(processId)) {
      this.accessLog.set(processId, []);
    }
    this.accessLog.get(processId)!.push(...accesses);

    // Keep last 500 accesses
    const log = this.accessLog.get(processId)!;
    if (log.length > 500) {
      log.splice(0, log.length - 500);
    }
  }

  getAccessLog(processId: number): BufferAccess[] {
    return this.accessLog.get(processId) || [];
  }

  getDetectionHistory(processId: number): Threat[] {
    return this.detectionHistory.get(processId) || [];
  }

  clearLogs(processId?: number): void {
    if (processId) {
      this.accessLog.delete(processId);
      this.detectionHistory.delete(processId);
    } else {
      this.accessLog.clear();
      this.detectionHistory.clear();
    }
  }
}

export default BufferOverflowBlocker;
