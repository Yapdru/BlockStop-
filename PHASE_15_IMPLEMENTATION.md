# Phase 15 Implementation Guide: File Dependencies & Build Checklist

## PHASE 15a: THREAT INTELLIGENCE & HUNTING

### Step 1: Database Schema Migration
**File**: `/blockos/init-db.sql` (append Phase 15a section after line 202)
```sql
-- PHASE 15a: THREAT INTELLIGENCE & HUNTING
CREATE TABLE threat_intelligence (
    id SERIAL PRIMARY KEY,
    ioc_value VARCHAR(500) NOT NULL,
    ioc_type VARCHAR(20),
    severity INTEGER,
    confidence DECIMAL(3,2),
    sources TEXT[],
    first_seen TIMESTAMP,
    last_seen TIMESTAMP,
    related_threats JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ioc_value, ioc_type)
);
CREATE INDEX idx_threat_intel_ioc ON threat_intelligence(ioc_value);
CREATE INDEX idx_threat_intel_severity ON threat_intelligence(severity);

CREATE TABLE threat_actors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    aliases TEXT[],
    motivations TEXT[],
    capabilities TEXT[],
    targeted_sectors TEXT[],
    risk_level VARCHAR(20),
    last_active TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE threat_correlations (
    id SERIAL PRIMARY KEY,
    threat_id_1 VARCHAR(100),
    threat_id_2 VARCHAR(100),
    correlation_score DECIMAL(3,2),
    common_iocs TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_correlations_threats ON threat_correlations(threat_id_1, threat_id_2);

CREATE TABLE threat_lifecycle (
    id SERIAL PRIMARY KEY,
    threat_id VARCHAR(100) UNIQUE,
    current_stage VARCHAR(20),
    indicators JSONB,
    confidence DECIMAL(3,2),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Depends on**: `/lib/db.ts` (query helper)

---

### Step 2: Type Definitions
**New file**: `/types/threat-hunting.ts`
```typescript
export interface IOCRecord {
  id: number;
  iocValue: string;
  iocType: 'ip' | 'domain' | 'hash' | 'url' | 'email' | 'cert';
  severity: number; // 0-100
  confidence: number; // 0-1
  sources: string[];
  firstSeen: Date;
  lastSeen: Date;
  relatedThreats: string[];
}

export interface ThreatActorRecord {
  id: number;
  name: string;
  aliases: string[];
  motivations: string[];
  capabilities: string[];
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  lastActive: Date;
}

export interface CorrelationResult {
  threatId1: string;
  threatId2: string;
  correlationScore: number;
  commonIOCs: string[];
  commonActors: string[];
}

export interface ThreatLifecycleData {
  threatId: string;
  currentStage: 'emerging' | 'growing' | 'peak' | 'declining' | 'dormant';
  confidence: number;
  indicators: Record<string, unknown>;
}
```

**Depends on**: `/lib/threat-analytics/types.ts` (extends existing threat types)

---

### Step 3: Core Library Module
**New file**: `/lib/threat-hunting/ioc-resolver.ts`
```typescript
import { query } from '@/lib/db';
import type { IOCRecord } from '@/types/threat-hunting';

export async function enrichIOC(iocValue: string, iocType: string): Promise<IOCRecord | null> {
  const result = await query(
    'SELECT * FROM threat_intelligence WHERE ioc_value = $1 AND ioc_type = $2',
    [iocValue, iocType]
  );
  return result.rows[0] || null;
}

export async function searchIOCsByType(iocType: string, limit = 100): Promise<IOCRecord[]> {
  const result = await query(
    'SELECT * FROM threat_intelligence WHERE ioc_type = $1 ORDER BY severity DESC LIMIT $2',
    [iocType, limit]
  );
  return result.rows;
}

export async function recordIOCObservation(
  userId: number,
  iocValue: string,
  iocType: string,
  context: Record<string, unknown>
): Promise<void> {
  // Upsert into threat_intelligence, log in audit_logs
  await query(
    `INSERT INTO threat_intelligence (ioc_value, ioc_type, last_seen, related_threats)
     VALUES ($1, $2, NOW(), $3)
     ON CONFLICT (ioc_value, ioc_type) DO UPDATE SET last_seen = NOW()`,
    [iocValue, iocType, JSON.stringify(context)]
  );
}
```

**New file**: `/lib/threat-hunting/correlation-engine.ts`
```typescript
import { query } from '@/lib/db';
import type { CorrelationResult } from '@/types/threat-hunting';

