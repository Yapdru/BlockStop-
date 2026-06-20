# Phase 15 Build Checklist

## Pre-Build (Week 0)

- [ ] Review all four architecture documents:
  - PHASE_15_ARCHITECTURE.md (overview + strategy)
  - PHASE_15_IMPLEMENTATION.md (file-by-file guide)
  - PHASE_15_SUMMARY.md (executive summary)
  - PHASE_15_DIAGRAMS.md (visual references)

- [ ] Set up development environment:
  - [ ] Clone/pull latest main branch
  - [ ] Ensure PostgreSQL 13+ running locally
  - [ ] Create feature branch: `git checkout -b phase-15-enterprise-ops`
  - [ ] Run existing tests: `npm test`

- [ ] Staging database:
  - [ ] Backup production database
  - [ ] Create staging clone from backup
  - [ ] Test schema migration on staging first

---

## Phase 15a: Threat Intelligence & Hunting (Week 1-2)

### Step 1: Database Schema
- [ ] Edit `/blockos/init-db.sql`
  - [ ] Add PHASE 15a section comment at line ~202
  - [ ] CREATE TABLE threat_intelligence (IOCs, severity, confidence, sources)
  - [ ] CREATE TABLE threat_actors (name, aliases, capabilities, riskLevel)
  - [ ] CREATE TABLE threat_correlations (threat pairs, score)
  - [ ] CREATE TABLE threat_lifecycle (stage prediction)
  - [ ] CREATE INDEX statements (11 total across all phases)

- [ ] Run migration:
  ```bash
  psql -d $DATABASE_URL -f blockos/init-db.sql
  ```

- [ ] Verify tables created:
  ```sql
  SELECT * FROM information_schema.tables 
  WHERE table_name LIKE 'threat_%' OR table_name LIKE 'compliance_%' 
  OR table_name LIKE 'automation_%';
  ```

### Step 2: Type Definitions
- [ ] Create `/types/threat-hunting.ts`
  - [ ] Export IOCRecord interface
  - [ ] Export ThreatActorRecord interface
  - [ ] Export CorrelationResult interface
  - [ ] Export ThreatLifecycleData interface

- [ ] Run TypeScript check:
  ```bash
  npx tsc --noEmit
  ```

### Step 3: Library Modules
- [ ] Create `/lib/threat-hunting/` directory
- [ ] Create `/lib/threat-hunting/ioc-resolver.ts`
  - [ ] Function: enrichIOC(iocValue, iocType)
  - [ ] Function: searchIOCsByType(iocType, limit)
  - [ ] Function: recordIOCObservation(userId, ioc, context)
  - [ ] All use `import { query } from '@/lib/db'`

- [ ] Create `/lib/threat-hunting/correlation-engine.ts`
  - [ ] Function: correlateThreats(threatIds[])
  - [ ] Function: calculateCorrelation(threatId1, threatId2)
  - [ ] Function: storeCorrelation(threatId1, threatId2, score, iocs)
  - [ ] Logic: Jaccard similarity on IOCs + actor match

- [ ] Create `/lib/threat-hunting/actor-profiler.ts`
  - [ ] Function: getActorProfile(actorName)
  - [ ] Function: matchIOCsToActor(iocValues[])
  - [ ] Returns: ThreatActorRecord with capabilities

- [ ] Create `/lib/threat-hunting/lifecycle-tracker.ts`
  - [ ] Function: getThreatLifecycle(threatId)
  - [ ] Function: predictThreatStage(threatId)
  - [ ] Use TensorFlow.js for trend analysis (simple LSTM or heuristic)

### Step 4: API Routes
- [ ] Create `/app/api/threat-hunting/` directory
- [ ] Create `/app/api/threat-hunting/search/route.ts`
  - [ ] POST method, NextAuth validation
  - [ ] Extract { ioc, type } from body
  - [ ] Call enrichIOC(), return enriched IOCRecord

- [ ] Create `/app/api/threat-hunting/correlate/route.ts`
  - [ ] POST method, NextAuth validation
  - [ ] Extract { threatIds } from body
  - [ ] Call correlateThreats(), return correlations array

