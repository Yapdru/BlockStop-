# Advanced Threat Hunting Guide - BlockStop Phase 29.3

## Overview

BlockStop provides comprehensive threat hunting capabilities including investigation workspaces, evidence management, and forensic analysis tools.

## Investigation Workspace

### Creating Investigations

```typescript
const workspace = new InvestigationWorkspace();

const investigation = await workspace.createInvestigation(
  "CASE-2024-001",
  "Suspicious Login Activity",
  "analyst@company.com",
  {
    description: "Unusual login patterns from East Asia",
    severity: "high",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
);
```

### Building Timelines

Reconstruct attack timelines from logs:

```typescript
const timeline = await workspace.buildTimelineFromLogs(
  investigationId,
  [
    {
      timestamp: new Date("2024-01-15T10:30:00"),
      source: "auth_service",
      message: "Login attempt failed from 192.168.1.100",
      severity: "low"
    },
    {
      timestamp: new Date("2024-01-15T10:31:15"),
      source: "file_system",
      message: "Suspicious file access: /sensitive/data.xlsx",
      severity: "high"
    }
  ]
);
```

### Evidence Correlation

Link related pieces of evidence:

```typescript
const correlation = await workspace.createCorrelation(
  investigationId,
  ["artifact-001", "artifact-002", "artifact-003"],
  "temporal",
  "Login attempt followed by file access from same source"
);
```

### Pivot Analysis

Analyze relationships between entities:

```typescript
// Email to domain to IP to user
const pivots = await workspace.pivotFromEmail(
  investigationId,
  "attacker@suspiciousdomain.com"
);

// Returns: email → domain → IPs → related users
```

### Building Queries

Create complex searches:

```typescript
const query = await workspace.createQuery(
  investigationId,
  "Failed Logins",
  "logs",
  { timeRange: { start: new Date("2024-01-01"), end: new Date() } }
);

// Add filters
await workspace.addFilter(
  queryId,
  "event_type",
  "equals",
  "login_failed"
);

await workspace.addFilter(
  queryId,
  "source_ip",
  "regex",
  "^192\\.168\\."
);

// Execute
const results = await workspace.executeQuery(queryId);
```

## Evidence Management

### Creating Cases

```typescript
const manager = new EvidenceManager();

const caseRecord = await manager.createCase(
  "Data Breach Investigation",
  "analyst@company.com",
  {
    description: "Potential insider threat",
    legalHoldReason: "Litigation hold for legal proceedings"
  }
);
```

### Adding Evidence

```typescript
const artifact = await manager.addArtifact(caseId, {
  type: "file",
  source: "/var/log/access.log",
  description: "Web server access log from breach period",
  hash: {
    md5: "abc123...",
    sha1: "def456...",
    sha256: "ghi789..."
  },
  size: 5242880,
  collected: new Date(),
  collectedBy: "analyst@company.com"
});
```

### Chain of Custody

Track evidence handling:

```typescript
// Automatic on collection
const record = await manager.recordChainOfCustody(
  artifactId,
  "transferred",
  "forensics@company.com",
  {
    location: "Forensic Lab",
    reason: "Digital forensic analysis",
    signature: "analyst_signature_base64"
  }
);

// Verify integrity
const verification = await manager.verifyChainOfCustody(artifactId);
if (!verification.valid) {
  console.warn("Chain of custody broken:", verification.gaps);
}
```

### Artifact Annotation

Add notes and findings:

```typescript
await manager.addAnnotation(
  artifactId,
  "finding",
  "File contains suspicious Excel macros",
  "analyst@company.com",
  "high"
);

await manager.addAnnotation(
  artifactId,
  "tag",
  "malware_suspected",
  "analyst@company.com"
);
```

### Evidence Export

```typescript
const exportData = await manager.exportEvidence(
  caseId,
  "analyst@company.com",
  "json"
);

// Returns: all artifacts, chain of custody, annotations
```

## Forensic Analysis

### File Analysis

```typescript
const analyzer = new ForensicAnalyzer();

const fileAnalysis = await analyzer.analyzeFile(
  "/path/to/suspicious.exe",
  {
    hashContent: true,
    analyzeContent: true,
    checkSignature: true
  }
);

// Returns: hashes, metadata, entropy, suspicious strings
```

### Network Analysis

```typescript
const netAnalysis = await analyzer.analyzeNetworkTraffic(
  "192.168.1.100",
  "203.0.113.50",
  [
    {
      sourcePort: 54321,
      destinationPort: 443,
      protocol: "TCP",
      payloadSize: 1500,
      timestamp: new Date()
    }
  ]
);

// Identifies suspicious patterns, entropy, keywords
```

### Process Tree Analysis

```typescript
const processAnalyses = await analyzer.analyzeProcessTree([
  {
    processId: 1234,
    name: "svchost.exe",
    parentProcessId: 848,
    path: "C:\\Windows\\System32\\svchost.exe",
    commandLine: "svchost.exe -k LocalServiceNetworkRestricted",
    startTime: new Date(),
    user: "SYSTEM"
  }
]);

// Detects process injection, suspicious behavior
```

