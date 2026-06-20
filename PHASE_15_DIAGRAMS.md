# Phase 15 Architecture Diagrams

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BlockStop Phase 15 System                            │
├──────────────────────────┬──────────────────────────┬──────────────────────┤
│     Phase 15a: HUNTING   │  Phase 15b: LOGGING      │  Phase 15c: RESPONSE │
├──────────────────────────┼──────────────────────────┼──────────────────────┤
│                          │                          │                      │
│  IOC Enrichment          │  Immutable Audit Trail   │  Playbook Executor   │
│  Threat Actor Profiles   │  Chain-of-Custody       │  Action Dispatcher   │
│  Correlation Engine      │  Retention Policies     │  Escalation Logic    │
│  Lifecycle Tracking      │  Evidence Export        │  SOAR Integration    │
│                          │                          │                      │
│  ↓ Tables:              │  ↓ Tables:              │  ↓ Tables:           │
│  - threat_intelligence   │  - compliance_logs       │  - automation_playbooks
│  - threat_actors         │  - retention_policies    │  - response_actions   │
│  - threat_correlations   │  - audit_archive         │  - escalation_rules   │
│  - threat_lifecycle      │  - evidence_chain        │                       │
│                          │                          │                      │
└──────────────────────────┴──────────────────────────┴──────────────────────┘
                                    ↓
                    PostgreSQL (9 new tables + 11 indexes)
                    Bull Queue (Async action execution)
                    S3/Azure Blob (Archive storage)
```

---

## Data Flow: Threat Detection → Response → Audit

```
┌──────────────────┐
│ Threat Detected  │
│ (Phase 2)        │
└────────┬─────────┘
         │
         ↓ (IOC extracted)
┌──────────────────────────────────────────────────────────────────┐
│ 15a: THREAT HUNTING                                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [1] IOC Lookup          [2] Actor Matching      [3] Correlate  │
│  ─────────────────       ──────────────────      ──────────────  │
│  ioc-resolver.ts        actor-profiler.ts       correlation-engine.ts
│  │                       │                        │
│  ├─→ threat_intelligence ├─→ threat_actors       └─→ threat_correlations
│  └─→ sources/feeds       └─→ MITRE ATT&CK            │
│                                                      ↓
│                                        Confidence Score: 0-100
│                                        Common Indicators: [...]
│                                        Suggested Actions: [...]
│
└────────┬─────────────────────────────────────────────────────────┘
         │ (Enriched threat context)
         ↓
┌──────────────────────────────────────────────────────────────────┐
│ 15c: RESPONSE AUTOMATION                                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [1] Match Playbook      [2] Execute Actions     [3] Escalate   │
│  ──────────────────      ───────────────────     ──────────────  │
│  Triggers match?         Queue to Bull:          Is critical?   │
│  ├─→ threatType          ├─→ quarantine           ├─→ Yes:      │
│  ├─→ severity            ├─→ isolate              │  send SOAR   │
│  ├─→ actor match?        ├─→ block                ├─→ No:       │
│  └─→ approved?           ├─→ notify               │  email team  │
│                          └─→ remediate            └─→ Log action │
│                                 │                                │
│                                 ↓                                │
│                         response_actions table                   │
│                         (status, result, error)                  │
│
└────────┬─────────────────────────────────────────────────────────┘
         │ (Action execution complete)
         ↓
┌──────────────────────────────────────────────────────────────────┐
│ 15b: ENTERPRISE LOGGING & COMPLIANCE                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [1] Format Log          [2] Chain Hash           [3] Archive    │
│  ──────────────          ───────────────         ─────────────   │
│  log-formatter.ts        chain-of-custody.ts     policy-engine   │
│  │                       │                        │
│  └─→ SHA256({...})       └─→ SHA256(prev + cur)   └─→ S3 backup   │
│                                                      Retention OK?
│                                                      ├─→ 7 days
│                                                      ├─→ 30 days
│                                                      └─→ Forever
│
│  compliance_logs         evidence_chain           audit_archive  │
│  (immutable)             (tamper-detected)        (compressed)   │
│
└────────┬─────────────────────────────────────────────────────────┘
         │ (Full audit trail created)
         ↓