- [ ] Create `/app/api/threat-hunting/profile/route.ts`
  - [ ] POST method, NextAuth validation
  - [ ] Extract { actorName } OR { iocs } from body
  - [ ] Call getActorProfile() or matchIOCsToActor()

- [ ] Create `/app/api/threat-hunting/lifecycle/route.ts`
  - [ ] POST method, NextAuth validation
  - [ ] Extract { threatId } from body
  - [ ] Return lifecycle data + predicted stage

- [ ] Test endpoints:
  ```bash
  curl -X POST http://localhost:3000/api/threat-hunting/search \
    -H "Content-Type: application/json" \
    -d '{"ioc": "192.168.1.1", "type": "ip"}'
  ```

### Step 5: Unit Tests (15a)
- [ ] Create `/lib/threat-hunting/__tests__/correlation-engine.test.ts`
  - [ ] Test: Jaccard similarity = 0.75 for 2 threats with 3 common IOCs
  - [ ] Test: Actor match weight = 0.35 of total score
  - [ ] Test: Temporal proximity < 24h = score 1.0

- [ ] Create `/app/api/threat-hunting/__tests__/search.test.ts`
  - [ ] Mock query() to return IOCRecord
  - [ ] Verify enrichIOC called with correct parameters
  - [ ] Check HTTP 401 if no session

- [ ] Run tests:
  ```bash
  npm test -- --testPathPattern="threat-hunting"
  ```

---

## Phase 15b: Enterprise Logging & Compliance (Week 2-3)

### Step 1: Database Schema (already added above)
- [ ] Verify tables in schema:
  - [ ] compliance_logs (immutable audit trail)
  - [ ] retention_policies (archival rules)
  - [ ] audit_archive (compressed batches)
  - [ ] evidence_chain (hash chain forensics)

### Step 2: Type Definitions
- [ ] Create `/types/audit-logging.ts`
  - [ ] Export ComplianceLog interface
  - [ ] Export RetentionPolicy interface
  - [ ] Export EvidenceChainEntry interface

### Step 3: Library Modules
- [ ] Create `/lib/audit-logging/` directory

- [ ] Create `/lib/audit-logging/log-formatter.ts`
  - [ ] Function: formatAuditLog(action, userId, resourceType, changes, ip)
  - [ ] Generate SHA256 contentHash
  - [ ] Return: { action, userId, contentHash, timestamp }
  - [ ] Dependency: `import crypto from 'crypto'`

- [ ] Create `/lib/audit-logging/chain-of-custody.ts`
  - [ ] Function: createHashChain(threatId, evidenceContent, collectedBy)
  - [ ] Query previous hash, chain them: SHA256(prevHash + contentHash)
  - [ ] INSERT into evidence_chain, return chainHash
  - [ ] Function: verifyChain(threatId)
  - [ ] Recompute each entry's hash, compare with stored chain_hash
  - [ ] Return: boolean (verified or compromised)

- [ ] Create `/lib/audit-logging/policy-engine.ts`
  - [ ] Function: getApplicablePolicy(resourceType, teamId)
  - [ ] Function: enforceRetention()
  - [ ] Run as scheduled job: DELETE old logs based on retention_days

### Step 4: API Routes
- [ ] Create `/app/api/logging/` directory

- [ ] Create `/app/api/logging/audit/route.ts`
  - [ ] GET method, NextAuth validation
  - [ ] Query params: startDate, endDate, limit (default 100)
  - [ ] Query compliance_logs with indexed WHERE
  - [ ] Return: { logs[], totalCount, hasMore }

- [ ] Create `/app/api/logging/export/route.ts`
  - [ ] POST method, NextAuth validation
  - [ ] Extract { logIds, format ("pdf"|"json-ld"|"syslog"), includeChain }
  - [ ] Verify hash chains
  - [ ] Format to requested format (can be stub initially)
  - [ ] Return: { downloadUrl, verificationHash }

- [ ] Create `/app/api/logging/verify/route.ts`
  - [ ] POST method, NextAuth validation
  - [ ] Extract { threatId }
  - [ ] Call verifyChain(threatId)
  - [ ] Return: { verified: boolean, integrityStatus: "INTACT"|"COMPROMISED" }

