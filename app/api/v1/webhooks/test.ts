import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

interface TestWebhookRequest {
  webhook_id: string;
  event_type?: string;
}

interface TestPayload {
  id: string;
  event: string;
  timestamp: string;
  data: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "unauthorized",
          error_description: "Bearer token required",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token has required scope
    if (!hasScope(token, "webhooks:write")) {
      return NextResponse.json(
        {
          error: "forbidden",
          error_description: "Insufficient permissions to test webhooks",
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as TestWebhookRequest;
    const { webhook_id, event_type } = body;

    // Validate webhook_id
    if (!webhook_id) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "webhook_id is required",
        },
        { status: 400 }
      );
    }

    // Get user from token
    const userId = getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json(
        {
          error: "unauthorized",
          error_description: "Invalid token",
        },
        { status: 401 }
      );
    }

    // Verify webhook belongs to user
    const webhookData = await getWebhook(userId, webhook_id);
    if (!webhookData) {
      return NextResponse.json(
        {
          error: "not_found",
          error_description: "Webhook not found",
        },
        { status: 404 }
      );
    }

    // Create test payload
    const testEvent = event_type || "threat.detected";
    const testPayload: TestPayload = {
      id: crypto.randomBytes(8).toString("hex"),
      event: testEvent,
      timestamp: new Date().toISOString(),
      data: generateTestData(testEvent),
    };

    // Send test webhook (in production, use queue system)
    const deliveryId = crypto.randomBytes(8).toString("hex");
    const signingSecret = webhookData.signing_secret || "";
    const signature = generateSignature(JSON.stringify(testPayload), signingSecret);

    try {
      // In production: add to queue for async delivery
      // await deliveryQueue.enqueue({
      //   webhook_id,
      //   delivery_id: deliveryId,
      //   payload: testPayload,
      //   url: webhookData.url,
      // });

      return NextResponse.json(
        {
          success: true,
          delivery_id: deliveryId,
          webhook_id,
          event: testEvent,
          payload: testPayload,
          status: "pending",
          message: "Test webhook dispatched successfully",
        },
        { status: 202 }
      );
    } catch (deliveryError) {
      console.error("Error delivering test webhook:", deliveryError);
      return NextResponse.json(
        {
          error: "delivery_failed",
          error_description: "Failed to deliver test webhook",
          delivery_id: deliveryId,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error testing webhook:", error);
    return NextResponse.json(
      {
        error: "server_error",
        error_description: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

function hasScope(token: string, requiredScope: string): boolean {
  return token.length > 0;
}

function getUserIdFromToken(token: string): string | null {
  if (token.length > 0) {
    return "user_123";
  }
  return null;
}

async function getWebhook(
  userId: string,
  webhookId: string
): Promise<any | null> {
  // In production: SELECT * FROM webhooks WHERE id = ? AND user_id = ?
  return {
    id: webhookId,
    url: "https://example.com/webhook",
    signing_secret: "secret_123",
  };
}

function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

function generateTestData(eventType: string): Record<string, any> {
  const testData: Record<string, Record<string, any>> = {
    "threat.detected": {
      threat_id: "threat_" + crypto.randomBytes(4).toString("hex"),
      threat_type: "malware",
      severity: "high",
      source: "email",
      detected_at: new Date().toISOString(),
    },
    "file.scanned": {
      file_id: "file_" + crypto.randomBytes(4).toString("hex"),
      filename: "test.exe",
      file_size: 1024,
      scan_result: "clean",
      scanned_at: new Date().toISOString(),
    },
    "email.checked": {
      email_id: "email_" + crypto.randomBytes(4).toString("hex"),
      from: "sender@example.com",
      to: "recipient@example.com",
      risk_score: 25,
      checked_at: new Date().toISOString(),
    },
  };

  return testData[eventType] || { event_type: eventType };
}
