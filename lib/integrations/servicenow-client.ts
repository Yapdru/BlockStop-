/**
 * ServiceNow API Client
 * Handles ticket creation and management in ServiceNow
 */

import axios, { AxiosInstance } from 'axios';

interface ServiceNowTicket {
  short_description: string;
  description?: string;
  urgency?: string;
  impact?: string;
  priority?: string;
  assignment_group?: string;
  assigned_to?: string;
  category?: string;
  subcategory?: string;
  work_notes?: string;
  state?: string;
  custom_fields?: Record<string, any>;
}

interface ServiceNowTicketResponse {
  sys_id: string;
  number: string;
  state: string;
  created: string;
  updated: string;
}

export class ServiceNowClient {
  private client: AxiosInstance;
  private instanceUrl: string;

  constructor(
    instanceUrl: string,
    username: string,
    password: string,
    options: { verifySsl?: boolean } = {}
  ) {
    this.instanceUrl = instanceUrl.replace(/\/$/, '');

    const auth = Buffer.from(`${username}:${password}`).toString('base64');

    this.client = axios.create({
      baseURL: `${this.instanceUrl}/api/now`,
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      httpsAgent: !options.verifySsl ? { rejectUnauthorized: false } : undefined,
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[ServiceNowClient] Error:', {
          status: error.response?.status,
          data: error.response?.data,
        });
        throw error;
      }
    );
  }

  /**
   * Create an incident ticket
   */
  async createIncident(ticket: ServiceNowTicket): Promise<ServiceNowTicketResponse> {
    try {
      const response = await this.client.post('/table/incident', {
        short_description: ticket.short_description,
        description: ticket.description,
        urgency: ticket.urgency || '3',
        impact: ticket.impact || '3',
        priority: ticket.priority || '5',
        assignment_group: ticket.assignment_group,
        assigned_to: ticket.assigned_to,
        category: ticket.category,
        subcategory: ticket.subcategory,
        u_blockstop_scan: ticket.custom_fields?.['blockstop_scan'],
        u_blockstop_severity: ticket.custom_fields?.['blockstop_severity'],
      });

      const result = response.data.result;
      return {
        sys_id: result.sys_id,
        number: result.number,
        state: result.state,
        created: result.sys_created_on,
        updated: result.sys_updated_on,
      };
    } catch (error) {
      throw new Error(`Failed to create ServiceNow incident: ${error}`);
    }
  }

  /**
   * Update an incident ticket
   */
  async updateIncident(
    ticketId: string,
    updates: Partial<ServiceNowTicket>
  ): Promise<ServiceNowTicketResponse> {
    try {
      const response = await this.client.patch(`/table/incident/${ticketId}`, {
        short_description: updates.short_description,
        description: updates.description,
        urgency: updates.urgency,
        impact: updates.impact,
        priority: updates.priority,
        assignment_group: updates.assignment_group,
        assigned_to: updates.assigned_to,
        category: updates.category,
        subcategory: updates.subcategory,
        state: updates.state,
        work_notes: updates.work_notes,
      });

      const result = response.data.result;
      return {
        sys_id: result.sys_id,
        number: result.number,
        state: result.state,
        created: result.sys_created_on,
        updated: result.sys_updated_on,
      };
    } catch (error) {
      throw new Error(`Failed to update ServiceNow incident: ${error}`);
    }
  }

  /**
   * Add work notes to a ticket
   */
  async addWorkNote(ticketId: string, note: string): Promise<boolean> {
    try {
      await this.client.post(`/table/incident/${ticketId}`, {
        work_notes: note,
      });
      return true;
    } catch (error) {
      throw new Error(`Failed to add work note: ${error}`);
    }
  }

  /**
   * Get ticket details
   */
  async getTicket(ticketId: string): Promise<any> {
    try {
      const response = await this.client.get(`/table/incident/${ticketId}`, {
        params: { sysparm_display_value: true },
      });

      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to get ServiceNow ticket: ${error}`);
    }
  }

  /**
   * Query tickets
   */
  async queryTickets(query: Record<string, any>, limit: number = 10): Promise<any[]> {
    try {
      const params: Record<string, any> = {
        sysparm_query: Object.entries(query)
          .map(([key, value]) => `${key}=${value}`)
          .join('^'),
        sysparm_limit: limit,
        sysparm_display_value: true,
      };

      const response = await this.client.get('/table/incident', { params });
      return response.data.result;
    } catch (error) {
      throw new Error(`Failed to query ServiceNow tickets: ${error}`);
    }
  }

  /**
   * Create a change request
   */
  async createChangeRequest(data: {
    short_description: string;
    description?: string;
    type?: string;
    impact?: string;
    risk?: string;
  }): Promise<ServiceNowTicketResponse> {
    try {
      const response = await this.client.post('/table/change_request', {
        short_description: data.short_description,
        description: data.description,
        type: data.type || 'standard',
        impact: data.impact || '3',
        risk: data.risk || '3',
      });

      const result = response.data.result;
      return {
        sys_id: result.sys_id,
        number: result.number,
        state: result.state,
        created: result.sys_created_on,
        updated: result.sys_updated_on,
      };
    } catch (error) {
      throw new Error(`Failed to create ServiceNow change request: ${error}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ isValid: boolean; error?: string }> {
    try {
      const response = await this.client.get('/table/sys_user', {
        params: { sysparm_limit: 1 },
      });

      if (response.status === 200) {
        return { isValid: true };
      }

      return { isValid: false, error: 'Unexpected response' };
    } catch (error) {
      return { isValid: false, error: String(error) };
    }
  }
}

export default ServiceNowClient;
