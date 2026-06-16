/**
 * Microsoft Exchange API Client
 * Handles EWS and Graph API interactions
 */

import axios, { AxiosInstance } from 'axios';

interface ExchangeMessage {
  id: string;
  parentFolderId: string;
  subject: string;
  from: { emailAddress: { address: string; name: string } };
  receivedDateTime: string;
  hasAttachments: boolean;
  size: number;
}

interface ExchangeFolder {
  id: string;
  displayName: string;
  parentFolderId: string;
  totalCount: number;
  unreadCount: number;
}

export class ExchangeClient {
  private client: AxiosInstance;
  private accessToken: string;
  private tenantId: string;

  constructor(accessToken: string, tenantId: string = 'common') {
    this.accessToken = accessToken;
    this.tenantId = tenantId;

    this.client = axios.create({
      baseURL: 'https://graph.microsoft.com/v1.0/me/mailfolders',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[ExchangeClient] Error:', {
          status: error.response?.status,
          data: error.response?.data,
        });
        throw error;
      }
    );
  }

  /**
   * Get inbox messages
   */
  async getInboxMessages(limit: number = 10): Promise<ExchangeMessage[]> {
    try {
      const response = await this.client.get('/Inbox/messages', {
        params: {
          $top: limit,
          $orderby: 'receivedDateTime desc',
        },
      });

      return response.data.value || [];
    } catch (error) {
      throw new Error(`Failed to get Exchange inbox messages: ${error}`);
    }
  }

  /**
   * Get message by ID
   */
  async getMessage(folderId: string, messageId: string): Promise<ExchangeMessage> {
    try {
      const response = await this.client.get(`/${folderId}/messages/${messageId}`);

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get Exchange message: ${error}`);
    }
  }

  /**
   * Move message to folder
   */
  async moveMessage(messageId: string, destinationFolderId: string): Promise<boolean> {
    try {
      await axios.post(
        `https://graph.microsoft.com/v1.0/me/messages/${messageId}/move`,
        {
          destinationId: destinationFolderId,
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return true;
    } catch (error) {
      throw new Error(`Failed to move Exchange message: ${error}`);
    }
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      await axios.delete(
        `https://graph.microsoft.com/v1.0/me/messages/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      return true;
    } catch (error) {
      throw new Error(`Failed to delete Exchange message: ${error}`);
    }
  }

  /**
   * Get attachments from a message
   */
  async getAttachments(messageId: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `https://graph.microsoft.com/v1.0/me/messages/${messageId}/attachments`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      return response.data.value || [];
    } catch (error) {
      throw new Error(`Failed to get Exchange attachments: ${error}`);
    }
  }

  /**
   * Create a folder rule
   */
  async createRule(
    displayName: string,
    conditions: Record<string, any>,
    actions: Record<string, any>
  ): Promise<{ id: string }> {
    try {
      const response = await axios.post(
        'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messageRules',
        {
          displayName,
          sequence: 1,
          isEnabled: true,
          conditions,
          actions,
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return { id: response.data.id };
    } catch (error) {
      throw new Error(`Failed to create Exchange rule: ${error}`);
    }
  }

  /**
   * Send email
   */
  async sendEmail(
    to: string[],
    subject: string,
    body: string,
    cc?: string[]
  ): Promise<{ messageId: string }> {
    try {
      const response = await axios.post(
        'https://graph.microsoft.com/v1.0/me/sendMail',
        {
          message: {
            subject,
            body: {
              contentType: 'HTML',
              content: body,
            },
            toRecipients: to.map((email) => ({
              emailAddress: { address: email },
            })),
            ccRecipients: cc
              ? cc.map((email) => ({
                  emailAddress: { address: email },
                }))
              : [],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return { messageId: response.data.id || 'sent' };
    } catch (error) {
      throw new Error(`Failed to send Exchange email: ${error}`);
    }
  }

  /**
   * Get mailbox folders
   */
  async getFolders(): Promise<ExchangeFolder[]> {
    try {
      const response = await this.client.get('', {
        params: { $top: 100 },
      });

      return response.data.value || [];
    } catch (error) {
      throw new Error(`Failed to get Exchange folders: ${error}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ isValid: boolean; email?: string; error?: string }> {
    try {
      const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      return {
        isValid: true,
        email: response.data.userPrincipalName,
      };
    } catch (error) {
      return { isValid: false, error: String(error) };
    }
  }
}

export default ExchangeClient;
