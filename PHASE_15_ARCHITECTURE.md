# Phase 15 Architecture Plan: Advanced Threat Intelligence, Enterprise Logging & Automation
## BlockStop PRO - Email & File Security

---

## OVERVIEW
Phase 15 extends Phase 2 (auth/teams/billing/VPN/WiFi) into enterprise-grade operations via three integrated sub-phases:
- **15a**: Threat Intelligence & Hunting (IOC correlation, threat actors, lifecycle tracking)
- **15b**: Enterprise Logging & Compliance (audit trails, retention policies, exportable evidence)
- **15c**: Real-time Threat Response Automation (playbooks, policy enforcement, escalation workflows)

**Stack**: Next.js 14 API routes + PostgreSQL + TensorFlow.js ML models + Bull queues for async tasks

---

## BUILD ORDER

### Phase 15a: Threat Intelligence & Hunting (Weeks 1-2)
1. **Database Schema** → threat_intelligence, threat_actors, ioc_analysis, threat_correlations tables
2. **Lib Core** → `/lib/threat-hunting/` (IOC resolver, actor profiler, correlation engine)
3. **API Routes** → `/api/threat-hunting/{search,correlate,profile,lifecycle}/route.ts`
4. **Components** → ThreatActor, IOCCard, CorrelationGraph (minimal UI)
5. **Tests** → Unit tests for correlation logic, edge cases

### Phase 15b: Enterprise Logging & Compliance (Weeks 2-3)
1. **Database Schema** → compliance_logs, audit_archive, retention_policies, evidence_chain tables
2. **Lib Core** → `/lib/audit-logging/` (log formatter, policy engine, chain-of-custody)
3. **API Routes** → `/api/logging/{archive,export,audit,verify}/route.ts`
4. **Types** → Immutable audit structures, hash chains for tamper-proof logs
5. **Integration** → Hook into existing auth/team/scan endpoints for event capture

### Phase 15c: Response Automation (Weeks 3-4)
1. **Database Schema** → automation_playbooks, response_actions, escalation_rules tables
2. **Lib Core** → `/lib/response-automation/` (playbook executor, action dispatcher, escalation logic)
3. **API Routes** → `/api/response/{execute,playbook,escalate}/route.ts`
4. **Queue Jobs** → Bull jobs for async response execution (quarantine, notify, remediate)
5. **Event System** → Pub/sub for real-time threat→action triggers

---

## DIRECTORY STRUCTURE

```
lib/
├── threat-hunting/              # 15a
│   ├── ioc-resolver.ts          # IOC lookup, enrichment, validation
│   ├── actor-profiler.ts        # Threat actor matching, capabilities
│   ├── correlation-engine.ts    # Multi-threat pattern detection
│   ├── lifecycle-tracker.ts     # Emerging → Dormant stage tracking
│   └── types.ts                 # ThreatHunt, IOC, Actor types
├── audit-logging/               # 15b
│   ├── log-formatter.ts         # Structured, immutable log format
│   ├── policy-engine.ts         # Retention, compliance rules
│   ├── chain-of-custody.ts      # Hash chains, tamper detection
│   ├── export-handler.ts        # Evidence export (PDF, JSON-LD)
│   └── types.ts                 # AuditLog, CompliancePolicy
├── response-automation/         # 15c
│   ├── playbook-executor.ts     # Template → action execution
│   ├── action-dispatcher.ts     # Execute isolated threat actions
│   ├── escalation-logic.ts      # Severity routing, approval gates
│   ├── integrations.ts          # SOAR/SIEM API helpers
│   └── types.ts                 # Playbook, Action, Escalation types

app/api/
├── threat-hunting/
│   ├── search/route.ts          # IOC search + enrichment
│   ├── correlate/route.ts       # Multi-threat correlation
│   ├── profile/route.ts         # Threat actor profiles
│   └── lifecycle/route.ts       # Threat stage prediction
├── logging/
│   ├── archive/route.ts         # Log indexing + storage
│   ├── export/route.ts          # Compliance export
│   ├── audit/route.ts           # Audit trail query
│   └── verify/route.ts          # Hash chain verification
└── response/
    ├── execute/route.ts         # Trigger playbook
    ├── playbook/route.ts        # Manage playbook templates
    └── escalate/route.ts        # Send to SOAR/SOC

components/
├── ThreatHuntingDashboard.tsx   # Hunt UI
├── IOCCard.tsx                  # IOC details + history
├── CorrelationGraph.tsx         # D3 threat relationships
├── AuditLog.tsx                 # Log viewer
├── ComplianceExport.tsx         # Export dialog
├── PlaybookEditor.tsx           # Build automation rules
└── ActionHistory.tsx            # Response action logs
```

---

## DATABASE SCHEMA ADDITIONS