┌──────────────────────────────────────────┐
│ /api/logging/export                      │
│ Download evidence (PDF, JSON-LD, Syslog) │
│ Hash chain verified ✓                    │
└──────────────────────────────────────────┘
```

---

## Component Dependency Tree

```
Components/
├─ ThreatHuntingDashboard.tsx
│  ├─ uses: useIOCEnrichment()          → imports: lib/threat-hunting/ioc-resolver
│  ├─ uses: useThreatCorrelations()     → imports: lib/threat-hunting/correlation-engine
│  ├─ renders: IOCCard (x N)
│  └─ renders: CorrelationGraph
│
├─ IOCCard.tsx (REUSABLE)
│  ├─ displays: iocValue, severity, confidence, sources
│  ├─ shared by: ThreatHuntingDashboard, AuditLog, ActionHistory
│  └─ types: IOCRecord from /types/threat-hunting.ts
│
├─ CorrelationGraph.tsx (REUSABLE - D3.js)
│  ├─ displays threat relationships (15a) OR action chains (15c)
│  ├─ nodes: threats/actions, edges: correlations/dependencies
│  └─ shared by: ThreatHuntingDashboard, ResponseDashboard
│
├─ AuditLog.tsx
│  ├─ uses: useAuditQuery()         → imports: lib/audit-logging/policy-engine
│  ├─ renders: IOCCard (for evidence)
│  ├─ button: "Verify Chain"        → imports: lib/audit-logging/chain-of-custody
│  └─ button: "Export Evidence"     → imports: lib/audit-logging/log-formatter
│
├─ PlaybookEditor.tsx
│  ├─ drag-drop: Add actions
│  ├─ uses: usePlaybookTemplates()  → imports: lib/response-automation/playbook-executor
│  └─ button: "Save Playbook"       → POST /api/response/playbook
│
└─ ActionHistory.tsx
   ├─ displays: execution logs
   ├─ renders: IOCCard (threat detail)
   ├─ renders: CorrelationGraph (action chain)
   └─ status: pending | executing | success | failed
```

---

## Database Schema: Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          EXISTING TABLES (Phase 1-2)                         │
├──────────────────────────────────────────────────────────────────────────────┤
│
│  users (id, email, team_id, ...)
│    │         │                └────────────┐
│    │         │                            ├─ team_id FK
│    │         │                            │
│    │         └────────────────────────────┼──────────────→ teams (id, name, ...)
│    │
│    ├─────────────────────────────────────→ email_scans (user_id, threats[])
│    ├─────────────────────────────────────→ file_scans (user_id, threats[])
│    ├─────────────────────────────────────→ alerts (user_id, ...)
│    └─────────────────────────────────────→ audit_logs (user_id, ...)  [DEPRECATED]
│
│
│                      ↓ NEW: Phase 15 Tables ↓
│
├──────────────────────────────────────────────────────────────────────────────┤
│ 15a: THREAT INTELLIGENCE                                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│
│  threat_intelligence
│  (id, ioc_value, ioc_type, severity, confidence, sources, related_threats[])
│        │
│        └─ ioc_value indexed
│
│  threat_actors
│  (id, name, aliases[], motivations[], capabilities[], targeted_sectors[])
│
│  threat_correlations
│  (id, threat_id_1, threat_id_2, correlation_score, common_iocs[])
│        │              │
│        └──────────────┴─ indexed pair lookup
│
│  threat_lifecycle
│  (id, threat_id, current_stage, confidence, indicators{})
│        │
│        └─ unique: threat_id
│
│
├──────────────────────────────────────────────────────────────────────────────┤
│ 15b: COMPLIANCE & LOGGING                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│
│  compliance_logs (immutable, write-once)
│  (id, user_id FK, team_id FK, action, resource_type, resource_id,
│   changes{}, ip_address, status, content_hash, previous_hash, timestamp)
│    │        │           │
│    │        └───────────┴─ indexed for audit queries
│    └─ UNIQUE constraint on content_hash (prevents duplicates)
│
│  retention_policies
│  (id, name, resource_types[], retention_days, archive_after_days, ...)
│
│  audit_archive (batch compressed records)
│  (id, archive_date, record_count, size_bytes, hash, s3_path, verified_at)
│
│  evidence_chain (chain-of-custody for forensics)
│  (id, threat_id FK, evidence_type, content_hash, collected_by FK,
│   chain_hash, chain_verified, created_at)
│    └─ previous_entry linked via chain_hash


├──────────────────────────────────────────────────────────────────────────────┤
│ 15c: RESPONSE AUTOMATION                                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│
│  automation_playbooks
│  (id, team_id FK, name, trigger_conditions{}, actions[], escalation_path[],
│   approval_required, enabled, created_by FK, created_at)
│    │
│    ├─ indexed: (team_id, enabled)
│    └──────────→ response_actions (playbook_id FK)
│
│  response_actions
│  (id, playbook_id FK, threat_id, action_type, status, started_at, completed_at,
│   result{}, error_details, executed_by FK)
│    │
│    ├─ indexed: threat_id
│    └─ indexed: status
│
│  escalation_rules
│  (id, team_id FK, condition_type, condition_value, escalate_to,
│   notify_emails[])
│
│
└──────────────────────────────────────────────────────────────────────────────┘

LEGEND:
  FK = Foreign Key
  [] = Array/Text array
  {} = JSONB
  indexed = CREATE INDEX for query performance
```

