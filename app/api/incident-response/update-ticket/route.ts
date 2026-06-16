/**
 * Incident Response - Update Ticket
 * Updates existing tickets with new findings or status
 */

import { NextRequest, NextResponse } from 'next/server';
import ServiceNowClient from '@/lib/integrations/servicenow-client';
import JiraClient from '@/lib/integrations/jira-client';

interface UpdateRequest {
  platform: 'servicenow' | 'jira' | 'both';
  ticketId: string;
  action: 'add_note' | 'update_status' | 'resolve' | 'escalate';
  note?: string;
  status?: string;
  priority?: string;
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
 * POST /api/incident-response/update-ticket
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    if (!body.platform || !body.ticketId || !body.action) {
      return NextResponse.json(
        { error: 'Missing required fields: platform, ticketId, action' },
        { status: 400 }
      );
    }

    const update: UpdateRequest = {
      platform: body.platform,
      ticketId: body.ticketId,
      action: body.action,
      note: body.note,
      status: body.status,
      priority: body.priority,
    };

    const results: Record<string, any> = {};

    // Update ServiceNow
    if ((update.platform === 'servicenow' || update.platform === 'both') && serviceNowClient) {
      try {
        switch (update.action) {
          case 'add_note':
            if (update.note) {
              await serviceNowClient.addWorkNote(update.ticketId, update.note);
              results.servicenow = { status: 'success', action: 'note_added' };
            }
            break;

          case 'update_status':
            if (update.status) {
              await serviceNowClient.updateIncident(update.ticketId, {
                state: update.status,
              });
              results.servicenow = { status: 'success', action: 'status_updated' };
            }
            break;

          case 'resolve':
            await serviceNowClient.updateIncident(update.ticketId, {
              state: 'resolved',
              short_description: `[RESOLVED] ${update.ticketId}`,
            });
            results.servicenow = { status: 'success', action: 'resolved' };
            break;

          case 'escalate':
            await serviceNowClient.updateIncident(update.ticketId, {
              urgency: '1',
              impact: '1',
              priority: '1',
            });
            results.servicenow = { status: 'success', action: 'escalated' };
            break;
        }

        console.log('[ServiceNow] Updated:', update.ticketId, update.action);
      } catch (error) {
        results.servicenow = { status: 'failed', error: String(error) };
        console.error('[ServiceNow] Error:', error);
      }
    }

    // Update Jira
    if ((update.platform === 'jira' || update.platform === 'both') && jiraClient) {
      try {
        switch (update.action) {
          case 'add_note':
            if (update.note) {
              await jiraClient.addComment(update.ticketId, update.note);
              results.jira = { status: 'success', action: 'comment_added' };
            }
            break;

          case 'update_status':
            if (update.status) {
              const transitions = await jiraClient.getTransitions(update.ticketId);
              const transition = transitions.find(
                (t) => t.name.toLowerCase() === update.status?.toLowerCase()
              );
              if (transition) {
                await jiraClient.transitionIssue(update.ticketId, transition.id);
                results.jira = { status: 'success', action: 'status_updated' };
              }
            }
            break;

          case 'resolve':
            const transitions = await jiraClient.getTransitions(update.ticketId);
            const resolveTransition = transitions.find(
              (t) => t.name.toLowerCase() === 'done' || t.name.toLowerCase() === 'resolved'
            );
            if (resolveTransition) {
              await jiraClient.transitionIssue(update.ticketId, resolveTransition.id);
            }
            results.jira = { status: 'success', action: 'resolved' };
            break;

          case 'escalate':
            await jiraClient.updateIssue(update.ticketId, {
              priority: 'Critical',
            });
            results.jira = { status: 'success', action: 'escalated' };
            break;
        }

        console.log('[Jira] Updated:', update.ticketId, update.action);
      } catch (error) {
        results.jira = { status: 'failed', error: String(error) };
        console.error('[Jira] Error:', error);
      }
    }

    // Check if any platform succeeded
    const anySuccess = Object.values(results).some((r: any) => r.status === 'success');

    if (!anySuccess) {
      return NextResponse.json(
        { error: 'Failed to update ticket', details: results },
        { status: 500 }
      );
    }

    // Audit log
    console.log('[Incident Update]', {
      ticketId: update.ticketId,
      action: update.action,
      platform: update.platform,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        ticketId: update.ticketId,
        action: update.action,
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Incident Update] Error:', error);

    return NextResponse.json(
      { error: 'Failed to update ticket', details: String(error) },
      { status: 500 }
    );
  }
}