- [ ] Test endpoints:
  ```bash
  curl -X POST http://localhost:3000/api/logging/verify \
    -H "Content-Type: application/json" \
    -d '{"threatId": "threat-001"}'
  ```

### Step 5: Integration with Existing Endpoints
- [ ] Hook audit logging into existing scan endpoints:
  - [ ] `/app/api/email/check/route.ts`: Call formatAuditLog() after scan, INSERT compliance_logs
  - [ ] `/app/api/file/upload/route.ts`: Call formatAuditLog() after scan
  - [ ] `/app/api/auth/register/route.ts`: Log user creation event
  - [ ] `/app/api/teams/create/route.ts`: Log team creation event

- [ ] Add helper in `/lib/audit-logging/logger.ts`:
  ```typescript
  export async function logAction(
    userId: number | null,
    teamId: number | null,
    action: string,
    resourceType: string,
    resourceId: string | null,
    changes?: any,
    status: 'success' | 'failure' = 'success'
  ) {
    const formatted = formatAuditLog(action, userId, resourceType, changes, req.ip);
    await query(
      `INSERT INTO compliance_logs (...) VALUES (...)`,
      [userId, teamId, action, resourceType, resourceId, ...]
    );
  }
  ```

### Step 6: Unit Tests (15b)
- [ ] Create `/lib/audit-logging/__tests__/chain-of-custody.test.ts`
  - [ ] Test: createHashChain() generates valid SHA256
  - [ ] Test: verifyChain() returns true for valid chain
  - [ ] Test: verifyChain() returns false if entry modified

- [ ] Create `/app/api/logging/__tests__/verify.test.ts`
  - [ ] Test: Integrity check passes on clean chain
  - [ ] Test: Integrity check fails on modified entry

---

## Phase 15c: Real-time Threat Response Automation (Week 3-4)

### Step 1: Database Schema (already added above)
- [ ] Verify tables in schema:
  - [ ] automation_playbooks (templates)
  - [ ] response_actions (execution history)
  - [ ] escalation_rules (routing)

### Step 2: Type Definitions
- [ ] Create `/types/response-automation.ts`
  - [ ] Export AutomationPlaybook interface
  - [ ] Export ResponseAction interface
  - [ ] Export EscalationRule interface

### Step 3: Library Modules
- [ ] Create `/lib/response-automation/` directory

- [ ] Create `/lib/response-automation/playbook-executor.ts`
  - [ ] Function: getPlaybook(playbookId)
  - [ ] Function: executePlaybook(playbookId, threatId, userId)
  - [ ] For each action, call dispatchAction()
  - [ ] Return: { executionId, actionQueue[] }
  - [ ] Function: createPlaybook(teamId, name, triggers, actions, userId)

- [ ] Create `/lib/response-automation/action-dispatcher.ts`
  - [ ] Function: dispatchAction(playbookId, threatId, actionType, userId, requiresApproval)
  - [ ] INSERT into response_actions (status: pending or executing)
  - [ ] If executing: enqueue async job (Bull)
  - [ ] Function: executeAction(actionId)
  - [ ] Implementations: quarantineThreat(), isolateThreat(), blockIOC(), notifyTeam()
  - [ ] Update response_actions on completion (status, result, error)

- [ ] Create `/lib/response-automation/escalation-logic.ts`
  - [ ] Function: evaluateEscalation(threatId, severity)
  - [ ] Query escalation_rules for matching conditions
  - [ ] Return: escalationTargets[] (email, soar_webhook, slack)
  - [ ] Function: createEscalationRule(teamId, conditionType, conditionValue, escalateTo)

### Step 4: Bull Queue Integration
- [ ] Install Bull: `npm install bull redis`
- [ ] Create `/lib/queue.ts`:
  ```typescript
  import Queue from 'bull';
  
  export const responseQueue = new Queue('threat-response', {
    redis: { host: '127.0.0.1', port: 6379 }
  });
  
  responseQueue.process(async (job) => {
    const { actionId } = job.data;
    await executeAction(actionId);
  });
  ```