### 15a: Threat Intelligence
```sql
-- Indicators of Compromise (IOCs)
CREATE TABLE threat_intelligence (
    id SERIAL PRIMARY KEY,
    ioc_value VARCHAR(500) NOT NULL,
    ioc_type VARCHAR(20),  -- ip, domain, hash, url, email, cert
    severity INTEGER (0-100),
    confidence DECIMAL(3,2),  -- 0.0-1.0
    sources TEXT[],  -- feeds, internal
    first_seen TIMESTAMP,
    last_seen TIMESTAMP,
    related_threats JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ioc_value, ioc_type)
);

-- Threat actors and campaigns
CREATE TABLE threat_actors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    aliases TEXT[],
    motivations TEXT[],
    capabilities TEXT[],
    targeted_sectors TEXT[],
    known_campaigns TEXT[],
    operational_security_score DECIMAL(3,2),
    risk_level VARCHAR(20),  -- critical, high, medium, low
    last_active TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Threat correlations
CREATE TABLE threat_correlations (
    id SERIAL PRIMARY KEY,
    threat_id_1 VARCHAR(100),
    threat_id_2 VARCHAR(100),
    correlation_score DECIMAL(3,2),
    common_iocs TEXT[],
    common_actors TEXT[],
    temporal_distance_hours INTEGER,
    correlation_type VARCHAR(50),  -- same-actor, same-campaign, copycat
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(threat_id_1, threat_id_2)
);

-- Threat lifecycle stages
CREATE TABLE threat_lifecycle (
    id SERIAL PRIMARY KEY,
    threat_id VARCHAR(100),
    current_stage VARCHAR(20),  -- emerging, growing, peak, declining, dormant
    stage_started_at TIMESTAMP,
    indicators JSONB,
    confidence DECIMAL(3,2),
    forecast_90day JSONB,  -- predicted evolution
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 15b: Compliance & Logging
```sql
-- Immutable audit log (write-once)
CREATE TABLE compliance_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),  -- scan, user, team, config
    resource_id VARCHAR(100),
    changes JSONB,  -- before/after diffs
    ip_address INET,
    user_agent VARCHAR(500),
    status VARCHAR(20),  -- success, failure, rejected
    error_message TEXT,
    content_hash VARCHAR(64),  -- SHA256 for tamper detection
    previous_hash VARCHAR(64),  -- chain-of-custody link
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX(user_id, timestamp),
    INDEX(team_id, timestamp),
    INDEX(timestamp)
);

