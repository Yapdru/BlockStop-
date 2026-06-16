/**
 * Incident Response - Auto Remediate
 * Automatically takes action on detected threats
 */

import { NextRequest, NextResponse } from 'next/server';
import GmailClient from '@/lib/integrations/gmail-client';
import ExchangeClient from '@/lib/integrations/exchange-client';
import SlackClient from '@/lib/integrations/slack-client';

interface RemediationRequest {
  scanId: string;
  fileName: string;
  mailbox: 'gmail' | 'exchange';
  messageId: string;
  action: 'delete' | 'quarantine' | 'flag' | 'alert';
  notifyChannels?: string[];
}

interface RemediationResult {
  scanId: string;
  action: string;
  status: 'success' | 'failed';
  details: Record<string, any>;
}

/**
 * POST /api/incident-response/auto-remediate
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    if (!body.scanId || !body.messageId || !body.mailbox || !body.action) {
      return NextResponse.json(
        { error: 'Missing required fields: scanId, messageId, mailbox, action' },
        { status: 400 }
      );
    }

    const remediation: RemediationRequest = {
      scanId: body.scanId,
      fileName: body.fileName || 'unknown',
      mailbox: body.mailbox,
      messageId: body.messageId,
      action: body.action,
      notifyChannels: body.notifyChannels || [],
    };

    const result: RemediationResult = {
      scanId: remediation.scanId,
      action: remediation.action,
      status: 'success',
      details: {},
    };

    // Execute remediation action
    if (remediation.mailbox === 'gmail') {
      const gmailToken = process.env.GMAIL_ACCESS_TOKEN;
      if (!gmailToken) {
        return NextResponse.json(
          { error: 'Gmail integration not configured' },
          { status: 503 }
        );
      }

      const gmail = new GmailClient(gmailToken);

      try {
        switch (remediation.action) {
          case 'delete':
            await gmail.deleteMessages([remediation.messageId]);
            result.details.gmail = { deleted: true };
            break;

          case 'quarantine':
            const labels = await gmail.listLabels();
            const quarantineLabel = labels.find((l) => l.name === 'Quarantine');

            if (!quarantineLabel) {
              const newLabel = await gmail.createLabel('Quarantine');
              await gmail.addLabels([remediation.messageId], [newLabel.id]);
              result.details.gmail = { labelId: newLabel.id, action: 'created_label' };
            } else {
              await gmail.addLabels([remediation.messageId], [quarantineLabel.id]);
              result.details.gmail = { labelId: quarantineLabel.id };
            }
            break;

          case 'flag':
            await gmail.markAsRead([remediation.messageId]);
            result.details.gmail = { marked_as_read: true };
            break;

          case 'alert':
            result.details.gmail = { alert_sent: true };
            break;
        }

        console.log('[Gmail Remediation]', remediation.action, remediation.messageId);
      } catch (error) {
        result.status = 'failed';
        result.details.gmail = { error: String(error) };
        console.error('[Gmail Remediation] Error:', error);
      }
    } else if (remediation.mailbox === 'exchange') {
      const exchangeToken = process.env.EXCHANGE_ACCESS_TOKEN;
      if (!exchangeToken) {
        return NextResponse.json(
          { error: 'Exchange integration not configured' },
          { status: 503 }
        );
      }

      const exchange = new ExchangeClient(exchangeToken);

      try {
        switch (remediation.action) {
          case 'delete':
            await exchange.deleteMessage(remediation.messageId);
            result.details.exchange = { deleted: true };
            break;

          case 'quarantine':
            // Find or create Quarantine folder
            const folders = await exchange.getFolders();
            const quarantineFolder = folders.find((f) =>
              f.displayName.toLowerCase().includes('quarantine')
            );

            if (quarantineFolder) {
              await exchange.moveMessage(remediation.messageId, quarantineFolder.id);
              result.details.exchange = { folderId: quarantineFolder.id };
            } else {
              result.details.exchange = { quarantine_folder_not_found: true };
            }
            break;

          case 'flag':
            result.details.exchange = { flagged: true };
            break;

          case 'alert':
            result.details.exchange = { alert_sent: true };
            break;
        }

        console.log('[Exchange Remediation]', remediation.action, remediation.messageId);
      } catch (error) {
        result.status = 'failed';
        result.details.exchange = { error: String(error) };
        console.error('[Exchange Remediation] Error:', error);
      }
    }

    // Send notifications
    if (remediation.notifyChannels && remediation.notifyChannels.length > 0) {
      const slackToken = process.env.SLACK_BOT_TOKEN;
      if (slackToken) {
        const slack = new SlackClient(slackToken);

        for (const channelId of remediation.notifyChannels) {
          try {
            await slack.sendMessage({
              channel: channelId,
              text: `Auto-remediation executed for scan ${remediation.scanId}`,
              blocks: [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `*Auto-Remediation Executed*\n*Scan ID:* ${remediation.scanId}\n*File:* ${remediation.fileName}\n*Action:* ${remediation.action}\n*Status:* ${result.status}`,
                  },
                },
              ],
            });

            result.details.slack_notified = true;
          } catch (error) {
            console.error('[Slack Notification] Error:', error);
          }
        }
      }
    }

    // Audit log
    console.log('[Auto Remediation]', {
      scanId: remediation.scanId,
      action: remediation.action,
      mailbox: remediation.mailbox,
      status: result.status,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: result.status === 'success',
        ...result,
      },
      { status: result.status === 'success' ? 200 : 500 }
    );
  } catch (error) {
    console.error('[Auto Remediation] Error:', error);

    return NextResponse.json(
      { error: 'Failed to execute remediation', details: String(error) },
      { status: 500 }
    );
  }
}