- [ ] In action-dispatcher.ts, dispatch job:
  ```typescript
  if (status === 'executing') {
    await responseQueue.add({ actionId: action.id });
  }
  ```

### Step 5: API Routes
- [ ] Create `/app/api/response/` directory

- [ ] Create `/app/api/response/execute/route.ts`
  - [ ] POST method, NextAuth validation (team admin only)
  - [ ] Extract { playbookId, threatId }
  - [ ] Call executePlaybook()
  - [ ] Return: { success: true, executionId, actionQueue }

- [ ] Create `/app/api/response/playbook/route.ts`
  - [ ] POST: createPlaybook(teamId, name, triggers, actions, userId)
  - [ ] PUT: updatePlaybook(playbookId, ...)
  - [ ] DELETE: disablePlaybook(playbookId)
  - [ ] GET: listPlaybooks(teamId)

- [ ] Create `/app/api/response/escalate/route.ts`
  - [ ] POST method, NextAuth validation
  - [ ] Extract { threatId, severity, escalationType }
  - [ ] Call evaluateEscalation()
  - [ ] Send notifications (email, webhook)
  - [ ] Return: { escalationId, recipientNotified, status }

- [ ] Test endpoints:
  ```bash
  curl -X POST http://localhost:3000/api/response/execute \
    -H "Content-Type: application/json" \
    -d '{"playbookId": 1, "threatId": "threat-001"}'
  ```

### Step 6: Unit Tests (15c)
- [ ] Create `/lib/response-automation/__tests__/playbook-executor.test.ts`
  - [ ] Test: executePlaybook() returns executionId
  - [ ] Test: actionQueue contains all actions from playbook

- [ ] Create `/lib/response-automation/__tests__/action-dispatcher.test.ts`
  - [ ] Test: dispatchAction() inserts row with correct status
  - [ ] Test: executeAction() updates status to success/failed

- [ ] Create `/lib/response-automation/__tests__/escalation-logic.test.ts`
  - [ ] Test: evaluateEscalation() filters by severity threshold
  - [ ] Test: Returns correct escalation targets

---

## Frontend Components (Week 4)

### Phase 15a: Threat Hunting UI
- [ ] Create `/components/ThreatHuntingDashboard.tsx`
  - [ ] Search bar for IOC input
  - [ ] Display enriched IOC details
  - [ ] Render CorrelationGraph for related threats

- [ ] Create `/components/IOCCard.tsx` (REUSABLE)
  - [ ] Display: iocValue, type, severity, confidence, sources
  - [ ] Props: ioc: IOCRecord, showRelated?: boolean
  - [ ] Used in: ThreatHuntingDashboard, AuditLog, ActionHistory

- [ ] Create `/components/CorrelationGraph.tsx` (REUSABLE)
  - [ ] D3.js network visualization
  - [ ] Nodes: threats, edges: correlations
  - [ ] Mode: "threats" (15a) or "actions" (15c)
  - [ ] Props: threatIds[], mode: string

### Phase 15b: Audit & Compliance UI
- [ ] Create `/components/AuditLog.tsx`
  - [ ] Date range filter
  - [ ] Action type filter
  - [ ] Display compliance_logs in table
  - [ ] Button: "Verify Chain" → POST /api/logging/verify
  - [ ] Button: "Export Evidence" → POST /api/logging/export

- [ ] Create `/components/ComplianceExport.tsx`
  - [ ] Dropdown: format (PDF, JSON-LD, Syslog)
  - [ ] Toggle: "Include hash chain?"
  - [ ] Download button
  - [ ] Display verification hash

### Phase 15c: Response Automation UI
- [ ] Create `/components/PlaybookEditor.tsx`
  - [ ] Drag-drop builder for actions
  - [ ] Add trigger conditions
  - [ ] Add escalation path
  - [ ] Save button → POST /api/response/playbook

- [ ] Create `/components/ActionHistory.tsx`
  - [ ] Display response_actions in timeline
  - [ ] Status: pending | executing | success | failed
  - [ ] Show action result/error
  - [ ] Render CorrelationGraph for action chain

