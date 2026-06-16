/**
 * Gmail API Client
 * Handles email scanning and security integrations
 */

import axios, { AxiosInstance } from 'axios';

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: string;
  payload: {
    mimeType: string;
    filename?: string;
    parts?: any[];
    body?: { data: string };
    headers?: Array<{ name: string; value: string }>;
  };
}

interface GmailLabel {
  id: string;
  name: string;
  type: string;
  color?: { textColor?: string; backgroundColor?: string };
}

export class GmailClient {
  private client: AxiosInstance;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;

    this.client = axios.create({
      baseURL: 'https://gmail.googleapis.com/gmail/v1/users/me',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[GmailClient] Error:', {
          status: error.response?.status,
          data: error.response?.data,
        });
        throw error;
      }
    );
  }

  /**
   * Get a message by ID
   */
  async getMessage(messageId: string, format: string = 'full'): Promise<GmailMessage> {
    try {
      const response = await this.client.get(`/messages/${messageId}`, {
        params: { format },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get Gmail message: ${error}`);
    }
  }

  /**
   * List messages based on query
   */
  async listMessages(
    query: string = '',
    maxResults: number = 10
  ): Promise<Array<{ id: string; threadId: string }>> {
    try {
      const response = await this.client.get('/messages', {
        params: {
          q: query,
          maxResults,
        },
      });

      return response.data.messages || [];
    } catch (error) {
      throw new Error(`Failed to list Gmail messages: ${error}`);
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(messageIds: string[]): Promise<boolean> {
    try {
      await this.client.post('/messages/batchModify', {
        ids: messageIds,
        addLabelIds: [],
        removeLabelIds: ['UNREAD'],
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to mark messages as read: ${error}`);
    }
  }

  /**
   * Add labels to messages
   */
  async addLabels(messageIds: string[], labelIds: string[]): Promise<boolean> {
    try {
      await this.client.post('/messages/batchModify', {
        ids: messageIds,
        addLabelIds: labelIds,
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to add Gmail labels: ${error}`);
    }
  }

  /**
   * Delete messages (move to trash)
   */
  async deleteMessages(messageIds: string[]): Promise<boolean> {
    try {
      await this.client.post('/messages/batchDelete', {
        ids: messageIds,
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to delete Gmail messages: ${error}`);
    }
  }

  /**
   * Get list of labels
   */
  async listLabels(): Promise<GmailLabel[]> {
    try {
      const response = await this.client.get('/labels');

      return response.data.labels || [];
    } catch (error) {
      throw new Error(`Failed to list Gmail labels: ${error}`);
    }
  }

  /**
   * Create a label
   */
  async createLabel(name: string): Promise<GmailLabel> {
    try {
      const response = await this.client.post('/labels', {
        name,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to create Gmail label: ${error}`);
    }
  }

  /**
   * Get attachments from a message
   */
  async getAttachments(messageId: string): Promise<Array<{ filename: string; size: number }>> {
    try {
      const message = await this.getMessage(messageId);

      const attachments: Array<{ filename: string; size: number }> = [];

      const processParts = (parts: any[] = []) => {
        parts.forEach((part) => {
          if (part.filename && part.filename.length > 0) {
            attachments.push({
              filename: part.filename,
              size: part.size || 0,
            });
          }
          if (part.parts) {
            processParts(part.parts);
          }
        });
      };

      if (message.payload.parts) {
        processParts(message.payload.parts);
      }

      return attachments;
    } catch (error) {
      throw new Error(`Failed to get Gmail attachments: ${error}`);
    }
  }

  /**
   * Send a message
   */
  async sendMessage(to: string, subject: string, body: string): Promise<{ id: string }> {
    try {
      const email = [
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        body,
      ].join('\n');

      const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

      const response = await this.client.post('/messages/send', {
        raw: encodedEmail,
      });

      return { id: response.data.id };
    } catch (error) {
      throw new Error(`Failed to send Gmail message: ${error}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ isValid: boolean; email?: string; error?: string }> {
    try {
      const response = await this.client.get('/profile');

      return {
        isValid: true,
        email: response.data.emailAddress,
      };
    } catch (error) {
      return { isValid: false, error: String(error) };
    }
  }
}

export default GmailClient;
