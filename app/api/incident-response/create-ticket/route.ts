/**
 * Incident Response - Create Ticket
 * Creates tickets in ServiceNow and Jira based on scan findings
 */

import { NextRequest, NextResponse } from 'next/server';
import ServiceNowClient from '@/lib/integrations/servicenow-client';
import JiraClient from '@/lib/integrations/jira-client';

interface IncidentRequest {
  type: 'malware' | 'phishing' | 'data-leak' | 'suspicious-activity';
  severity: 'critical' | 'high' | 'medium' | 'low';
  fileName: string;
  description: string;
  findings: string[];
  scanId?: string;
  metadata?: Record<string, any>;
}

interface TicketResponse {
  serviceNow?: { ticketId: string; number: string };
  jira?: { key: string; id: string };
}

// Initialize clients
const serviceNowClient = process.env.SERVICENOW_URL
  ? new ServiceNowClient(
      process.env.SERVICENOW_URL,
      process.env.SERVICENOW_USERNAME || '',
      process.env.SERVICENOW_PASSWORD || ''
    )
  : null;

const jiraClient = process.env.JIRA_URL
  ? new JiraClient(
      process.env.JIRA_URL,
      process.env.JIRA_EMAIL || '',
      process.env.JIRA_TOKEN || ''
    )
  : null;

/**
 * Map severity to priority
 */
function mapSeverityToPriority(severity: string): string {
  switch (severity) {
    case 'critical':
      return '1';
    case 'high':
      return '2';
    case 'medium':
      return '3';
    case 'low':
      return '5';
    default:
      return '3';
  }
}

/**
 * POST /api/incident-response/create-ticket
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    if (!body.fileName || !body.type || !body.severity) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName, type, severity' },
        { status: 400 }
      );
    }

    const incident: IncidentRequest = {
      type: body.type,
      severity: body.severity,
      fileName: body.fileName,
      description: body.description || 'Security incident detected by BlockStop',
      findings: body.findings || [],
      scanId: body.scanId,
      metadata: body.metadata,
    };

    const tickets: TicketResponse = {};

    // Create in ServiceNow
    if (serviceNowClient) {
      try {
        const description = [
          `File: ${incident.fileName}`,
          `Type: ${incident.type}`,
          `Severity: ${incident.severity}`,
          `Scan ID: ${incident.scanId || 'N/A'}`,
          '',
          incident.description,
          '',
          'Findings:',
          ...incident.findings.map((f) => `- ${f}`),
        ].join('\n');

        const snTicket = await serviceNowClient.createIncident({
          short_description: `[BlockStop] ${incident.type.toUpperCase()} - ${incident.fileName}`,
          description,
          urgency: mapSeverityToPriority(incident.severity),
          impact: mapSeverityToPriority(incident.severity),
          category: 'Security',
          subcategory: 'Malware/Threat Detection',
          custom_fields: {
            blockstop_scan: incident.scanId,
            blockstop_severity: incident.severity,
          },
        });

        tickets.serviceNow = {
          ticketId: snTicket.sys_id,
          number: snTicket.number,
        };

        console.log('[ServiceNow] Created incident:', snTicket.number);
      } catch (error) {
        console.error('[ServiceNow] Error:', error);
        // Continue to try Jira
      }
    }

    // Create in Jira
    if (jiraClient) {
      try {
        const issueType =
          incident.severity === 'critical' ? 'Urgent' : incident.severity === 'high' ? 'Bug' : 'Task';

        const jiraIssue = await jiraClient.createIssue({
          project: process.env.JIRA_PROJECT || 'SEC',
          summary: `[BlockStop] ${incident.type.toUpperCase()} - ${incident.fileName}`,
          description: [
            `**Type:** ${incident.type}`,
            `**Severity:** ${incident.severity}`,
            `**File:** ${incident.fileName}`,
            `**Scan ID:** ${incident.scanId || 'N/A'}`,
            '',
            incident.description,
            '',
            '**Findings:**',
            ...incident.findings.map((f) => `* ${f}`),
          ].join('\n'),
          issueType,
          priority: mapSeverityToPriority(incident.severity),
          labels: ['blockstop', incident.type, incident.severity],
        });

        tickets.jira = {
          key: jiraIssue.key,
          id: jiraIssue.id,
        };

        console.log('[Jira] Created issue:', jiraIssue.key);
      } catch (error) {
        console.error('[Jira] Error:', error);
        // Continue with response
      }
    }

    // Check if at least one ticket was created
    if (Object.keys(tickets).length === 0) {
      return NextResponse.json(
        { error: 'Failed to create tickets in any platform' },
        { status: 500 }
      );
    }

    // Audit log
    console.log('[Incident Response] Created tickets', {
      fileName: incident.fileName,
      severity: incident.severity,
      type: incident.type,
      scanId: incident.scanId,
      tickets: Object.keys(tickets),
    });

    return NextResponse.json(
      {
        success: true,
        fileName: incident.fileName,
        tickets,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Incident Response] Error:', error);

    return NextResponse.json(
      { error: 'Failed to create incident ticket', details: String(error) },
      { status: 500 }
    );
  }
}
