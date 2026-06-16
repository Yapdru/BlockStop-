/**
 * Microsoft Teams SDK Wrapper
 * Handles Teams bot interactions and adaptive cards
 */

import axios, { AxiosInstance } from 'axios';

interface TeamsMessage {
  type: string;
  from?: { id: string; name: string };
  conversation: { id: string };
  recipient?: { id: string; name: string };
  text?: string;
  attachments?: any[];
  replyToId?: string;
  locale?: string;
}

interface AdaptiveCard {
  type: string;
  version: string;
  body: any[];
  actions?: any[];
}

export class TeamsClient {
  private client: AxiosInstance;
  private botId: string;
  private botPassword: string;
  private serviceUrl: string;

  constructor(
    botId: string,
    botPassword: string,
    serviceUrl: string = 'https://smba.botframework.com'
  ) {
    this.botId = botId;
    this.botPassword = botPassword;
    this.serviceUrl = serviceUrl;

    this.client = axios.create({
      baseURL: serviceUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[TeamsClient] Error:', {
          status: error.response?.status,
          data: error.response?.data,
        });
        throw error;
      }
    );
  }

  /**
   * Send a message to a Teams conversation
   */
  async sendMessage(
    serviceUrl: string,
    conversationId: string,
    message: TeamsMessage
  ): Promise<{ id: string }> {
    try {
      const token = await this.getAuthToken();

      const response = await axios.post(
        `${serviceUrl}/v3/conversations/${conversationId}/activities`,
        message,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return { id: response.data.id };
    } catch (error) {
      throw new Error(`Failed to send Teams message: ${error}`);
    }
  }

  /**
   * Send an adaptive card
   */
  async sendAdaptiveCard(
    serviceUrl: string,
    conversationId: string,
    card: AdaptiveCard,
    text?: string
  ): Promise<{ id: string }> {
    try {
      const token = await this.getAuthToken();

      const message: TeamsMessage = {
        type: 'message',
        conversation: { id: conversationId },
        from: { id: this.botId, name: 'BlockStop Bot' },
        text: text || 'BlockStop Security Alert',
        attachments: [
          {
            contentType: 'application/vnd.microsoft.card.adaptive',
            contentUrl: null,
            content: card,
          },
        ],
      };

      const response = await axios.post(
        `${serviceUrl}/v3/conversations/${conversationId}/activities`,
        message,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return { id: response.data.id };
    } catch (error) {
      throw new Error(`Failed to send Teams adaptive card: ${error}`);
    }
  }

  /**
   * Update a message
   */
  async updateMessage(
    serviceUrl: string,
    conversationId: string,
    activityId: string,
    message: TeamsMessage
  ): Promise<boolean> {
    try {
      const token = await this.getAuthToken();

      await axios.put(
        `${serviceUrl}/v3/conversations/${conversationId}/activities/${activityId}`,
        message,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return true;
    } catch (error) {
      throw new Error(`Failed to update Teams message: ${error}`);
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(
    serviceUrl: string,
    conversationId: string,
    activityId: string
  ): Promise<boolean> {
    try {
      const token = await this.getAuthToken();

      await axios.delete(
        `${serviceUrl}/v3/conversations/${conversationId}/activities/${activityId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return true;
    } catch (error) {
      throw new Error(`Failed to delete Teams message: ${error}`);
    }
  }

  /**
   * Create a Teams thread reply
   */
  async sendThreadReply(
    serviceUrl: string,
    conversationId: string,
    replyToId: string,
    message: string
  ): Promise<{ id: string }> {
    try {
      const token = await this.getAuthToken();

      const activity: TeamsMessage = {
        type: 'message',
        conversation: { id: conversationId },
        from: { id: this.botId, name: 'BlockStop Bot' },
        text: message,
        replyToId,
      };

      const response = await axios.post(
        `${serviceUrl}/v3/conversations/${conversationId}/activities`,
        activity,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return { id: response.data.id };
    } catch (error) {
      throw new Error(`Failed to send Teams thread reply: ${error}`);
    }
  }

  /**
   * Get auth token for Teams communication
   */
  private async getAuthToken(): Promise<string> {
    try {
      const response = await axios.post(
        'https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token',
        {
          grant_type: 'client_credentials',
          client_id: this.botId,
          client_secret: this.botPassword,
          scope: 'https://api.botframework.com/.default',
        },
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );

      return response.data.access_token;
    } catch (error) {
      throw new Error(`Failed to get Teams auth token: ${error}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ isValid: boolean; error?: string }> {
    try {
      await this.getAuthToken();
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: String(error) };
    }
  }
}

export default TeamsClient;