### System Timeline

```typescript
const timeline = await analyzer.buildSystemTimeline([
  {
    timestamp: new Date("2024-01-15T10:00:00"),
    type: "file_created",
    resource: "C:\\Temp\\payload.exe",
    details: { size: 2048, hash: "abc123" }
  },
  {
    timestamp: new Date("2024-01-15T10:05:00"),
    type: "process_started",
    resource: "C:\\Temp\\payload.exe",
    details: { parentPid: 1234 }
  }
]);

// Correlates events chronologically
```

### Forensic Report

```typescript
const report = await analyzer.generateForensicReport(
  "CASE-2024-001",
  fileAnalyses,
  networkAnalyses,
  processAnalyses,
  timeline
);

// Contains all findings and recommendations
```

## Threat Intelligence Integration

### Pattern Identification

```typescript
const patternAnalyzer = new PatternAnalyzer();

const patterns = await patternAnalyzer.analyzeThreatPatterns([
  {
    threatId: "threat-1",
    timestamp: new Date(),
    type: "phishing",
    severity: "medium",
    source: "email"
  },
  // ... more threat data
]);

// Identifies: recurring patterns, seasonal trends, progressions
```

### Attack Progressions

Identify multi-stage attacks:

```typescript
const progressions = await patternAnalyzer.getAttackProgressions();

// Returns attack sequences like:
// Reconnaissance → Initial Access → Persistence → Privilege Escalation
```

### Threat Correlations

Find related threats:

```typescript
const correlations = await patternAnalyzer.getCorrelations();

// Shows: malware_A often followed by ransomware_B within 2 hours
```

## Advanced Hunting Workflows

### Insider Threat Hunting

1. Identify anomalous user behavior
2. Timeline reconstruction
3. File access analysis
4. Data exfiltration detection
5. Process monitoring

```typescript
// Check user activity
const userActivity = await workspace.buildTimelineFromLogs(
  investigationId,
  suspiciousLogs
);

// Pivot on user account
const userPivot = await workspace.analyzePivot(
  investigationId,
  "user",
  "suspicious_user",
  relatedActivity
);
```

### APT Campaign Hunting

1. IOC extraction and matching
2. Timeline correlation across systems
3. Command & control identification
4. Lateral movement detection
5. Data exfiltration confirmation

### Malware Investigation

1. File behavior analysis
2. Network communication tracking
3. Process tree analysis
4. Registry/System changes
5. Artifact collection for research

## Query Examples

### Failed Login Attempts

```sql
event_type = 'login_failed' 
AND timestamp >= '2024-01-01'
AND source_ip LIKE '192.168.%'
GROUP BY username, source_ip
ORDER BY count DESC
```

### Suspicious File Operations

```sql
event_type = 'file_access'
AND (resource LIKE '%.exe' OR resource LIKE '%.dll')
AND username != 'SYSTEM'
AND timestamp >= '2024-01-01'
ORDER BY timestamp DESC
```

### Data Exfiltration Patterns

```sql
event_type IN ('network_transfer', 'email_sent')
AND bytes_transferred > 100000000
AND destination_type = 'external'
AND timestamp >= '2024-01-01'
GROUP BY source_user, destination
```

## Best Practices

### Investigation Hygiene

1. **Document Everything** - Record all analysis steps
2. **Maintain Chain of Custody** - Never break evidence handling
3. **Preserve Original Evidence** - Work with copies
4. **Use Clean Systems** - Analyze on isolated systems
5. **Time Synchronization** - Ensure accurate timelines

### Threat Hunting Methodology

1. **Define Hypothesis** - What are you looking for?
2. **Gather Indicators** - Known IOCs, patterns
3. **Hunt Systematically** - Check all systems
4. **Document Findings** - Record all artifacts
5. **Investigate Leads** - Follow correlations

### Escalation Criteria

- **Critical** - Active breach in progress
- **High** - Confirmed malware, data access
- **Medium** - Suspicious activity, potential threat
- **Low** - Anomalies, policy violations

## Automation and Feeds

### Automated Hunt Queries

Schedule recurring hunts:

```typescript
const hunt = new HuntOrchestrator();

const scheduled = await hunt.scheduleHunt({
  huntType: "anomaly",
  targetScope: { allEntities: true },
  frequency: "daily",
  timeRange: { lookBack: 24 * 60 * 60 * 1000 }
});
```

### Integration with Threat Feeds

Connect to threat intelligence feeds for automatic IOC hunting

## Export and Reporting

### Investigation Export

```typescript
const exportData = await workspace.exportFindings(
  investigationId,
  "json"
);

// Formats: json, html, csv
```

### Compliance Reports

Generate reports suitable for regulatory requirements with proper chain of custody documentation.