-- Compliance retention policies
CREATE TABLE retention_policies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    resource_types TEXT[],  -- scans, audits, alerts
    retention_days INTEGER,
    archive_after_days INTEGER,
    encryption_required BOOLEAN DEFAULT TRUE,
    apply_to_teams JSONB,  -- team IDs or null for global
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Archived audit records (compressed, encrypted)
CREATE TABLE audit_archive (
    id SERIAL PRIMARY KEY,
    archive_date DATE,
    record_count INTEGER,
    size_bytes BIGINT,
    hash VARCHAR(64),  -- Merkle tree root of batch
    encryption_key_id VARCHAR(255),
    s3_path VARCHAR(500),  -- external storage
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Evidence chain for forensics
CREATE TABLE evidence_chain (
    id SERIAL PRIMARY KEY,
    threat_id VARCHAR(100),
    evidence_type VARCHAR(50),  -- log, file, scan_result
    content BYTEA,
    content_hash VARCHAR(64),
    collected_by INTEGER REFERENCES users(id),
    collected_at TIMESTAMP,
    chain_verified BOOLEAN DEFAULT FALSE,
    chain_hash VARCHAR(64),  -- links to previous entry
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 15c: Automation & Response
```sql
-- Response playbooks (templates)
CREATE TABLE automation_playbooks (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_conditions JSONB,  -- {threatType, severity, ...}
    actions JSONB[],  -- [{type: "quarantine", params: {...}}, ...]
    escalation_path TEXT[],  -- email, soar_webhook, slack
    approval_required BOOLEAN DEFAULT FALSE,
    enabled BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Executed response actions
CREATE TABLE response_actions (
    id SERIAL PRIMARY KEY,
    playbook_id INTEGER REFERENCES automation_playbooks(id),
    threat_id VARCHAR(100),
    action_type VARCHAR(50),  -- quarantine, isolate, block, notify
    status VARCHAR(20),  -- pending, executing, success, failed
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    result JSONB,  -- action-specific output
    error_details TEXT,
    executed_by INTEGER REFERENCES users(id),  -- automation user or approver
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Escalation rules
CREATE TABLE escalation_rules (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id),
    condition_type VARCHAR(50),  -- severity, actor_match, repeat_threat
    condition_value VARCHAR(100),
    escalate_to VARCHAR(100),  -- email, slack_channel, soar_api
    notify_emails TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## API ROUTES & PAYLOADS

### Threat Hunting (15a)
```
POST /api/threat-hunting/search
  { ioc: "192.168.1.1", type: "ip" }
  → { ioc, severity, sources, relatedThreats, actorProfiles, timeline }

POST /api/threat-hunting/correlate
  { threatIds: ["threat-001", "threat-002"] }
  → { correlations[], commonIndicators, commonActors, suggestedActions }

POST /api/threat-hunting/profile
  { actorName: "Lazarus Group" }
  → { actor, knownCampaigns, tactics, infrastructure, targetedSectors }

POST /api/threat-hunting/lifecycle
  { threatId: "threat-001" }
  → { currentStage, confidence, trend, forecast90day, timeToMitigation }
```

### Compliance Logging (15b)
```
POST /api/logging/audit
  Query filters: { startDate, endDate, userId, action, status }
  → { logs[], totalCount, hasMore }

POST /api/logging/export
  { logIds, format: "pdf|json-ld|syslog", includeChain: true }
  → { downloadUrl, verificationHash }

POST /api/logging/verify
  { archiveId: "archive-001" }
  → { verified: true|false, integrityStatus, chainValid }
```

### Response Automation (15c)
```
POST /api/response/playbook
  { name, triggers: {...}, actions: [...], escalationPath: [] }
  → { playbookId, status }

POST /api/response/execute
  { playbookId: "pb-001", threatId: "threat-001", manualApproval: true }
  → { executionId, status, actionQueue, estimatedTime }

POST /api/response/escalate
  { threatId, severity, escalationType: "soar|soc|exec" }
  → { escalationId, recipientNotified, status }
```

---

## REUSABLE COMPONENTS STRATEGY

### Data-Driven Components
- **IOCCard**: Displays enriched IOC data, reused in hunt results + audit logs
- **ThreatTimeline**: MITRE ATT&CK timeline, shared across hunt/response/audit views
- **PlaybookFlow**: Drag-drop action builder for 15c automation
- **CorrelationGraph**: D3.js network graph, renders threat correlations (15a) and action chains (15c)

### Shared Utilities
- `lib/threat-hunting/types.ts` → Exported to components for TS safety
- `lib/audit-logging/hash-utils.ts` → Verification logic for audit UI
- `lib/response-automation/action-registry.ts` → Action type definitions + UI renderers

### Hook Pattern
```typescript
// Reusable hook for threat lookups
useIOCEnrichment(ioc: string) → { data, isLoading, error, refresh }
useThreatCorrelations(threatIds: string[]) → { correlations, graph, actors }
usePlaybookTemplates(teamId?: number) → { playbooks, canEdit, mutate }
```

---

## TESTING APPROACH

### Unit Tests
- **15a**: Correlation algorithms (false positive rates < 5%)
- **15b**: Hash chain integrity, retention policy enforcement
- **15c**: Playbook condition matching, action executor isolation

### Integration Tests
- End-to-end: Threat detection → IOC enrichment → Playbook trigger → Response execution → Audit log
- Real-time: WebSocket subscription for threat updates → playbook auto-execution

### Compliance Tests
- Log tamper detection (modify past entry → verification fails)
- Retention policy enforcement (archival after N days)
- Export format validation (PDF signature chains, JSON-LD RDF compliance)

---

## DEPLOYMENT SEQUENCE

1. **Database**: Run migration script (Phase 15 schema tables)
2. **Lib modules**: Deploy `/lib/threat-hunting`, `/lib/audit-logging`, `/lib/response-automation`
3. **API routes**: Deploy all `/api/threat-hunting`, `/api/logging`, `/api/response` endpoints
4. **Frontend**: Deploy dashboard components (no feature gate initially, read-only for non-admins)
5. **Jobs**: Start Bull queue workers for async response execution
6. **Monitoring**: Alert on failed correlations, missed escalations, audit gaps

---

## ENTERPRISE REQUIREMENTS ALIGNMENT

| Requirement | 15a | 15b | 15c | Implementation |
|---|---|---|---|---|
| Threat hunting | ✓ | - | - | IOC search + correlation engine |
| Immutable audit logs | - | ✓ | - | Hash chains, write-once DB |
| Compliance export | - | ✓ | - | JSON-LD, PDF with signatures |
| Automated response | - | - | ✓ | Playbook executor + escalation rules |
| Forensics evidence | - | ✓ | ✓ | Evidence chain table + action logs |
| Real-time threat notifications | - | - | ✓ | Pub/sub + email/Slack webhooks |

---

## DEPENDENCIES & INTEGRATIONS

- **Threat feeds**: MISP, AlienVault OTX, VirusTotal (IOC enrichment)
- **SOAR/SIEM**: Splunk, Elastic, ServiceNow (escalation targets)
- **Messaging**: Slack, Microsoft Teams (notifications)
- **Storage**: S3 or Azure Blob (audit archive)
- **ML Models**: TensorFlow.js for correlation anomaly detection

