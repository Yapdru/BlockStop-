/**
 * Teams Webhook Endpoint
 * Handles activities and interactions from Teams bot
 */

import { NextRequest, NextResponse } from 'next/server';

interface TeamsActivity {
  type: string;
  id: string;
  timestamp: string;
  from?: { id: string; name: string };
  conversation?: { id: string };
  text?: string;
  attachments?: any[];
  value?: Record<string, any>;
}

/**
 * POST /api/teams/webhook
 * Handle Teams activities
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify Teams request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[Teams] Invalid or missing authorization header');
      return NextResponse.json(
        { error: 'Invalid authorization' },
        { status: 401 }
      );
    }

    const activity: TeamsActivity = {
      type: body.type,
      id: body.id,
      timestamp: body.timestamp,
      from: body.from,
      conversation: body.conversation,
      text: body.text,
      attachments: body.attachments,
      value: body.value,
    };

    console.log('[Teams Activity]', {
      type: activity.type,
      from: activity.from?.name,
      conversation: activity.conversation?.id,
      timestamp: new Date().toISOString(),
    });

    // Handle different activity types
    switch (activity.type) {
      case 'message':
        await handleMessage(activity);
        break;

      case 'invoke':
        await handleInvoke(activity);
        break;

      case 'conversationUpdate':
        await handleConversationUpdate(activity);
        break;

      case 'adaptiveCard':
        await handleAdaptiveCard(activity);
        break;

      default:
        console.log('[Teams] Unknown activity type:', activity.type);
    }

    // Acknowledge receipt
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('[Teams Webhook] Error:', error);

    return NextResponse.json(
      { error: 'Failed to process Teams webhook', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Handle message activity
 */
async function handleMessage(activity: TeamsActivity): Promise<void> {
  const text = activity.text || '';

  console.log('[Teams Message]', {
    user: activity.from?.name,
    channel: activity.conversation?.id,
    text: text.substring(0, 100),
  });

  // Parse commands
  if (text.startsWith('@BlockStop')) {
    const command = text.replace('@BlockStop', '').trim().split(' ')[0].toLowerCase();

    if (command === 'scan') {
      console.log('[Teams] Scan command received');
      // Queue scan job
    } else if (command === 'status') {
      console.log('[Teams] Status command received');
      // Get status
    } else if (command === 'help') {
      console.log('[Teams] Help command received');
      // Show help
    }
  }

  // Handle file attachments
  if (activity.attachments && activity.attachments.length > 0) {
    for (const attachment of activity.attachments) {
      if (attachment.contentType === 'application/vnd.microsoft.teams.file') {
        console.log('[Teams] File received:', attachment.name);
        // Queue scan job for file
      }
    }
  }
}

/**
 * Handle invoke activity (adaptive card actions)
 */
async function handleInvoke(activity: TeamsActivity): Promise<void> {
  const name = (activity as any).name || '';
  const value = activity.value || {};

  console.log('[Teams Invoke]', {
    name,
    action: value.action,
  });

  if (name === 'adaptiveCard/action') {
    const action = value.action || '';

    if (action === 'OpenUrl') {
      console.log('[Teams] Open URL action:', value.openUrl);
    } else if (action === 'Action.Execute') {
      console.log('[Teams] Execute action:', value.id);

      // Handle different action IDs
      if (value.id === 'scan_file') {
        console.log('[Teams] Scan file action triggered');
      } else if (value.id === 'quarantine_file') {
        console.log('[Teams] Quarantine file action triggered');
      } else if (value.id === 'delete_file') {
        console.log('[Teams] Delete file action triggered');
      }
    }
  }
}

/**
 * Handle conversation update activity
 */
async function handleConversationUpdate(activity: TeamsActivity): Promise<void> {
  console.log('[Teams Conversation Update]', {
    conversation: activity.conversation?.id,
    membersAdded: (activity as any).membersAdded?.length,
    membersRemoved: (activity as any).membersRemoved?.length,
  });

  // Bot added to conversation
  if ((activity as any).membersAdded) {
    const isBotAdded = (activity as any).membersAdded.some(
      (member: any) => member.id === process.env.TEAMS_BOT_ID
    );

    if (isBotAdded) {
      console.log('[Teams] Bot added to conversation');
      // Send welcome message
    }
  }
}

/**
 * Handle adaptive card activity
 */
async function handleAdaptiveCard(activity: TeamsActivity): Promise<void> {
  console.log('[Teams Adaptive Card]', {
    cardId: (activity as any).cardId,
    actionType: (activity as any).actionType,
  });

  if ((activity as any).actionType === 'submit') {
    const formData = activity.value || {};
    console.log('[Teams] Form submission:', Object.keys(formData));

    // Process form data based on form type
  }
}