export async function correlateThreats(threatIds: string[]): Promise<CorrelationResult[]> {
  if (threatIds.length < 2) return [];
  
  const results = await query(
    `SELECT threat_id_1, threat_id_2, correlation_score, common_iocs
     FROM threat_correlations
     WHERE (threat_id_1 = ANY($1) OR threat_id_2 = ANY($1))
     ORDER BY correlation_score DESC`,
    [threatIds]
  );
  
  return results.rows;
}

export async function calculateCorrelation(
  threatId1: string,
  threatId2: string
): Promise<number> {
  // Compute Jaccard similarity on IOCs + actor match
  const iocs1 = await query(
    'SELECT related_threats FROM threat_intelligence WHERE id = $1',
    [threatId1]
  );
  // Similarity logic...
  return 0.75; // example
}

export async function storeCorrelation(
  threatId1: string,
  threatId2: string,
  score: number,
  commonIOCs: string[]
): Promise<void> {
  await query(
    `INSERT INTO threat_correlations (threat_id_1, threat_id_2, correlation_score, common_iocs)
     VALUES ($1, $2, $3, $4)`,
    [threatId1, threatId2, score, commonIOCs]
  );
}
```

**New file**: `/lib/threat-hunting/actor-profiler.ts`
```typescript
import { query } from '@/lib/db';
import type { ThreatActorRecord } from '@/types/threat-hunting';

export async function getActorProfile(actorName: string): Promise<ThreatActorRecord | null> {
  const result = await query(
    'SELECT * FROM threat_actors WHERE name = $1',
    [actorName]
  );
  return result.rows[0] || null;
}

export async function matchIOCsToActor(iocValues: string[]): Promise<ThreatActorRecord[]> {
  // Query threat_correlations to find actors matching IOCs
  const result = await query(
    `SELECT DISTINCT ta.* FROM threat_actors ta
     JOIN threat_intelligence ti ON ti.related_threats @> ARRAY[ta.name]
     WHERE ti.ioc_value = ANY($1)`,
    [iocValues]
  );
  return result.rows;
}
```

**New file**: `/lib/threat-hunting/lifecycle-tracker.ts`
```typescript
import { query } from '@/lib/db';
import type { ThreatLifecycleData } from '@/types/threat-hunting';

export async function getThreatLifecycle(threatId: string): Promise<ThreatLifecycleData | null> {
  const result = await query(
    'SELECT * FROM threat_lifecycle WHERE threat_id = $1',
    [threatId]
  );
  return result.rows[0] || null;
}

export async function predictThreatStage(threatId: string): Promise<'emerging' | 'growing' | 'peak' | 'declining' | 'dormant'> {
  // Use TensorFlow.js model on indicators + temporal trend
  // Simplified: check observation frequency
  const counts = await query(
    `SELECT DATE(created_at), COUNT(*) as count
     FROM threat_intelligence
     WHERE related_threats @> ARRAY[$1]
     GROUP BY DATE(created_at)
     ORDER BY DATE(created_at) DESC
     LIMIT 7`,
    [threatId]
  );
  
  if (counts.rows.length < 2) return 'emerging';
  // Compare trend...
  return 'growing';
}
```

**Depends on**: `/lib/db.ts`, `/lib/threat-analytics/types.ts`

---

### Step 4: API Routes
**New file**: `/app/api/threat-hunting/search/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { enrichIOC } from '@/lib/threat-hunting/ioc-resolver';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { ioc, type } = await req.json();
  const enriched = await enrichIOC(ioc, type);
  
  return NextResponse.json(enriched || { ioc, type, severity: 0 });
}
```

**New file**: `/app/api/threat-hunting/correlate/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { correlateThreats } from '@/lib/threat-hunting/correlation-engine';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { threatIds } = await req.json();
  const correlations = await correlateThreats(threatIds);
  
  return NextResponse.json({ correlations });
}
```

**New file**: `/app/api/threat-hunting/profile/route.ts`
```typescript
import { getActorProfile, matchIOCsToActor } from '@/lib/threat-hunting/actor-profiler';

