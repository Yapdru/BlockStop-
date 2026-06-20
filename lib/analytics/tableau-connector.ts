/**
 * Tableau Connector - Integration with Tableau Server/Online
 * Handles authentication, datasource publishing, workbook creation, and view management
 */

export interface TableauConfig {
  serverUrl: string;
  userName: string;
  password: string;
  siteId?: string;
}

export interface AuthResponse {
  authenticated: boolean;
  token: string;
}

export interface PublishResponse {
  publishId: string;
  name: string;
  timestamp: Date;
}

export interface WorkbookResponse {
  workbookId: string;
  name: string;
  owner: string;
}

export interface ViewMetadata {
  viewId: string;
  viewName: string;
  workbookId: string;
  size: number;
  lastUpdated: Date;
}

/**
 * Tableau Connector class for server-to-server API interactions
 */
export class TableauConnector {
  private config: TableauConfig | null = null;
  private token: string | null = null;
  private siteId: string = '';

  /**
   * Authenticate with Tableau Server
   */
  async authenticate(config: TableauConfig): Promise<AuthResponse> {
    try {
      this.config = config;
      this.siteId = config.siteId || 'default';

      // Simulate authentication API call
      const response = await this.makeRequest(
        'POST',
        '/api/3.19/auth/signin',
        {
          credentials: {
            name: config.userName,
            password: config.password,
            site: {
              contentUrl: this.siteId,
            },
          },
        }
      );

      if (response?.credentials?.token) {
        this.token = response.credentials.token;
        return {
          authenticated: true,
          token: this.token,
        };
      }

      throw new Error('Authentication failed: Invalid credentials');
    } catch (error) {
      console.error('Tableau authentication error:', error);
      throw error;
    }
  }

  /**
   * Publish a datasource to Tableau Server
   */
  async publishDatasource(
    datasourceName: string,
    data: any
  ): Promise<PublishResponse> {
    if (!this.token) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      const response = await this.makeRequest(
        'POST',
        `/api/3.19/sites/${this.siteId}/datasources`,
        {
          datasource: {
            name: datasourceName,
            content: Buffer.from(JSON.stringify(data)).toString('base64'),
            contentType: 'application/json',
          },
        }
      );

      return {
        publishId: response?.datasource?.id || `ds_${Date.now()}`,
        name: datasourceName,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Datasource publishing error:', error);
      throw error;
    }
  }

  /**
   * Create a new workbook
   */
  async createWorkbook(
    workbookName: string,
    datasources: string[]
  ): Promise<WorkbookResponse> {
    if (!this.token) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      const response = await this.makeRequest(
        'POST',
        `/api/3.19/sites/${this.siteId}/workbooks`,
        {
          workbook: {
            name: workbookName,
            description: `Auto-generated workbook for ${workbookName}`,
            datasources: datasources.map(ds => ({ id: ds })),
          },
        }
      );

      return {
        workbookId: response?.workbook?.id || `wb_${Date.now()}`,
        name: workbookName,
        owner: response?.workbook?.owner?.id || 'system',
      };
    } catch (error) {
      console.error('Workbook creation error:', error);
      throw error;
    }
  }

  /**
   * Refresh a datasource
   */
  async refreshDatasource(datasourceId: string): Promise<void> {
    if (!this.token) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      await this.makeRequest(
        'POST',
        `/api/3.19/sites/${this.siteId}/datasources/${datasourceId}/refresh`,
        {}
      );
    } catch (error) {
      console.error('Datasource refresh error:', error);
      throw error;
    }
  }

  /**
   * Get metadata for all views in a workbook
   */
  async getViewMetadata(workbookId: string): Promise<ViewMetadata[]> {
    if (!this.token) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      const response = await this.makeRequest(
        'GET',
        `/api/3.19/sites/${this.siteId}/workbooks/${workbookId}/views`
      );

      return (response?.views || []).map((view: any) => ({
        viewId: view.id,
        viewName: view.name,
        workbookId: workbookId,
        size: view.contentSize || 0,
        lastUpdated: new Date(view.updatedAt || Date.now()),
      }));
    } catch (error) {
      console.error('View metadata retrieval error:', error);
      throw error;
    }
  }

  /**
   * Export a view as an image
   */
  async exportViewAsImage(
    viewId: string,
    format: string = 'png'
  ): Promise<Buffer> {
    if (!this.token) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      const validFormats = ['png', 'pdf', 'jpeg'];
      if (!validFormats.includes(format)) {
        throw new Error(`Unsupported format: ${format}`);
      }

      // In a real implementation, this would stream the image data
      const response = await this.makeRequest(
        'GET',
        `/api/3.19/sites/${this.siteId}/views/${viewId}/image?resolution=high&maxAge=1`,
        null,
        { responseType: 'arraybuffer' }
      );

      return Buffer.from(response);
    } catch (error) {
      console.error('View export error:', error);
      throw error;
    }
  }

  /**
   * Make HTTP request to Tableau API
   */
  private async makeRequest(
    method: string,
    endpoint: string,
    body?: any,
    options?: any
  ): Promise<any> {
    if (!this.config) {
      throw new Error('Connector not configured');
    }

    try {
      const url = `${this.config.serverUrl}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.token) {
        headers['X-Tableau-Auth'] = this.token;
      }

      const fetchOptions: any = {
        method,
        headers,
      };

      if (body) {
        fetchOptions.body = JSON.stringify(body);
      }

      // Simulate API call - in production, use actual fetch or axios
      console.log(`[Tableau API] ${method} ${endpoint}`);

      // Return mock response for demonstration
      return {
        credentials: { token: `tableau_token_${Date.now()}` },
        datasource: { id: `ds_${Date.now()}` },
        workbook: { id: `wb_${Date.now()}`, owner: { id: 'admin' } },
        views: [],
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
    serverUrl?: string;
    siteId?: string;
  } {
    return {
      authenticated: this.token !== null,
      serverUrl: this.config?.serverUrl,
      siteId: this.siteId,
    };
  }
}

export default TableauConnector;
