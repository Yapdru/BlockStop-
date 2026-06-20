/**
 * Power BI Connector - Integration with Microsoft Power BI
 * Handles authentication, dataset creation, data pushing, and report generation
 */

export interface PowerBIConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  workspaceId: string;
}

export interface AuthResponse {
  authenticated: boolean;
  token: string;
  expiresIn: number;
}

export interface DatasetResponse {
  datasetId: string;
  name: string;
  createdAt: Date;
  tables: string[];
}

export interface PushDataResponse {
  rowsAdded: number;
  timestamp: Date;
}

export interface ReportResponse {
  reportId: string;
  name: string;
  webUrl: string;
  embedUrl: string;
}

/**
 * Power BI Connector class for REST API interactions
 */
export class PowerBIConnector {
  private config: PowerBIConfig | null = null;
  private token: string | null = null;
  private tokenExpiresAt: number = 0;

  /**
   * Authenticate with Power BI using OAuth 2.0
   */
  async authenticate(config: PowerBIConfig): Promise<AuthResponse> {
    try {
      this.config = config;

      // Simulate token request
      const tokenResponse = await this.requestAccessToken(config);

      if (!tokenResponse.access_token) {
        throw new Error('Failed to obtain access token');
      }

      this.token = tokenResponse.access_token;
      this.tokenExpiresAt = Date.now() + tokenResponse.expires_in * 1000;

      return {
        authenticated: true,
        token: this.token,
        expiresIn: tokenResponse.expires_in,
      };
    } catch (error) {
      console.error('Power BI authentication error:', error);
      throw error;
    }
  }

  /**
   * Create a new dataset in Power BI workspace
   */
  async createDataset(
    datasetName: string,
    schema: any
  ): Promise<DatasetResponse> {
    if (!this.token) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      const tables = this.parseSchema(schema);

      const response = await this.makeRequest(
        'POST',
        `/v1.0/myorg/groups/${this.config!.workspaceId}/datasets`,
        {
          name: datasetName,
          tables: tables,
          defaultMode: 'Push',
        }
      );

      return {
        datasetId: response?.id || `ds_${Date.now()}`,
        name: datasetName,
        createdAt: new Date(),
        tables: tables.map((t: any) => t.name),
      };
    } catch (error) {
      console.error('Dataset creation error:', error);
      throw error;
    }
  }

  /**
   * Push data rows to a Power BI dataset table
   */
  async pushData(
    datasetId: string,
    tableName: string,
    data: any[]
  ): Promise<PushDataResponse> {
    if (!this.token) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Data must be a non-empty array');
      }

      // Validate data structure
      const validatedData = data.map(row => {
        if (typeof row !== 'object' || row === null) {
          throw new Error('Each row must be an object');
        }
        return row;
      });

      const response = await this.makeRequest(
        'POST',
        `/v1.0/myorg/groups/${this.config!.workspaceId}/datasets/${datasetId}/tables/${tableName}/rows`,
        {
          rows: validatedData,
        }
      );

      return {
        rowsAdded: validatedData.length,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Data push error:', error);
      throw error;
    }
  }

  /**
   * Create a report based on a dataset
   */
  async createReport(
    reportName: string,
    datasetId: string
  ): Promise<ReportResponse> {
    if (!this.token) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      const response = await this.makeRequest(
        'POST',
        `/v1.0/myorg/groups/${this.config!.workspaceId}/reports`,
        {
          name: reportName,
          datasetId: datasetId,
          description: `Auto-generated report from dataset ${datasetId}`,
        }
      );

      const reportId = response?.id || `rpt_${Date.now()}`;

      return {
        reportId: reportId,
        name: reportName,
        webUrl: `https://app.powerbi.com/groups/${this.config!.workspaceId}/reports/${reportId}`,
        embedUrl: `https://app.powerbi.com/reportEmbed?reportId=${reportId}`,
      };
    } catch (error) {
      console.error('Report creation error:', error);
      throw error;
    }
  }

  /**
   * Refresh a dataset to update from source
   */
  async refreshDataset(datasetId: string): Promise<void> {
    if (!this.token) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      await this.makeRequest(
        'POST',
        `/v1.0/myorg/groups/${this.config!.workspaceId}/datasets/${datasetId}/refreshes`,
        {
          notifyOption: 'MailOnCompletion',
        }
      );

      console.log(`Dataset ${datasetId} refresh initiated`);
    } catch (error) {
      console.error('Dataset refresh error:', error);
      throw error;
    }
  }

  /**
   * Get dataset refresh schedule
   */
  async getRefreshSchedule(datasetId: string): Promise<any> {
    if (!this.token) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      const response = await this.makeRequest(
        'GET',
        `/v1.0/myorg/groups/${this.config!.workspaceId}/datasets/${datasetId}/refreshSchedule`
      );

      return response || { frequency: 'Daily', times: ['08:00'] };
    } catch (error) {
      console.error('Get refresh schedule error:', error);
      throw error;
    }
  }

  /**
   * Clear all data from a table
   */
  async clearTableData(
    datasetId: string,
    tableName: string
  ): Promise<void> {
    if (!this.token) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    try {
      await this.makeRequest(
        'DELETE',
        `/v1.0/myorg/groups/${this.config!.workspaceId}/datasets/${datasetId}/tables/${tableName}/rows`
      );
    } catch (error) {
      console.error('Clear table data error:', error);
      throw error;
    }
  }

  /**
   * Request access token from Azure AD
   */
  private async requestAccessToken(config: PowerBIConfig): Promise<any> {
    try {
      console.log(`[Power BI] Requesting access token for tenant ${config.tenantId}`);

      // In production, use actual Azure AD token endpoint
      return {
        access_token: `pbi_token_${Date.now()}`,
        expires_in: 3600,
        token_type: 'Bearer',
      };
    } catch (error) {
      console.error('Token request error:', error);
      throw error;
    }
  }

  /**
   * Parse schema definition into Power BI table format
   */
  private parseSchema(schema: any): any[] {
    if (!schema || typeof schema !== 'object') {
      throw new Error('Invalid schema format');
    }

    const tables: any[] = [];

    if (Array.isArray(schema)) {
      return schema;
    }

    if (schema.tables && Array.isArray(schema.tables)) {
      return schema.tables;
    }

    // Convert object keys to table definition
    const columns = Object.entries(schema).map(([key, value]: [string, any]) => ({
      name: key,
      dataType: this.mapDataType(value),
    }));

    tables.push({
      name: 'ImportedData',
      columns: columns,
    });

    return tables;
  }

  /**
   * Map JavaScript types to Power BI data types
   */
  private mapDataType(value: any): string {
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'Int64' : 'Double';
    }
    if (typeof value === 'boolean') {
      return 'Boolean';
    }
    if (value instanceof Date) {
      return 'DateTime';
    }
    return 'String';
  }

  /**
   * Make HTTP request to Power BI API
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
      const url = `https://api.powerbi.com${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      };

      // Simulate API call
      console.log(`[Power BI API] ${method} ${endpoint}`);

      // Return mock response for demonstration
      return {
        id: `pbi_${Date.now()}`,
        name: 'Auto-generated',
      };
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  /**
   * Check if token needs refresh
   */
  private isTokenExpired(): boolean {
    return Date.now() >= this.tokenExpiresAt;
  }

  /**
   * Get connector status
   */
  getStatus(): {
    authenticated: boolean;
    workspaceId?: string;
    tokenValid: boolean;
  } {
    return {
      authenticated: this.token !== null,
      workspaceId: this.config?.workspaceId,
      tokenValid: !this.isTokenExpired(),
    };
  }
}

export default PowerBIConnector;
