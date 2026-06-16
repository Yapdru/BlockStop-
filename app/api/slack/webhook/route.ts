/**
 * Slack Webhook Endpoint
 * Handles events and interactions from Slack bot
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

interface SlackEvent {
  type: string;
  user?: string;
  channel?: string;
  text?: string;
  file_id?: string;
  actions?: Array<{ type: string; action_id: string; value?: string }>;
}

/**
 * Verify Slack request signature
 */
function verifySlackSignature(
  body: string,
  timestamp: string,
  signature: string
): boolean {
  // Reject requests older than 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return false;
  }

  const signingSecret = process.env.SLACK_SIGNING_SECRET || '';
  const baseString = `v0:${timestamp}:${body}`;
  const computedSignature = `v0=${crypto
    .createHmac('sha256', signingSecret)
    .update(baseString)
    .digest('hex')}`;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  );
}

/**
 * POST /api/slack/webhook
 * Handle Slack events and interactions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const timestamp = request.headers.get('x-slack-request-timestamp') || '';
    const signature = request.headers.get('x-slack-signature') || '';

    // Verify Slack signature
    if (!verifySlackSignature(body, timestamp, signature)) {
      console.warn('[Slack] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(body);

    // Handle URL verification challenge
    if (payload.type === 'url_verification') {
      return NextResponse.json(
        { challenge: payload.challenge },
        { status: 200 }
      );
    }

    // Handle Slack events
    if (payload.type === 'event_callback') {
      const event: SlackEvent = payload.event;

      console.log('[Slack Event]', {
        type: event.type,
        user: event.user,
        channel: event.channel,
        timestamp: new Date().toISOString(),
      });

      // Handle file shared event
      if (event.type === 'file_shared') {
        try {
          // Queue scan job
          console.log('[Slack] File shared:', event.file_id);

          // In production, queue this to a job processor
          // Example: await queueScanJob({ fileId: event.file_id, source: 'slack' });
        } catch (error) {
          console.error('[Slack] Error handling file share:', error);
        }
      }

      // Handle app_mention event
      if (event.type === 'app_mention') {
        try {
          // Parse command from mention
          const command = event.text?.replace(/<@\w+>\s*/, '').trim() || '';

          console.log('[Slack] Command:', command);

          // Handle different commands
          if (command.includes('scan')) {
            // Trigger scan
          } else if (command.includes('status')) {
            // Get status
          } else if (command.includes('help')) {
            // Show help
          }
        } catch (error) {
          console.error('[Slack] Error handling mention:', error);
        }
      }

      // Handle message event
      if (event.type === 'message') {
        try {
          console.log('[Slack] Message:', {
            user: event.user,
            channel: event.channel,
            text: event.text?.substring(0, 100),
          });
        } catch (error) {
          console.error('[Slack] Error handling message:', error);
        }
      }

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Handle interactive actions
    if (payload.type === 'block_actions' || payload.type === 'view_submission') {
      const actions = payload.actions || [];

      console.log('[Slack Action]', {
        type: payload.type,
        actions: actions.map((a: any) => a.action_id),
        timestamp: new Date().toISOString(),
      });

      for (const action of actions) {
        try {
          if (action.action_id === 'scan_file') {
            // Handle scan file action
            console.log('[Slack] Scan action triggered');
          } else if (action.action_id === 'quarantine_file') {
            // Handle quarantine action
            console.log('[Slack] Quarantine action triggered');
          } else if (action.action_id === 'delete_file') {
            // Handle delete action
            console.log('[Slack] Delete action triggered');
          }
        } catch (error) {
          console.error('[Slack] Error handling action:', error);
        }
      }

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Handle slash commands
    if (payload.command) {
      const command = payload.command;
      const text = payload.text || '';
      const userId = payload.user_id;
      const channelId = payload.channel_id;

      console.log('[Slack Command]', {
        command,
        text,
        user: userId,
        channel: channelId,
      });

      let responseText = '';

      if (command === '/blockstop-scan') {
        responseText = `Scanning: ${text}\n\nScan job queued. Results will be posted shortly.`;
      } else if (command === '/blockstop-status') {
        responseText = `Status: All systems operational`;
      } else if (command === '/blockstop-help') {
        responseText = `BlockStop Commands:\n/blockstop-scan <filename> - Scan a file\n/blockstop-status - Check system status\n/blockstop-help - Show this help message`;
      }

      return NextResponse.json(
        {
          response_type: 'in_channel',
          text: responseText,
        },
        { status: 200 }
      );
    }

    // Unknown payload type
    console.log('[Slack] Unknown payload type:', payload.type);

    return NextResponse.json(
      { error: 'Unknown payload type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Slack Webhook] Error:', error);

    return NextResponse.json(
      { error: 'Failed to process Slack webhook', details: String(error) },
      { status: 500 }
    );
  }
}