---

## API Route Decision Tree

```
┌─ Request arrives at /api/threat-hunting/*
│
├─ POST /search
│  ├─ Extract IOC value + type
│  ├─ Call ioc-resolver.enrichIOC()
│  ├─ Query threat_intelligence table
│  ├─ If found: return with severity, sources, relatedThreats
│  └─ If not found: query external feeds (OTX, VirusTotal) → cache
│
├─ POST /correlate
│  ├─ Extract threatIds array
│  ├─ Call correlation-engine.correlateThreats()
│  ├─ Query threat_correlations table (pre-computed)
│  ├─ Return: [{threat1, threat2, score, commonIOCs}, ...]
│  └─ If score > threshold: suggest playbook auto-trigger
│
├─ POST /profile
│  ├─ Extract actorName OR iocValues
│  ├─ Call actor-profiler.getActorProfile() OR matchIOCsToActor()
│  ├─ Return: actor.{name, aliases, motivations, capabilities, riskLevel}
│  └─ Include: knownCampaigns, operationalSecurityScore, lastActive
│
└─ POST /lifecycle
   ├─ Extract threatId
   ├─ Call lifecycle-tracker.getThreatLifecycle()
   ├─ Call predictThreatStage() (TensorFlow.js model)
   └─ Return: stage, confidence, trendIndicators, forecast90day


┌─ Request arrives at /api/logging/*
│
├─ GET /audit
│  ├─ Validate user permission (admin or team lead)
│  ├─ Parse filters: startDate, endDate, userId, action, status
│  ├─ Query compliance_logs with indexed WHERE clause
│  ├─ Return: logs[], totalCount, hasMore
│  └─ Each log contains: action, resource, changes, timestamp, contentHash
│
├─ POST /export
│  ├─ Extract logIds, format (pdf|json-ld|syslog)
│  ├─ Fetch logs + verify hash chains
│  ├─ Serialize to requested format (PDF with signatures, JSON-LD RDF)
│  ├─ Upload to S3/Azure Blob
│  └─ Return: downloadUrl, verificationHash
│
└─ POST /verify
   ├─ Extract archiveId or threatId
   ├─ Call chain-of-custody.verifyChain()
   ├─ Recompute each entry's hash (content + previousHash)
   ├─ If all match: return { verified: true, integrityStatus: 'INTACT' }
   └─ If mismatch: return { verified: false, integrityStatus: 'COMPROMISED' }


┌─ Request arrives at /api/response/*
│
├─ POST /execute
│  ├─ Validate user can execute (admin, team lead)
│  ├─ Extract playbookId, threatId
│  ├─ Call playbook-executor.executePlaybook()
│  ├─ For each action in playbook.actions:
│  │  ├─ Evaluate trigger conditions (threatType, severity, actor match)
│  │  ├─ If approved || !approval_required: queue action
│  │  └─ Insert into response_actions (status: pending/executing)
│  ├─ Queue async job to action-dispatcher.executeAction()
│  └─ Return: executionId, actionQueue[], estimatedTime
│
├─ POST /playbook
│  ├─ Method: POST (create) | PUT (update) | DELETE (disable)
│  ├─ Extract: teamId, name, triggers{}, actions[], escalationPath[]
│  ├─ Call playbook-executor.createPlaybook()
│  ├─ Insert into automation_playbooks
│  └─ Return: playbookId, status
│
└─ POST /escalate
   ├─ Extract: threatId, severity, escalationType (soar|soc|exec)
   ├─ Call escalation-logic.evaluateEscalation(threatId, severity)
   ├─ Query escalation_rules for matching conditions
   ├─ Send notification (email, Slack, webhook to SOAR)
   ├─ Log action in response_actions
   └─ Return: escalationId, recipientNotified, status
```

---

## Correlation Algorithm Flow

