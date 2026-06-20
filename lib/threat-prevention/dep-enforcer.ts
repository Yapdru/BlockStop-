import { Threat } from './types';
import { generateThreatId } from './utils';

interface MemoryPage {
  address: bigint;
  pageSize: number;
  readable: boolean;
  writable: boolean;
  executable: boolean;
  protected: boolean;
}

interface ExecutionAttempt {
  address: bigint;
  processId: number;
  timestamp: number;
  context?: string; // Call stack or context info
}

export class DEPEnforcer {
  private pageProtection: Map<number, Map<bigint, MemoryPage>> = new Map();
  private executionAttempts: Map<number, ExecutionAttempt[]> = new Map();
  private violations: Map<number, Threat[]> = new Map();

  async enforceDEP(
    processId: number,
    pages: MemoryPage[]
  ): Promise<Threat | null> {
    const issues = this.validateDEPPolicy(pages);

    if (issues.length === 0) {
      this.storePages(processId, pages);
      return null;
    }

    const threat: Threat = {
      id: generateThreatId(),
      type: 'BUFFER_OVERFLOW',
      severity: 'CRITICAL',
      timestamp: Date.now(),
      source: 'DEPEnforcer',
      description: `DEP violation detected: ${issues.join(', ')}`,
      processId,
      behaviorIndicators: issues,
      metadata: {
        pagesAnalyzed: pages.length,
        violatingPages: pages.filter(
          (p) => p.writable && p.executable
        ).length,
      },
    };

    this.recordViolation(processId, threat);
    this.storePages(processId, pages);

    return threat;
  }

  async detectExecutionViolation(
    processId: number,
    attempt: ExecutionAttempt
  ): Promise<Threat | null> {
    const pageMap = this.pageProtection.get(processId);
    if (!pageMap) {
      this.recordAttempt(processId, attempt);
      return null;
    }

    // Check if execution address is in a non-executable page
    for (const [addr, page] of pageMap) {
      if (
        attempt.address >= addr &&
        attempt.address < addr + BigInt(page.pageSize) &&
        !page.executable
      ) {
        const threat: Threat = {
          id: generateThreatId(),
          type: 'BUFFER_OVERFLOW',
          severity: 'CRITICAL',
          timestamp: attempt.timestamp,
          source: 'DEPEnforcer',
          description: `Code execution attempt in non-executable page: ${attempt.address.toString()}`,
          processId,
          behaviorIndicators: ['dep_violation', 'non_executable_execution'],
          metadata: {
            address: attempt.address.toString(),
            pageAddress: addr.toString(),
            context: attempt.context,
          },
        };

        this.recordViolation(processId, threat);
        this.recordAttempt(processId, attempt);

        return threat;
      }
    }

    this.recordAttempt(processId, attempt);
    return null;
  }

  private validateDEPPolicy(pages: MemoryPage[]): string[] {
    const issues: string[] = [];

    for (const page of pages) {
      // Check for W^X violations
      if (page.writable && page.executable) {
        issues.push('wx_violation');
      }

      // Check for heap pages that are executable
      if (
        page.executable &&
        !page.protected &&
        page.address < BigInt('0x7FFFFFFF')
      ) {
        // Rough heuristic for heap/data section
        issues.push('executable_heap_or_data');
      }

      // Check if DEP is enforced
      if (!page.protected && page.executable) {
        issues.push('dep_not_enforced');
      }
    }

    // Check for contiguous RWX regions (highly suspicious)
    const sortedPages = [...pages].sort((a, b) =>
      a.address > b.address ? 1 : -1
    );

    for (let i = 0; i < sortedPages.length - 1; i++) {
      const current = sortedPages[i];
      const next = sortedPages[i + 1];

      if (
        current.writable &&
        current.executable &&
        next.readable &&
        next.executable &&
        current.address + BigInt(current.pageSize) === next.address
      ) {
        issues.push('contiguous_rwx_region');
      }
    }

    return [...new Set(issues)];
  }

  private storePages(processId: number, pages: MemoryPage[]): void {
    let pageMap = this.pageProtection.get(processId);
    if (!pageMap) {
      pageMap = new Map();
      this.pageProtection.set(processId, pageMap);
    }

    for (const page of pages) {
      pageMap.set(page.address, page);
    }

    // Limit to 10000 pages per process
    if (pageMap.size > 10000) {
      const entriesToRemove = pageMap.size - 10000;
      const entries = Array.from(pageMap.entries());
      for (let i = 0; i < entriesToRemove; i++) {
        pageMap.delete(entries[i][0]);
      }
    }
  }

  private recordAttempt(processId: number, attempt: ExecutionAttempt): void {
    if (!this.executionAttempts.has(processId)) {
      this.executionAttempts.set(processId, []);
    }

    this.executionAttempts.get(processId)!.push(attempt);

    // Keep last 500 attempts
    const attempts = this.executionAttempts.get(processId)!;
    if (attempts.length > 500) {
      attempts.shift();
    }
  }

  private recordViolation(processId: number, threat: Threat): void {
    if (!this.violations.has(processId)) {
      this.violations.set(processId, []);
    }

    this.violations.get(processId)!.push(threat);

    // Keep last 100 violations
    const viols = this.violations.get(processId)!;
    if (viols.length > 100) {
      viols.shift();
    }
  }

  isPageExecutable(processId: number, address: bigint): boolean {
    const pageMap = this.pageProtection.get(processId);
    if (!pageMap) return false;

    for (const [addr, page] of pageMap) {
      if (
        address >= addr &&
        address < addr + BigInt(page.pageSize)
      ) {
        return page.executable;
      }
    }

    return false;
  }

  getExecutionAttempts(processId: number): ExecutionAttempt[] {
    return this.executionAttempts.get(processId) || [];
  }

  getViolations(processId: number): Threat[] {
    return this.violations.get(processId) || [];
  }

  clearData(processId?: number): void {
    if (processId) {
      this.pageProtection.delete(processId);
      this.executionAttempts.delete(processId);
      this.violations.delete(processId);
    } else {
      this.pageProtection.clear();
      this.executionAttempts.clear();
      this.violations.clear();
    }
  }
}

export default DEPEnforcer;
