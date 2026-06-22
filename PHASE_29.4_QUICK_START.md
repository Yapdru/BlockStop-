# Phase 29.4 Quick Start Guide

## Overview

Phase 29.4 adds enterprise automation, integrations, disaster recovery, and app marketplace capabilities to BlockStop.

## Key Components

### 1. Workflow Automation

Create automated response workflows:

```typescript
import WorkflowEngine from '@/lib/automation/workflow-engine';

const engine = new WorkflowEngine();

// Create a workflow
const workflow = engine.createWorkflow({
  name: 'Critical Threat Response',
  description: 'Auto-respond to critical threats',
  enabled: true,
  trigger: {
    type: 'on-threat',
    conditions: { severity: 'critical' }
  },
  actions: [
    { 
      type: 'incident-create',
      config: { priority: 'critical' },
      onSuccess: 'action-2'
    },
    { 
      id: 'action-2',
      type: 'slack',
      config: { channel: '#security', message: 'Critical threat detected' },
      onSuccess: 'action-3'
    },
    { 
      id: 'action-3',
      type: 'email',
      config: { to: 'security@company.com', subject: 'CRITICAL: Threat Detected' }
    }
  ],
  tags: ['security', 'auto-response'],
  createdBy: 'admin'
});

// Execute the workflow
const execution = await engine.executeWorkflow(workflow.id, {
  threat: { id: 'threat-123', type: 'malware', severity: 'critical' }
});
```

### 2. Job Scheduling

Schedule automated jobs:

```typescript
import Scheduler from '@/lib/automation/scheduler';

const scheduler = new Scheduler();

// Create a scheduled job
const job = scheduler.createJob({
  name: 'Daily Compliance Report',
  type: 'workflow',
  cron: '0 9 * * *', // 9 AM daily
  timezone: 'America/New_York',
  isActive: true,
  maxConcurrent: 1,
  notificationChannels: ['email', 'slack'],
  createdBy: 'admin'
});

// List scheduled jobs
const jobs = scheduler.listJobs({ active: true });
```

### 3. Incident Automation

Configure automatic incident response:

```typescript
import IncidentAutomationEngine from '@/lib/automation/incident-automation';

const automation = new IncidentAutomationEngine();

// Create auto-incident rule
const autoRule = automation.createAutoIncidentRule({
  name: 'Auto-Create Critical Incidents',
  enabled: true,
  trigger: {
    threatLevel: 'critical',
    matchAll: false
  },
  autoCreate: true
});

// Create assignment rule
const assignmentRule = automation.createAutoAssignmentRule({
  name: 'Assign to Security Team',
  enabled: true,
  conditions: { threatLevel: 'critical' },
  teamId: 'team-security',
  priority: 1
});

// Create remediation playbook
const playbook = automation.createRemediationPlaybook({
  name: 'Ransomware Response',
  enabled: true,
  triggerOn: 'critical',
  threatTypes: ['ransomware'],
  actions: [
    { type: 'quarantine', target: 'file', targetId: '{{threat.fileId}}' },
    { type: 'isolate', target: 'host', targetId: '{{threat.hostId}}' }
  ],
  requiresApproval: true,
  createdBy: 'admin'
});
```

### 4. Enterprise Integrations

Connect to 23+ enterprise tools:

```typescript
import IntegrationManager from '@/lib/integrations/integration-manager';

const integrations = new IntegrationManager();

// Add Slack integration
const slack = integrations.addIntegration({
  provider: 'slack',
  name: 'Security Team Slack',
  enabled: true,
  credentials: {
    apiKey: process.env.SLACK_API_KEY,
    teamId: process.env.SLACK_TEAM_ID
  },
  settings: {
    defaultChannel: '#security-alerts',
    threadReplies: true
  },
  createdBy: 'admin'
});

// Execute integration action
const result = await integrations.executeAction(
  slack.id,
  'send-message',
  {
    channel: '#security-alerts',
    message: 'Critical threat detected',
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: '*Threat Alert*' } }
    ]
  }
);

// Check integration health
const health = await integrations.checkIntegrationHealth(slack.id);
console.log(`Status: ${health.status}, Uptime: ${health.uptime}%`);
```

### 5. App Marketplace

Manage community applications:

```typescript
import AppMarketplace from '@/lib/marketplace/app-store';

const marketplace = new AppMarketplace();

// Submit an app
const app = marketplace.submitApp(
  {
    name: 'Threat Intelligence Enricher',
    version: '1.0.0',
    description: 'Enrich threats with external intelligence',
    author: { name: 'Security Labs', email: 'dev@security.com' },
    permissions: [
      { resource: 'threats', action: 'read' },
      { resource: 'threats', action: 'write' }
    ],
    entryPoint: 'main.ts',
    license: 'MIT',
    keywords: ['threat', 'enrichment', 'intel']
  },
  'admin'
);

// Publish app
marketplace.publishApp(app.id);

// Browse apps
const apps = marketplace.listApps({ keyword: 'threat', limit: 10 });

// Install app
const installation = marketplace.installApp(
  app.id,
  'user-123',
  'org-456',
  { updateFrequency: 'hourly' }
);
```

### 6. Disaster Recovery

Manage failover, backups, and recovery:

