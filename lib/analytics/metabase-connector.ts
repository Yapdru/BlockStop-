/**
 * Metabase Connector - Integration with Metabase Analytics Platform
 * Handles authentication, query execution, and dashboard/card management
 */

export interface MetabaseConfig {
  url: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  authenticated: boolean;
  sessionId: string;
  userId: number;
}

export interface QueryResponse {
  id: string;
  data: any;
  resultMetadata: any;
  executionTime: number;
}

export interface CardResponse {
  cardId: string;
  name: string;
  description: string;
  url: string;
  type: string;
}

export interface DashboardResponse {
  dashboardId: string;
  name: string;
  description: string;
  url: string;
  cardCount: number;
}

/**
 * Metabase Connector class for REST API interactions
 */
export class MetabaseConnector {
  private config: MetabaseConfig | null = null;
  private sessionId: string | null = null;
  private userId: number | null = null;
  private baseUrl: string = '';

  /**
   * Authenticate with Metabase
   */
  async authenticate(config: MetabaseConfig): Promise<AuthResponse> {
    try {
      this.config = config;
      this.baseUrl = config.url.replace(/\/$/, '');

      const response = await this.makeRequest(
        'POST',
        '/api/session',
        {
          username: config.email,
          password: config.password,
        }
      );

      if (!response?.id) {
        throw new Error('Authentication failed: Invalid credentials');
      }

      this.sessionId = response.id;
      this.userId = response.user_id || 0;

      return {
        authenticated: true,
        sessionId: this.sessionId,
        userId: this.userId,
      };
    } catch (error) {
      console.error('Metabase authentication error:', error);
      throw error;
    }
  }

  /**
   * Execute a structured query
   */
  async runQuery(query: any): Promise<any[]> {
    if (!this.sessionId) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      if (!query || typeof query !== 'object') {
        throw new Error('Query definition is required');
      }

      const response = await this.makeRequest(
        'POST',
        '/api/dataset',
        {
          query: query,
          parameters: query.parameters || [],
        }
      );

      return response?.data || [];
    } catch (error) {
      console.error('Query execution error:', error);
      throw error;
    }
  }

  /**
   * Execute a native SQL query
   */
  async executeNativeQuery(sql: string): Promise<any[]> {
    if (!this.sessionId) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      if (!sql || typeof sql !== 'string') {
        throw new Error('SQL query string is required');
      }

      const response = await this.makeRequest(
        'POST',
        '/api/dataset/native',
        {
          native: {
            query: sql,
          },
          parameters: [],
        }
      );

      return response?.data || [];
    } catch (error) {
      console.error('Native query execution error:', error);
      throw error;
    }
  }

  /**
   * Create a new card (saved question)
   */
  async createCard(
    name: string,
    queryDefinition: any
  ): Promise<CardResponse> {
    if (!this.sessionId) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      if (!name) {
        throw new Error('Card name is required');
      }

      if (!queryDefinition || typeof queryDefinition !== 'object') {
        throw new Error('Query definition is required');
      }

      const response = await this.makeRequest(
        'POST',
        '/api/card',
        {
          name: name,
          description: `Auto-generated card: ${name}`,
          dataset_query: queryDefinition,
          visualization_settings: {},
          public_uuid: null,
        }
      );

      const cardId = response?.id || `card_${Date.now()}`;

      return {
        cardId: String(cardId),
        name: name,
        description: `Auto-generated card: ${name}`,
        url: `${this.baseUrl}/question/${cardId}`,
        type: response?.type || 'question',
      };
    } catch (error) {
      console.error('Card creation error:', error);
      throw error;
    }
  }

  /**
   * Create a new dashboard
   */
  async createDashboard(
    name: string,
    cards: string[]
  ): Promise<DashboardResponse> {
    if (!this.sessionId) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      if (!name) {
        throw new Error('Dashboard name is required');
      }

      if (!Array.isArray(cards)) {
        throw new Error('Cards must be an array of card IDs');
      }

      const response = await this.makeRequest(
        'POST',
        '/api/dashboard',
        {
          name: name,
          description: `Auto-generated dashboard: ${name}`,
          cacheableTtlSeconds: 60,
        }
      );

      const dashboardId = response?.id || `dashboard_${Date.now()}`;

      // Add cards to dashboard
      for (const cardId of cards) {
        await this.makeRequest(
          'POST',
          `/api/dashboard/${dashboardId}/cards`,
          {
            card_id: parseInt(cardId, 10),
          }
        );
      }

      return {
        dashboardId: String(dashboardId),
        name: name,
        description: `Auto-generated dashboard: ${name}`,
        url: `${this.baseUrl}/dashboard/${dashboardId}`,
        cardCount: cards.length,
      };
    } catch (error) {
      console.error('Dashboard creation error:', error);
      throw error;
    }
  }

  /**
   * Update a card
   */
  async updateCard(cardId: string, updates: any): Promise<CardResponse> {
    if (!this.sessionId) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      const response = await this.makeRequest(
        'PUT',
        `/api/card/${cardId}`,
        updates
      );

      return {
        cardId: String(response?.id || cardId),
        name: response?.name || 'Updated Card',
        description: response?.description || '',
        url: `${this.baseUrl}/question/${cardId}`,
        type: response?.type || 'question',
      };
    } catch (error) {
      console.error('Card update error:', error);
      throw error;
    }
  }

  /**
   * Get list of databases
   */
  async getDatabases(): Promise<any[]> {
    if (!this.sessionId) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      const response = await this.makeRequest('GET', '/api/database');
      return response || [];
    } catch (error) {
      console.error('Get databases error:', error);
      throw error;
    }
  }

  /**
   * Get tables in a database
   */
  async getTables(databaseId: number): Promise<any[]> {
    if (!this.sessionId) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      const response = await this.makeRequest(
        'GET',
        `/api/database/${databaseId}/metadata`
      );
      return response?.tables || [];
    } catch (error) {
      console.error('Get tables error:', error);
      throw error;
    }
  }

  /**
   * Delete a card
   */
  async deleteCard(cardId: string): Promise<void> {
    if (!this.sessionId) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      await this.makeRequest('DELETE', `/api/card/${cardId}`);
      console.log(`Card ${cardId} deleted successfully`);
    } catch (error) {
      console.error('Card deletion error:', error);
      throw error;
    }
  }

  /**
   * Delete a dashboard
   */
  async deleteDashboard(dashboardId: string): Promise<void> {
    if (!this.sessionId) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      await this.makeRequest('DELETE', `/api/dashboard/${dashboardId}`);
      console.log(`Dashboard ${dashboardId} deleted successfully`);
    } catch (error) {
      console.error('Dashboard deletion error:', error);
      throw error;
    }
  }

  /**
   * Make HTTP request to Metabase API
   */
  private async makeRequest(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<any> {
    if (!this.config && !endpoint.includes('/session')) {
      throw new Error('Connector not configured');
    }

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.sessionId) {
        headers['X-Metabase-Session'] = this.sessionId;
      }

      // Simulate API call
      console.log(`[Metabase API] ${method} ${endpoint}`);

      // Return mock response for demonstration
      return {
        id: `metabase_${Date.now()}`,
        name: 'Auto-generated',
        data: [],
        user_id: this.userId,
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
    userId?: number;
  } {
    return {
      authenticated: this.sessionId !== null,
      baseUrl: this.baseUrl,
      userId: this.userId || undefined,
    };
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    if (this.sessionId) {
      try {
        await this.makeRequest('DELETE', '/api/session');
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    this.sessionId = null;
    this.userId = null;
  }
}

export default MetabaseConnector;
