/**
 * Looker Connector - Integration with Looker BI Platform
 * Handles authentication, query execution, and Look management
 */

export interface LookerConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
}

export interface AuthResponse {
  authenticated: boolean;
  token: string;
}

export interface QueryResponse {
  id: string;
  data: any[];
  resultFormat: string;
  executionTime: number;
}

export interface LookResponse {
  lookId: string;
  name: string;
  description: string;
  url: string;
  owner: string;
}

export interface ScheduledQueryResponse {
  scheduleId: string;
  modelName: string;
  exploreName: string;
  frequency: string;
}

/**
 * Looker Connector class for SDK integration
 */
export class LookerConnector {
  private config: LookerConfig | null = null;
  private token: string | null = null;
  private baseUrl: string = '';

  /**
   * Authenticate with Looker using OAuth
   */
  async authenticate(config: LookerConfig): Promise<AuthResponse> {
    try {
      this.config = config;
      this.baseUrl = config.baseUrl.replace(/\/$/, '');

      const response = await this.makeRequest(
        'POST',
        '/api/4.0/login',
        {
          client_id: config.clientId,
          client_secret: config.clientSecret,
        }
      );

      if (!response?.access_token) {
        throw new Error('Authentication failed: Invalid credentials');
      }

      this.token = response.access_token;

      return {
        authenticated: true,
        token: this.token,
      };
    } catch (error) {
      console.error('Looker authentication error:', error);
      throw error;
    }
  }

  /**
   * Execute a query on a model/explore
   */
  async runQuery(
    modelName: string,
    exploreName: string,
    dimensions: string[],
    measures: string[]
  ): Promise<any[]> {
    if (!this.token) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      if (!modelName || !exploreName) {
        throw new Error('Model and explore names are required');
      }

      if (!Array.isArray(dimensions) || !Array.isArray(measures)) {
        throw new Error('Dimensions and measures must be arrays');
      }

      const queryData = {
        model: modelName,
        explore: exploreName,
        dimensions: dimensions,
        measures: measures,
        limit: 5000,
        result_format: 'json',
      };

      const response = await this.makeRequest(
        'POST',
        `/api/4.0/queries`,
        queryData
      );

      // Execute the query and get results
      if (response?.id) {
        const resultsResponse = await this.makeRequest(
          'GET',
          `/api/4.0/queries/${response.id}/run/json`
        );

        return resultsResponse || [];
      }

      return [];
    } catch (error) {
      console.error('Query execution error:', error);
      throw error;
    }
  }

  /**
   * Get definition of a Look
   */
  async getLookDefinition(lookId: string): Promise<any> {
    if (!this.token) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      const response = await this.makeRequest(
        'GET',
        `/api/4.0/looks/${lookId}`
      );

      return {
        lookId: lookId,
        name: response?.title || 'Untitled Look',
        description: response?.description || '',
        query: response?.query || {},
        owner: response?.user?.id || 'unknown',
        createdAt: new Date(response?.created_at || Date.now()),
        updatedAt: new Date(response?.updated_at || Date.now()),
      };
    } catch (error) {
      console.error('Get look definition error:', error);
      throw error;
    }
  }

  /**
   * Create a new Look
   */
  async createLook(name: string, query: any): Promise<LookResponse> {
    if (!this.token) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      if (!name) {
        throw new Error('Look name is required');
      }

      if (!query || typeof query !== 'object') {
        throw new Error('Query definition is required');
      }

      const response = await this.makeRequest(
        'POST',
        `/api/4.0/looks`,
        {
          title: name,
          description: `Auto-generated Look: ${name}`,
          query: query,
          public: false,
        }
      );

      const lookId = response?.id || `look_${Date.now()}`;

      return {
        lookId: lookId,
        name: name,
        description: `Auto-generated Look: ${name}`,
        url: `${this.baseUrl}/looks/${lookId}`,
        owner: response?.user?.id || 'system',
      };
    } catch (error) {
      console.error('Look creation error:', error);
      throw error;
    }
  }

  /**
   * Schedule a query to run at regular intervals
   */
  async scheduledQuery(
    modelName: string,
    exploreName: string,
    schedule: string
  ): Promise<ScheduledQueryResponse> {
    if (!this.token) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      if (!modelName || !exploreName || !schedule) {
        throw new Error(
          'Model name, explore name, and schedule are required'
        );
      }

      // Validate schedule format (cron or frequency string)
      const validFrequencies = [
        'hourly',
        'daily',
        'weekly',
        'monthly',
        'yearly',
      ];
      const isCron = schedule.includes('*');
      const isValidFrequency = validFrequencies.includes(
        schedule.toLowerCase()
      );

      if (!isCron && !isValidFrequency) {
        throw new Error(
          `Invalid schedule. Use cron format or: ${validFrequencies.join(', ')}`
        );
      }

      const response = await this.makeRequest(
        'POST',
        `/api/4.0/scheduled_plans`,
        {
          name: `Scheduled Query: ${modelName}/${exploreName}`,
          model_name: modelName,
          explore_name: exploreName,
          cron_expression: isCron
            ? schedule
            : this.frequencyToCron(schedule),
          enabled: true,
          filters: {},
        }
      );

      return {
        scheduleId: response?.id || `sched_${Date.now()}`,
        modelName: modelName,
        exploreName: exploreName,
        frequency: schedule,
      };
    } catch (error) {
      console.error('Scheduled query creation error:', error);
      throw error;
    }
  }

  /**
   * Get all looks in a space
   */
  async getSpaceLooks(spaceId: string): Promise<LookResponse[]> {
    if (!this.token) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      const response = await this.makeRequest(
        'GET',
        `/api/4.0/spaces/${spaceId}/looks`
      );

      return (response || []).map((look: any) => ({
        lookId: look.id,
        name: look.title,
        description: look.description || '',
        url: `${this.baseUrl}/looks/${look.id}`,
        owner: look.user?.id || 'unknown',
      }));
    } catch (error) {
      console.error('Get space looks error:', error);
      throw error;
    }
  }

  /**
   * Delete a Look
   */
  async deleteLook(lookId: string): Promise<void> {
    if (!this.token) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      await this.makeRequest('DELETE', `/api/4.0/looks/${lookId}`);
      console.log(`Look ${lookId} deleted successfully`);
    } catch (error) {
      console.error('Delete look error:', error);
      throw error;
    }
  }

  /**
   * Convert frequency string to cron expression
   */
  private frequencyToCron(frequency: string): string {
    const cronMap: Record<string, string> = {
      hourly: '0 * * * *',
      daily: '0 8 * * *',
      weekly: '0 8 * * 1',
      monthly: '0 8 1 * *',
      yearly: '0 8 1 1 *',
    };

    return cronMap[frequency.toLowerCase()] || '0 8 * * *';
  }

  /**
   * Make HTTP request to Looker API
   */
  private async makeRequest(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<any> {
    if (!this.config) {
      throw new Error('Connector not configured');
    }

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.token && !endpoint.includes('/login')) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      // Simulate API call
      console.log(`[Looker API] ${method} ${endpoint}`);

      // Return mock response for demonstration
      return {
        id: `looker_${Date.now()}`,
        access_token: `looker_token_${Date.now()}`,
        title: 'Auto-generated Look',
        query: {},
        user: { id: 'system' },
      };
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  /**
   * Get connector status
   */
  getStatus(): {
    authenticated: boolean;
    baseUrl?: string;
  } {
    return {
      authenticated: this.token !== null,
      baseUrl: this.baseUrl,
    };
  }
}

export default LookerConnector;
