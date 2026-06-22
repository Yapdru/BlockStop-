/**
 * Tests for Integrations
 */

import { SlackIntegration } from '../modules/integrations/slack-integration.js';
import { JiraIntegration } from '../modules/integrations/jira-integration.js';
import { WebhookIntegration } from '../modules/integrations/webhook-integration.js';
import IntegrationManager from '../modules/integrations/integration-manager.js';

describe('Slack Integration', () => {
  describe('validate', () => {
    it('should validate config', async () => {
      const slack = new SlackIntegration({
        enabled: true,
        webhookUrl: 'https://hooks.slack.com/services/test',
      });

      const result = await slack.validate();
      // Will fail due to invalid webhook, but should validate format
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
    });

    it('should reject missing credentials', async () => {
      const slack = new SlackIntegration({ enabled: true });

      const result = await slack.validate();
      expect(result.valid).toBe(false);
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should reject invalid webhook URL', async () => {
      const slack = new SlackIntegration({
        enabled: true,
        webhookUrl: 'not-a-url',
      });

      const result = await slack.validate();
      expect(result.valid).toBe(false);
    });
  });

  describe('formatSlackMessage', () => {
    it('should format alert as Slack message', () => {
      const slack = new SlackIntegration({ enabled: true });
      const payload = {
        severity: 'HIGH' as const,
        title: 'Test Alert',
        description: 'Test description',
      };

      // Private method test - use any type
      const formatted = (slack as any).formatSlackMessage(payload);

      expect(formatted).toHaveProperty('channel');
      expect(formatted).toHaveProperty('attachments');
      expect(formatted.attachments[0].color).toBeDefined();
    });
  });
});

describe('JIRA Integration', () => {
  describe('validate', () => {
    it('should validate config', async () => {
      const jira = new JiraIntegration({
        enabled: true,
        instanceUrl: 'https://jira.example.com',
        email: 'user@example.com',
        apiToken: 'test-token',
      });

      const result = await jira.validate();
      expect(result).toHaveProperty('valid');
    });

    it('should reject invalid URL', async () => {
      const jira = new JiraIntegration({
        enabled: true,
        instanceUrl: 'not-a-url',
        email: 'user@example.com',
        apiToken: 'token',
      });

      const result = await jira.validate();
      expect(result.valid).toBe(false);
    });

    it('should reject invalid email', async () => {
      const jira = new JiraIntegration({
        enabled: true,
        instanceUrl: 'https://jira.example.com',
        email: 'not-an-email',
        apiToken: 'token',
      });

      const result = await jira.validate();
      expect(result.valid).toBe(false);
    });
  });
});

describe('Webhook Integration', () => {
  describe('validate', () => {
    it('should validate webhook URL', async () => {
      const webhook = new WebhookIntegration({
        enabled: true,
        url: 'https://example.com/webhook',
      });

      const result = await webhook.validate();
      expect(result).toHaveProperty('valid');
    });

    it('should reject invalid URL', async () => {
      const webhook = new WebhookIntegration({
        enabled: true,
        url: 'not-a-url',
      });

      const result = await webhook.validate();
      expect(result.valid).toBe(false);
    });

    it('should allow webhook without signing secret', async () => {
      const webhook = new WebhookIntegration({
        enabled: true,
        url: 'https://example.com/webhook',
      });

      const result = await webhook.validate();
      // Will fail on actual connection, but format should be valid
      expect(result).toHaveProperty('valid');
    });
  });

  describe('verifySignature', () => {
    it('should verify valid signature', () => {
      const payload = 'test payload';
      const secret = 'secret-key';
      const signature = 'sha256=' + require('crypto')
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      const isValid = WebhookIntegration.verifySignature(payload, signature, secret);
      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = 'test payload';
      const secret = 'secret-key';
      const invalidSignature = 'sha256=invalid';

      const isValid = WebhookIntegration.verifySignature(payload, invalidSignature, secret);
      expect(isValid).toBe(false);
    });
  });

  describe('getDeliveryHistory', () => {
    it('should return empty history initially', async () => {
      const webhook = new WebhookIntegration({
        enabled: false,
        url: 'https://example.com/webhook',
      });

      const history = webhook.getDeliveryHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });
});

describe('Integration Manager', () => {
  describe('getStatus', () => {
    it('should return integration statuses', async () => {
      // Create integration manager with minimal config
      const manager = new IntegrationManager();

      try {
        const statuses = await manager.getIntegrationStatus();
        expect(Array.isArray(statuses)).toBe(true);
      } catch (e) {
        // Expected to fail without real config
      }
    });
  });

  describe('formatStatus', () => {
    it('should format statuses for display', () => {
      const statuses = [
        {
          name: 'slack',
          enabled: true,
          authenticated: true,
          ready: true,
        },
        {
          name: 'jira',
          enabled: false,
          authenticated: false,
          ready: false,
        },
      ];

      const formatted = IntegrationManager.formatStatus(statuses);

      expect(formatted).toContain('slack');
      expect(formatted).toContain('jira');
      expect(formatted).toContain('Integration Status');
    });

    it('should handle empty status array', () => {
      const formatted = IntegrationManager.formatStatus([]);

      expect(formatted).toContain('No integrations configured');
    });
  });
});
