/**
 * Slack SDK Wrapper
 * Handles Slack bot interactions, messages, and actions
 */

import axios, { AxiosInstance } from 'axios';

interface SlackMessage {
  channel: string;
  text?: string;
  blocks?: any[];
  thread_ts?: string;
  reply_broadcast?: boolean;
}

interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  email?: string;
}

interface SlackFile {
  id: string;
  name: string;
  size: number;
  mimetype: string;
  url_private?: string;
  timestamp: number;
}

export class SlackClient {
  private client: AxiosInstance;
  private botToken: string;

  constructor(botToken: string) {
    this.botToken = botToken;

    this.client = axios.create({
      baseURL: 'https://slack.com/api',
      headers: {
        Authorization: `Bearer ${botToken}`,
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[SlackClient] Error:', {
          status: error.response?.status,
          data: error.response?.data,
        });
        throw error;
      }
    );
  }

  /**
   * Send a message to a channel
   */
  async sendMessage(message: SlackMessage): Promise<{ ts: string; channel: string }> {
    try {
      const response = await this.client.post('/chat.postMessage', message);

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to send message');
      }

      return {
        ts: response.data.ts,
        channel: response.data.channel,
      };
    } catch (error) {
      throw new Error(`Failed to send Slack message: ${error}`);
    }
  }

  /**
   * Update a message
   */
  async updateMessage(
    channel: string,
    ts: string,
    message: Partial<SlackMessage>
  ): Promise<{ ts: string }> {
    try {
      const response = await this.client.post('/chat.update', {
        channel,
        ts,
        ...message,
      });

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to update message');
      }

      return { ts: response.data.ts };
    } catch (error) {
      throw new Error(`Failed to update Slack message: ${error}`);
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(channel: string, ts: string): Promise<boolean> {
    try {
      const response = await this.client.post('/chat.delete', {
        channel,
        ts,
      });

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to delete message');
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to delete Slack message: ${error}`);
    }
  }

  /**
   * Add emoji reaction to a message
   */
  async addReaction(channel: string, ts: string, emoji: string): Promise<boolean> {
    try {
      const response = await this.client.post('/reactions.add', {
        channel,
        timestamp: ts,
        name: emoji,
      });

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to add reaction');
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to add Slack reaction: ${error}`);
    }
  }

  /**
   * Get user information
   */
  async getUser(userId: string): Promise<SlackUser> {
    try {
      const response = await this.client.get('/users.info', {
        params: { user: userId },
      });

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to get user info');
      }

      const user = response.data.user;
      return {
        id: user.id,
        name: user.name,
        real_name: user.real_name,
        email: user.profile?.email,
      };
    } catch (error) {
      throw new Error(`Failed to get Slack user: ${error}`);
    }
  }

  /**
   * Open a DM with a user
   */
  async openDM(userId: string): Promise<string> {
    try {
      const response = await this.client.post('/conversations.open', {
        users: userId,
      });

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to open DM');
      }

      return response.data.channel.id;
    } catch (error) {
      throw new Error(`Failed to open Slack DM: ${error}`);
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(fileId: string): Promise<SlackFile> {
    try {
      const response = await this.client.get('/files.info', {
        params: { file: fileId },
      });

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to get file info');
      }

      const file = response.data.file;
      return {
        id: file.id,
        name: file.name,
        size: file.size,
        mimetype: file.mimetype,
        url_private: file.url_private,
        timestamp: file.timestamp,
      };
    } catch (error) {
      throw new Error(`Failed to get Slack file info: ${error}`);
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const response = await this.client.post('/files.delete', {
        file: fileId,
      });

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to delete file');
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to delete Slack file: ${error}`);
    }
  }

  /**
   * List all channels
   */
  async listChannels(): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await this.client.get('/conversations.list', {
        params: { types: 'public_channel,private_channel' },
      });

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to list channels');
      }

      return response.data.channels.map((ch: any) => ({
        id: ch.id,
        name: ch.name,
      }));
    } catch (error) {
      throw new Error(`Failed to list Slack channels: ${error}`);
    }
  }

  /**
   * Health check - verify bot token
   */
  async healthCheck(): Promise<{ isValid: boolean; botId?: string; error?: string }> {
    try {
      const response = await this.client.get('/auth.test');

      if (!response.data.ok) {
        return { isValid: false, error: response.data.error };
      }

      return {
        isValid: true,
        botId: response.data.user_id,
      };
    } catch (error) {
      return { isValid: false, error: String(error) };
    }
  }
}

export default SlackClient;