export async function POST(req: NextRequest) {
  const { actorName, iocs } = await req.json();
  
  const profile = actorName 
    ? await getActorProfile(actorName)
    : await matchIOCsToActor(iocs);
  
  return NextResponse.json(profile);
}
```

**New file**: `/app/api/threat-hunting/lifecycle/route.ts`
```typescript
import { getThreatLifecycle, predictThreatStage } from '@/lib/threat-hunting/lifecycle-tracker';

export async function POST(req: NextRequest) {
  const { threatId } = await req.json();
  
  const lifecycle = await getThreatLifecycle(threatId);
  const predictedStage = await predictThreatStage(threatId);
  
  return NextResponse.json({ ...lifecycle, predictedStage });
}
```

**Depends on**: `/lib/threat-hunting/*`, NextAuth session validation

---

## PHASE 15b: ENTERPRISE LOGGING & COMPLIANCE

### Step 1: Database Schema
**File**: `/blockos/init-db.sql` (append Phase 15b section)
```sql
-- PHASE 15b: ENTERPRISE LOGGING & COMPLIANCE
CREATE TABLE compliance_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    changes JSONB,
    ip_address INET,
    user_agent VARCHAR(500),
    status VARCHAR(20),
    content_hash VARCHAR(64),
    previous_hash VARCHAR(64),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX idx_compliance_logs_user_timestamp ON compliance_logs(user_id, timestamp);
CREATE INDEX idx_compliance_logs_team_timestamp ON compliance_logs(team_id, timestamp);

CREATE TABLE retention_policies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    resource_types TEXT[],
    retention_days INTEGER,
    archive_after_days INTEGER,
    encryption_required BOOLEAN DEFAULT TRUE,
    apply_to_teams JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_archive (
    id SERIAL PRIMARY KEY,
    archive_date DATE,
    record_count INTEGER,
    size_bytes BIGINT,
    hash VARCHAR(64),
    s3_path VARCHAR(500),
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE evidence_chain (
    id SERIAL PRIMARY KEY,
    threat_id VARCHAR(100),
    evidence_type VARCHAR(50),
    content BYTEA,
    content_hash VARCHAR(64),
    collected_by INTEGER REFERENCES users(id),
    collected_at TIMESTAMP,
    chain_verified BOOLEAN DEFAULT FALSE,
    chain_hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Step 2: Types
**New file**: `/types/audit-logging.ts`
```typescript
export interface ComplianceLog {
  id: number;
  userId?: number;
  teamId?: number;
  action: string;
  resourceType?: string;
  resourceId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  status: 'success' | 'failure' | 'rejected';
  contentHash: string;
  previousHash?: string;
  timestamp: Date;
}

export interface RetentionPolicy {
  id: number;
  name: string;
  resourceTypes: string[];
  retentionDays: number;
  archiveAfterDays: number;
  encryptionRequired: boolean;
  applyToTeams?: number[];
}

export interface EvidenceChainEntry {
  id: number;
  threatId: string;
  evidenceType: string;
  contentHash: string;
  collectedBy: number;
  collectedAt: Date;
  chainHash: string;
  chainVerified: boolean;
}
```

### Step 3: Core Libraries
**New file**: `/lib/audit-logging/log-formatter.ts`
```typescript
import crypto from 'crypto';

export function formatAuditLog(
  action: string,
  userId: number,
  resourceType: string,
  changes?: Record<string, unknown>,
  ipAddress?: string
): {
  action: string;
  userId: number;
  resourceType: string;
  changes: string;
  ipAddress: string;
  timestamp: number;
  contentHash: string;
} {
  const content = JSON.stringify({ action, userId, resourceType, changes, timestamp: Date.now() });
  const contentHash = crypto.createHash('sha256').update(content).digest('hex');
  
  return {
    action,
    userId,
    resourceType,
    changes: JSON.stringify(changes),
    ipAddress: ipAddress || 'unknown',
    timestamp: Date.now(),
    contentHash,
  };
}
```

**New file**: `/lib/audit-logging/chain-of-custody.ts`
```typescript
import crypto from 'crypto';
import { query } from '@/lib/db';

export async function createHashChain(
  threatId: string,
  evidenceContent: string,
  collectedBy: number
): Promise<string> {
  const contentHash = crypto.createHash('sha256').update(evidenceContent).digest('hex');
  
  // Get previous hash in chain
  const prevResult = await query(
    'SELECT chain_hash FROM evidence_chain WHERE threat_id = $1 ORDER BY created_at DESC LIMIT 1',
    [threatId]
  );
  
  const previousHash = prevResult.rows[0]?.chain_hash || '';
  const chainContent = previousHash + contentHash;
  const chainHash = crypto.createHash('sha256').update(chainContent).digest('hex');
  
  // Store in DB
  await query(
    `INSERT INTO evidence_chain (threat_id, evidence_type, content, content_hash, collected_by, collected_at, chain_hash, chain_verified)
     VALUES ($1, 'scan_result', $2, $3, $4, NOW(), $5, TRUE)`,
    [threatId, evidenceContent, contentHash, collectedBy, chainHash]
  );
  
  return chainHash;
}

export async function verifyChain(threatId: string): Promise<boolean> {
  const entries = await query(
    'SELECT content_hash, chain_hash FROM evidence_chain WHERE threat_id = $1 ORDER BY created_at ASC',
    [threatId]
  );
  
  if (entries.rows.length === 0) return false;
  
  let expectedPrevious = '';
  for (const entry of entries.rows) {
    const expectedChainHash = crypto
      .createHash('sha256')
      .update(expectedPrevious + entry.content_hash)
      .digest('hex');
    
    if (expectedChainHash !== entry.chain_hash) return false;
    expectedPrevious = entry.chain_hash;
  }
  
  return true;
}
```

**New file**: `/lib/audit-logging/policy-engine.ts`
```typescript
import { query } from '@/lib/db';
import type { RetentionPolicy } from '@/types/audit-logging';

export async function getApplicablePolicy(resourceType: string, teamId?: number): Promise<RetentionPolicy | null> {
  const result = await query(
    `SELECT * FROM retention_policies
     WHERE resource_types @> ARRAY[$1]
     AND (apply_to_teams IS NULL OR apply_to_teams @> ARRAY[$2]::jsonb[])
     LIMIT 1`,
    [resourceType, teamId || null]
  );
  return result.rows[0] || null;
}

export async function enforceRetention(): Promise<number> {
  const policies = await query('SELECT * FROM retention_policies');
  
  let deleted = 0;
  for (const policy of policies.rows) {
    const cutoffDate = new Date(Date.now() - policy.retention_days * 86400000);
    
    const result = await query(
      `DELETE FROM compliance_logs
       WHERE timestamp < $1 AND resource_type = ANY($2)
       RETURNING id`,
      [cutoffDate, policy.resource_types]
    );
    
    deleted += result.rowCount || 0;
  }
  
  return deleted;
}
```

### Step 4: API Routes
**New file**: `/app/api/logging/audit/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 86400000).toISOString();
  const endDate = searchParams.get('endDate') || new Date().toISOString();
  const limit = parseInt(searchParams.get('limit') || '100');
  
  const result = await query(
    `SELECT * FROM compliance_logs
     WHERE timestamp BETWEEN $1::timestamp AND $2::timestamp
     ORDER BY timestamp DESC
     LIMIT $3`,
    [startDate, endDate, limit]
  );
  
  return NextResponse.json({ logs: result.rows, totalCount: result.rowCount });
}
```

**New file**: `/app/api/logging/export/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { logIds, format } = await req.json();
  
  // Fetch logs, format as PDF/JSON-LD/Syslog, sign
  const signature = Buffer.from('mock-sig').toString('base64');
  
  return NextResponse.json({
    downloadUrl: `/tmp/export-${Date.now()}.${format}`,
    verificationHash: signature,
  });
}
```

**New file**: `/app/api/logging/verify/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyChain } from '@/lib/audit-logging/chain-of-custody';

export async function POST(req: NextRequest) {
  const { threatId } = await req.json();
  const valid = await verifyChain(threatId);
  
  return NextResponse.json({ verified: valid, integrityStatus: valid ? 'INTACT' : 'COMPROMISED' });
}
```

---

## PHASE 15c: REAL-TIME THREAT RESPONSE AUTOMATION

### Step 1: Database Schema
**File**: `/blockos/init-db.sql` (append Phase 15c section)
```sql
-- PHASE 15c: RESPONSE AUTOMATION
CREATE TABLE automation_playbooks (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_conditions JSONB,
    actions JSONB[],
    escalation_path TEXT[],
    approval_required BOOLEAN DEFAULT FALSE,
    enabled BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_playbooks_team_enabled ON automation_playbooks(team_id, enabled);

CREATE TABLE response_actions (
    id SERIAL PRIMARY KEY,
    playbook_id INTEGER REFERENCES automation_playbooks(id),
    threat_id VARCHAR(100),
    action_type VARCHAR(50),
    status VARCHAR(20),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    result JSONB,
    error_details TEXT,
    executed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_response_actions_threat ON response_actions(threat_id);
CREATE INDEX idx_response_actions_status ON response_actions(status);

CREATE TABLE escalation_rules (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id),
    condition_type VARCHAR(50),
    condition_value VARCHAR(100),
    escalate_to VARCHAR(100),
    notify_emails TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Step 2: Types
**New file**: `/types/response-automation.ts`
```typescript
export interface AutomationPlaybook {
  id: number;
  teamId: number;
  name: string;
  description?: string;
  triggerConditions: Record<string, unknown>;
  actions: ResponseAction[];
  escalationPath: string[];
  approvalRequired: boolean;
  enabled: boolean;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResponseAction {
  id?: number;
  playbookId: number;
  threatId: string;
  actionType: 'quarantine' | 'isolate' | 'block' | 'notify' | 'remediate';
  status: 'pending' | 'executing' | 'success' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  result?: Record<string, unknown>;
  errorDetails?: string;
  executedBy?: number;
}

export interface EscalationRule {
  id: number;
  teamId: number;
  conditionType: string;
  conditionValue: string;
  escalateTo: string;
  notifyEmails: string[];
}
```

### Step 3: Core Libraries
**New file**: `/lib/response-automation/playbook-executor.ts`
```typescript
import { query } from '@/lib/db';
import { dispatchAction } from './action-dispatcher';
import type { AutomationPlaybook, ResponseAction } from '@/types/response-automation';

export async function getPlaybook(playbookId: number): Promise<AutomationPlaybook | null> {
  const result = await query('SELECT * FROM automation_playbooks WHERE id = $1', [playbookId]);
  return result.rows[0] || null;
}

export async function executePlaybook(
  playbookId: number,
  threatId: string,
  userId: number
): Promise<{ executionId: string; actionQueue: ResponseAction[] }> {
  const playbook = await getPlaybook(playbookId);
  if (!playbook || !playbook.enabled) throw new Error('Playbook not found or disabled');
  
  const executionId = `exec-${Date.now()}`;
  const actionQueue: ResponseAction[] = [];
  
  for (const actionTemplate of playbook.actions) {
    const action = await dispatchAction(
      playbookId,
      threatId,
      actionTemplate.actionType,
      userId,
      playbook.approvalRequired
    );
    actionQueue.push(action);
  }
  
  return { executionId, actionQueue };
}

export async function createPlaybook(
  teamId: number,
  name: string,
  triggers: Record<string, unknown>,
  actions: ResponseAction[],
  userId: number
): Promise<number> {
  const result = await query(
    `INSERT INTO automation_playbooks (team_id, name, trigger_conditions, actions, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [teamId, name, JSON.stringify(triggers), JSON.stringify(actions), userId]
  );
  return result.rows[0].id;
}
```

**New file**: `/lib/response-automation/action-dispatcher.ts`
```typescript
import { query } from '@/lib/db';

export async function dispatchAction(
  playbookId: number,
  threatId: string,
  actionType: string,
  userId: number,
  requiresApproval: boolean
): Promise<any> {
  const status = requiresApproval ? 'pending' : 'executing';
  
  const result = await query(
    `INSERT INTO response_actions (playbook_id, threat_id, action_type, status, started_at, executed_by)
     VALUES ($1, $2, $3, $4, NOW(), $5)
     RETURNING *`,
    [playbookId, threatId, actionType, status, userId]
  );
  
  const action = result.rows[0];
  
  if (status === 'executing') {
    // Queue async job (Bull, etc.)
    // await responseQueue.add({ actionId: action.id, threatId, actionType });
  }
  
  return action;
}

export async function executeAction(actionId: number): Promise<void> {
  const action = await query('SELECT * FROM response_actions WHERE id = $1', [actionId]);
  
  if (!action.rows[0]) return;
  
  const { action_type: actionType, threat_id: threatId } = action.rows[0];
  
  try {
    let result;
    switch (actionType) {
      case 'quarantine':
        result = await quarantineThreat(threatId);
        break;
      case 'isolate':
        result = await isolateThreat(threatId);
        break;
      case 'block':
        result = await blockIOC(threatId);
        break;
      case 'notify':
        result = await notifyTeam(threatId);
        break;
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
    
    await query(
      'UPDATE response_actions SET status = $1, result = $2, completed_at = NOW() WHERE id = $3',
      ['success', JSON.stringify(result), actionId]
    );
  } catch (error) {
    await query(
      'UPDATE response_actions SET status = $1, error_details = $2, completed_at = NOW() WHERE id = $3',
      ['failed', String(error), actionId]
    );
  }
}

async function quarantineThreat(threatId: string): Promise<any> {
  // Implementation: Move file to quarantine, block network, etc.
  return { quarantined: true, threatId };
}

async function isolateThreat(threatId: string): Promise<any> {
  return { isolated: true, threatId };
}

async function blockIOC(threatId: string): Promise<any> {
  return { blocked: true, threatId };
}

async function notifyTeam(threatId: string): Promise<any> {
  return { notified: true, threatId };
}
```

**New file**: `/lib/response-automation/escalation-logic.ts`
```typescript
import { query } from '@/lib/db';

export async function evaluateEscalation(threatId: string, severity: number): Promise<string[]> {
  const rules = await query(
    `SELECT * FROM escalation_rules
     WHERE condition_type = 'severity' AND CAST(condition_value AS INTEGER) <= $1`,
    [severity]
  );
  
  return rules.rows.map(r => r.escalate_to);
}

export async function createEscalationRule(
  teamId: number,
  conditionType: string,
  conditionValue: string,
  escalateTo: string,
  notifyEmails: string[]
): Promise<void> {
  await query(
    `INSERT INTO escalation_rules (team_id, condition_type, condition_value, escalate_to, notify_emails)
     VALUES ($1, $2, $3, $4, $5)`,
    [teamId, conditionType, conditionValue, escalateTo, notifyEmails]
  );
}
```

### Step 4: API Routes
**New file**: `/app/api/response/execute/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { executePlaybook } from '@/lib/response-automation/playbook-executor';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { playbookId, threatId } = await req.json();
  
  try {
    const result = await executePlaybook(playbookId, threatId, session.user.id);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 400 });
  }
}
```

**New file**: `/app/api/response/escalate/route.ts`
```typescript
import { evaluateEscalation } from '@/lib/response-automation/escalation-logic';

export async function POST(req: NextRequest) {
  const { threatId, severity } = await req.json();
  const escalationPaths = await evaluateEscalation(threatId, severity);
  
  return NextResponse.json({ escalationId: `esc-${Date.now()}`, targets: escalationPaths });
}
```

---

## INTEGRATION CHECKLIST

### Across Phases
- [ ] **Import threat types in components**: `import type { IOCRecord } from '@/types/threat-hunting'`
- [ ] **Audit logging hook**: All API mutations (email scan, file scan, playbook create) call `formatAuditLog()` and insert into `compliance_logs`
- [ ] **Reuse CorrelationGraph component**: Render in both threat hunt results (15a) + response action chains (15c)
- [ ] **Pagination**: Limit queries to 100 by default, support `offset` / `limit` params

### Dependencies Between Phases
- 15a IOC enrichment → Used by 15c playbook conditions (e.g., "if IOC severity > 70")
- 15b Audit logs → Records 15a hunt queries + 15c action execution
- 15c Response actions → Update threat_intelligence table with observation timestamp

### Testing Fixtures
```sql
INSERT INTO threat_intelligence (ioc_value, ioc_type, severity, confidence)
VALUES ('192.168.1.1', 'ip', 85, 0.92);

INSERT INTO threat_actors (name, risk_level, last_active)
VALUES ('Lazarus Group', 'critical', NOW());

INSERT INTO automation_playbooks (team_id, name, enabled, created_by)
VALUES (1, 'High Severity Block', TRUE, 1);
```