```
INPUT: [threatId1, threatId2, threatId3, ...]

For each PAIR of threats:
  ├─ [STEP 1] IOC Overlap Analysis
  │  ├─ Fetch IOCs related to threat1
  │  ├─ Fetch IOCs related to threat2
  │  ├─ Calculate Jaccard similarity: |A ∩ B| / |A ∪ B|
  │  ├─ Weight: 0.30
  │  └─ Score1 = overlap_ratio * 0.30
  │
  ├─ [STEP 2] Actor Match
  │  ├─ Threat1 → actors = threat_correlations.common_actors
  │  ├─ Threat2 → actors = threat_correlations.common_actors
  │  ├─ If actors overlap: score = # matching / # total unique actors
  │  ├─ Weight: 0.35
  │  └─ Score2 = actor_match * 0.35
  │
  ├─ [STEP 3] MITRE ATT&CK Tactic Match
  │  ├─ Threat1 → tactics = from attack_chain.mitreTactics
  │  ├─ Threat2 → tactics = from attack_chain.mitreTactics
  │  ├─ Jaccard on tactics
  │  ├─ Weight: 0.20
  │  └─ Score3 = tactic_overlap * 0.20
  │
  ├─ [STEP 4] Temporal Proximity
  │  ├─ Δt = abs(threat1.timestamp - threat2.timestamp)
  │  ├─ If Δt < 24 hours: score = 1.0
  │  ├─ If Δt < 7 days: score = 0.5
  │  ├─ If Δt > 7 days: score = 0.1
  │  ├─ Weight: 0.15
  │  └─ Score4 = temporal_score * 0.15
  │
  └─ TOTAL = Score1 + Score2 + Score3 + Score4
     └─ Range: 0.0 (unrelated) → 1.0 (identical campaign)
        ├─ 0.80-1.00: Same campaign
        ├─ 0.60-0.79: Likely related
        ├─ 0.40-0.59: Possible copycat
        └─ 0.00-0.39: Unrelated

STORE: INSERT INTO threat_correlations (threat_id_1, threat_id_2, correlation_score, ...)
```

---

## Hash Chain Integrity Verification

```
Entry 1:    Entry 2:           Entry 3:
──────      ──────             ──────
content_hash: a1b2c3d4        content_hash: e5f6g7h8      content_hash: i9j0k1l2
chain_hash: a1b2c3d4          chain_hash: SHA256(         chain_hash: SHA256(
            (no previous)                a1b2c3d4 +                i9j0k1l2 +
                                         e5f6g7h8)                 SHA256(...))
                                   = 5x9y2z3a1b           = 6m7n8o9p2q3r

VERIFICATION:
  Step 1: Fetch all evidence_chain entries for threatId, sorted by created_at ASC
  Step 2: Initialize expectedPrevious = ""
  Step 3: For each entry:
    └─ recomputed = SHA256(expectedPrevious + entry.content_hash)
    └─ if recomputed != entry.chain_hash: INTEGRITY FAILED ❌
    └─ else: expectedPrevious = entry.chain_hash
  Step 4: If loop completes without mismatch: INTEGRITY VERIFIED ✓

RESULT: Impossible to modify past entry without breaking entire chain.
        Attackers would need to recompute all subsequent hashes
        (cryptographically infeasible with SHA256).
```

---

## Threat Lifecycle Prediction

```
                           ╱ PEAK ╲
                          ╱         ╲
                    GROWING          DECLINING
                   ╱                      ╲
                  ╱                        ╲ DORMANT
          EMERGING
              │
              └─ Input: frequency of observations over time
              │          └─ observations per day, per week, per month
              │
              └─ Model: TensorFlow.js time-series predictor
              │          ├─ Input: past 30 days of observation counts
              │          ├─ LSTM cell processes temporal sequence
              │          └─ Output: probability for each stage
              │
              └─ Logic:
                 ├─ If frequency increasing 2-7 days: EMERGING → GROWING
                 ├─ If frequency peak (local max): GROWING → PEAK
                 ├─ If frequency declining: PEAK → DECLINING
                 ├─ If no observations for 14+ days: DECLINING → DORMANT
                 └─ Confidence: model output probability (0-1)

EXAMPLE:
  Date           Obs   Stage         Confidence   Action
  ────           ───   ─────         ──────────   ──────
  2026-06-01     2     emerging      0.60         Monitor
  2026-06-05     8     growing       0.78         Alert
  2026-06-10     15    peak          0.92         Critical
  2026-06-15     12    declining     0.85         Escalate
  2026-06-29     0     dormant       0.71         Archive
```