```typescript
import FailoverManager from '@/lib/dr/failover-manager';
import RTORPOManager from '@/lib/dr/rto-rpo-manager';
import ChaosTester from '@/lib/dr/chaos-tester';

// Failover Management
const failoverMgr = new FailoverManager();
const failoverPolicy = failoverMgr.createPolicy({
  name: 'Multi-Region Failover',
  mode: 'multi-region',
  nodes: [
    { 
      id: 'us-east-1', 
      name: 'Primary', 
      region: 'us-east-1',
      endpoint: 'https://api-east.blockstop.io',
      isPrimary: true,
      isActive: true,
      health: { status: 'healthy', lastCheck: new Date(), uptime: 99.9 }
    },
    { 
      id: 'us-west-2', 
      name: 'Secondary', 
      region: 'us-west-2',
      endpoint: 'https://api-west.blockstop.io',
      isPrimary: false,
      isActive: false,
      health: { status: 'healthy', lastCheck: new Date(), uptime: 99.8 }
    }
  ],
  healthCheckInterval: 30000,
  failoverThreshold: 3,
  gracefulShutdownTimeout: 10000,
  readinessProbeEndpoint: '/health/ready',
  livenessProbeEndpoint: '/health/live',
  enabled: true
});

// RTO/RPO Management
const rtorpo = new RTORPOManager();

// Set targets
rtorpo.setRTOTarget({
  service: 'API Servers',
  targetMinutes: 5,
  priority: 'critical'
});

rtorpo.setRPOTarget({
  service: 'Database',
  targetMinutes: 5,
  backupFrequency: 'hourly',
  retentionDays: 30
});

// Create backup policy
const backupPolicy = rtorpo.createBackupPolicy({
  name: 'Daily Backup',
  services: ['database', 'documents'],
  enabled: true,
  schedule: {
    frequency: 'daily',
    time: '02:00' // 2 AM
  },
  retention: {
    dailyBackups: 7,
    weeklyBackups: 4,
    monthlyBackups: 12,
    yearlyBackups: 5
  },
  type: 'incremental',
  destination: 'multi-region',
  encryption: true,
  compression: true,
  verification: true
});

// Create DR drill
const drill = rtorpo.createDRDrill({
  name: 'Quarterly DR Drill',
  scope: 'multi-service',
  services: ['database', 'api', 'cache'],
  participants: ['team-dri', 'team-ops'],
  schedule: {
    nextDrill: new Date(Date.now() + 30 * 24 * 3600000),
    frequency: 'quarterly'
  }
});

// Run chaos test
const chaosTester = new ChaosTester();
const scenario = chaosTester.createScenario({
  name: 'Network Latency Spike',
  failureType: 'network-latency',
  target: 'api-servers',
  duration: 300000, // 5 minutes
  intensity: 'high',
  enabled: true
});

const test = await chaosTester.runChaosTest(scenario.id);
console.log(`Test Status: ${test.status}`);
console.log(`Availability: ${test.metrics.availability}%`);
console.log(`Recovery Time: ${test.metrics.recovery.timeToRecovery}ms`);
```

## UI Pages

### Workflow Management
- **URL**: `/app/automation/workflows`
- **Features**: Create, edit, execute, version, and monitor workflows

### Integration Hub
- **URL**: `/app/integrations`
- **Features**: Browse, configure, and health-check 23+ integrations

### App Marketplace
- **URL**: `/app/marketplace`
- **Features**: Discover, install, rate, and review community apps

### Disaster Recovery Dashboard
- **URL**: `/app/disaster-recovery`
- **Features**: Backup status, failover policies, RTO/RPO tracking, chaos testing

## Environment Variables

```bash
# Integrations
SLACK_API_KEY=xoxb-...
SLACK_TEAM_ID=T123...
JIRA_API_URL=https://jira.company.com
JIRA_API_TOKEN=...
SERVICENOW_INSTANCE=company.service-now.com
SERVICENOW_API_KEY=...

# Cloud Providers
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
GCP_PROJECT_ID=...
GCP_SERVICE_ACCOUNT_KEY=...

# Database (for storing workflows, integrations, etc.)
DATABASE_URL=postgresql://...
```

## Testing Workflows

```typescript
// Test a workflow
const workflow = engine.getWorkflow('workflow-id');
const execution = await engine.executeWorkflow(workflow.id, {
  threat: { id: 'test-123', type: 'malware', severity: 'critical' }
});

// Check execution results
if (execution.status === 'success') {
  console.log('Workflow executed successfully');
  execution.executionLog.forEach(log => {
    console.log(`${log.actionType}: ${log.status}`);
  });
} else {
  console.error('Workflow failed:', execution.error);
}
```

## Production Deployment

1. **Enable SSL/TLS** for webhook endpoints
2. **Store credentials** in HashiCorp Vault or AWS Secrets Manager
3. **Set up message queue** (Redis/RabbitMQ) for webhook delivery
4. **Configure monitoring** for workflow and integration health
5. **Set up logging** with centralized log aggregation
6. **Enable audit logging** for compliance
7. **Run chaos tests** in non-production environments

## Documentation

- Full implementation details: `/PHASE_29.4_IMPLEMENTATION.md`
- API specifications: See inline comments in source files
- Example workflows: See `__tests__` directory
- Integration guides: See each integration provider's documentation

## Support

For issues or questions:
1. Check the implementation guide
2. Review inline code documentation
3. Check example workflows in tests
4. Contact the development team

---

**Phase 29.4 Status**: Complete and Production-Ready
