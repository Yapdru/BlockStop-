# Advanced Reporting Guide - BlockStop Phase 29.3

## Overview

BlockStop now includes a comprehensive custom reporting engine that supports multiple formats, automated scheduling, and dashboard creation. This guide covers all reporting features.

## Custom Report Generation

### Report Types

1. **Executive Summary** - High-level overview for leadership
   - Key metrics and KPIs
   - Threat distribution overview
   - Risk recommendations

2. **Technical Analysis** - Detailed technical findings
   - Detailed threat breakdown
   - Timeline analysis
   - Evidence details

3. **Forensics Report** - Complete forensic investigation
   - Evidence collection
   - Chain of custody
   - Findings and conclusions

4. **Threat Hunting Report** - Hunt-specific findings
   - IOC matches
   - Behavioral analysis
   - Pattern detections

### Generating Reports

#### Via API

```bash
curl -X POST http://localhost:3000/api/reporting/generate \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "executive",
    "format": "pdf",
    "timeRange": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    },
    "includeCharts": true,
    "includeBranding": true
  }'
```

#### Via Dashboard

1. Navigate to Reporting > Report Builder
2. Configure report settings
3. Select sections to include
4. Choose export format
5. Click "Generate Report"

### Export Formats

- **PDF** - Professional, branded reports with charts
- **Excel** - Data-heavy reports with sorting/filtering
- **CSV** - Simple, portable format
- **JSON** - Machine-readable format

### Customization

#### Custom Sections

Add custom sections to your report:

```typescript
const report = await reportGenerator.generateCustomReport({
  sections: [
    {
      title: "Custom Analysis",
      content: "Your analysis here",
      findings: [
        {
          type: "custom_finding",
          severity: "high",
          description: "Finding description",
          recommendation: "Remediation steps"
        }
      ]
    }
  ]
});
```

#### Branding Support

Customize report appearance:

```typescript
const config = {
  branding: {
    companyName: "Your Organization",
    companyLogo: "https://...",
    primaryColor: "#0066cc",
    footerText: "Confidential"
  }
};
```

## Scheduled Reports

### Creating Schedules

```typescript
const manager = new ScheduledReportsManager();

const schedule = await manager.createSchedule(
  "Weekly Executive Report",
  "executive",
  "weekly",
  "admin@company.com"
);
```

### Frequency Options

- **Daily** - Every day at midnight
- **Weekly** - Every Monday at midnight
- **Monthly** - First of each month
- **Custom** - Custom cron expression

### Email Distribution

```typescript
const distribution = await manager.createDistribution(
  scheduleId,
  ["exec1@company.com", "exec2@company.com"],
  {
    ccRecipients: ["ciso@company.com"],
    includeAttachment: true,
    attachmentFormats: ["pdf"],
    includeLink: true,
    dashboardUrl: "https://blockstop.company.com/dashboard"
  }
);
```

### Report History

Track all generated reports:

```typescript
const history = await manager.getHistory(scheduleId, 50);
// Returns last 50 reports with delivery status
```

## Custom Dashboards

### Creating Dashboards

```typescript
const builder = new DashboardBuilder();

const dashboard = await builder.createDashboard(
  "Security Operations Center",
  "admin@company.com",
  {
    description: "Real-time SOC monitoring",
    isPublic: false,
    tags: ["soc", "operations"]
  }
);
```

### Dashboard Widgets

Supported widget types:

- **Chart** - Line, bar, pie, area charts
- **Table** - Data tables with sorting
- **KPI** - Key performance indicators
- **Alert** - Real-time alerts
- **Timeline** - Event timelines
- **Heatmap** - Temporal heatmaps

### Adding Widgets

```typescript
const widget = await builder.addWidget(dashboardId, {
  type: "chart",
  title: "Threat Trends",
  position: { row: 0, col: 0, width: 6, height: 4 },
  config: {
    dataSource: "threats/trend",
    chartType: "line",
    timeRange: "30d"
  }
});
```

### Dashboard Templates

Use pre-built templates:

```typescript
const templates = await builder.getTemplates("executive");
// Available: executive, technical, security, operational

const dashboard = await builder.createFromTemplate(
  "template-executive",
  "My Dashboard",
  "user@company.com"
);
```

### Sharing Dashboards

```typescript
await builder.shareDashboard(dashboardId, [
  "user1@company.com",
  "user2@company.com"
]);
```

### Dashboard Snapshots

Capture dashboard state:

```typescript
const snapshot = await builder.createSnapshot(dashboardId);
// Returns snapshot with cached data at specific time
```

## Advanced Features

### Multi-Format Export

All reports support multiple export formats:

```typescript
const jsonReport = await reportGenerator.exportToJSON(reportId);
const pdfReport = await reportGenerator.exportToPDF(reportId);
const htmlReport = await reportGenerator.exportToHTML(reportId);
```

### Report Versioning

Automatic versioning for tracking changes:

```typescript
const history = await reportGenerator.getReportHistory(reportId);
// Returns all versions with timestamps
```

### Bulk Report Generation

Generate multiple reports efficiently:

```typescript
const reports = await reportGenerator.generateBulkReports([
  { type: "executive", title: "Jan 2024" },
  { type: "technical", title: "Jan 2024" },
  { type: "forensics", title: "Case ABC" }
]);
```

## API Reference

### Report Generator

- `generateExecutiveReport()` - Create executive summary
- `generateTechnicalReport()` - Create technical report
- `generateForensicsReport()` - Create forensics report
- `exportToHTML()` - Export as HTML
- `exportToPDF()` - Export as PDF
- `exportToJSON()` - Export as JSON
- `getReport()` - Retrieve specific report
- `getAllReports()` - List all reports

### Scheduled Reports Manager

- `createSchedule()` - Create new schedule
- `updateSchedule()` - Modify schedule
- `deleteSchedule()` - Delete schedule
- `createDistribution()` - Add distribution list
- `getHistory()` - Get report history
- `triggerReportGeneration()` - Manual trigger
- `startAll()` - Start all schedules
- `stopAll()` - Stop all schedules

### Dashboard Builder

- `createDashboard()` - Create new dashboard
- `addWidget()` - Add widget to dashboard
- `updateWidget()` - Modify widget
- `removeWidget()` - Delete widget
- `reorderWidgets()` - Change widget order
- `shareDashboard()` - Share with users
- `createSnapshot()` - Capture dashboard state
- `getTemplates()` - Get available templates
- `createTemplate()` - Save as template
- `exportDashboard()` - Export configuration
- `importDashboard()` - Import configuration

## Best Practices

1. **Schedule at Off-Peak Times** - Generate reports outside business hours
2. **Use Appropriate Formats** - PDF for executives, JSON for systems
3. **Template Creation** - Save frequently used report configurations
4. **Regular Review** - Monitor report delivery and accuracy
5. **Access Control** - Limit report access based on roles
6. **Data Retention** - Archive old reports for compliance

## Troubleshooting

### Reports Not Generating

- Check schedule is enabled
- Verify sufficient data available
- Review system logs for errors

### Delivery Failures

- Verify email configuration
- Check recipient email addresses
- Review SMTP error logs

### Performance Issues

- Reduce time range for large datasets
- Disable unnecessary charts
- Use JSON format for large reports