### Reusable Hooks
- [ ] Create `/hooks/useIOCEnrichment.ts`
  ```typescript
  export function useIOCEnrichment(ioc: string) {
    const [data, setData] = useState<IOCRecord | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    // Call POST /api/threat-hunting/search
  }
  ```

- [ ] Create `/hooks/useThreatCorrelations.ts`
  ```typescript
  export function useThreatCorrelations(threatIds: string[]) {
    const [correlations, setCorrelations] = useState<CorrelationResult[]>([]);
    // Call POST /api/threat-hunting/correlate
  }
  ```

- [ ] Create `/hooks/usePlaybookTemplates.ts`
  ```typescript
  export function usePlaybookTemplates(teamId?: number) {
    const [playbooks, setPlaybooks] = useState<AutomationPlaybook[]>([]);
    // Call GET /api/response/playbook
  }
  ```

---

## Testing (Week 4)

### Unit Tests
- [ ] Run all unit tests:
  ```bash
  npm test -- --testPathPattern="(threat-hunting|audit-logging|response-automation)"
  ```

### Integration Tests
- [ ] Create `/e2e/phase-15-end-to-end.test.ts`
  - [ ] Test: Threat detected → IOC enriched → Playbook triggered → Action logged → Chain verified

- [ ] Run integration tests:
  ```bash
  npm test -- --testPathPattern="e2e"
  ```

### Load Tests
- [ ] Simulate 1000 concurrent hunts (optional, defer to post-launch)

---

## Deployment (Week 5)

### Pre-Deployment
- [ ] Code review of all new files
- [ ] Run full test suite:
  ```bash
  npm test
  npm run build
  ```

- [ ] Security audit:
  - [ ] All SQL uses parameterized queries (no injection)
  - [ ] All APIs require NextAuth session
  - [ ] Hash chain logic cryptographically sound

### Staging Deployment
- [ ] Merge to staging branch
- [ ] Run migrations on staging database
- [ ] Test all endpoints in staging
- [ ] Verify audit logging works end-to-end

### Production Deployment
- [ ] Backup production database
- [ ] Run migrations on production (scheduled maintenance window)
- [ ] Deploy API routes + lib modules
- [ ] Start Bull queue workers:
  ```bash
  node dist/scripts/start-queue-worker.js
  ```

- [ ] Deploy frontend components
- [ ] Feature flag (optional): Hide Phase 15c playbooks behind Pro tier
- [ ] Monitor logs for errors

### Post-Deployment
- [ ] Verify tables populated (query counts)
- [ ] Run smoke tests on all 9 API endpoints
- [ ] Check audit logs are recording
- [ ] Test hash chain verification
- [ ] Celebrate! 🎉

---

## Quick Command Reference

```bash
# Database
psql -d $DATABASE_URL -f blockos/init-db.sql
psql -d $DATABASE_URL -c "SELECT * FROM threat_intelligence LIMIT 1;"

# Development
npm run dev
npm test
npm run build

# Git
git checkout -b phase-15-enterprise-ops
git add -A
git commit -m "Phase 15: Advanced threat intelligence, enterprise logging, automation"
git push origin phase-15-enterprise-ops

# Deployment
npm run build && npm start
```

---

## Rollback Plan

If critical issues found:

1. **Revert code**:
   ```bash
   git revert HEAD~0..HEAD~9  # Revert 9 commits (all Phase 15)
   git push
   ```

2. **Restore database**:
   ```bash
   pg_restore -d $DATABASE_URL backup.sql
   ```

3. **Kill queue workers**:
   ```bash
   pkill -f "queue-worker"
   ```

4. **Alert team**: Notify stakeholders of rollback

---

## Success Criteria (Launch Day)

- [ ] All 9 API endpoints respond 200 OK
- [ ] Audit logs record all actions with valid hash chains
- [ ] IOC search returns enriched data < 500ms
- [ ] Correlation engine processes 100 threats < 2s
- [ ] Playbook execution queues actions < 1s
- [ ] Zero 500 errors in production logs
- [ ] All NextAuth validations working
- [ ] No SQL injection vulnerabilities detected

---

End of Phase 15 Build Checklist. Happy building! 🚀

