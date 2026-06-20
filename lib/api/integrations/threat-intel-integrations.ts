// Threat Intelligence Integration Implementations
import { IntegrationConfig } from '../types';

export class VirusTotalIntegration {
  private apiKey: string;

  constructor(config: IntegrationConfig) {
    this.apiKey = config.parameters?.apiKey || config.apiKey!;
  }

  async enrichFile(fileHash: string): Promise<any> {
    try {
      const response = await fetch(
        `https://www.virustotal.com/api/v3/files/${fileHash}`,
        {
          headers: {
            'x-apikey': this.apiKey,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          detections: data.data.attributes.last_analysis_stats,
          malware: data.data.attributes.last_analysis_results,
          tags: data.data.attributes.tags,
          lastAnalysisDate: data.data.attributes.last_analysis_date,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  async enrichURL(url: string): Promise<any> {
    try {
      const urlId = Buffer.from(url)
        .toString('base64')
        .replace(/=/g, '');

      const response = await fetch(
        `https://www.virustotal.com/api/v3/urls/${urlId}`,
        {
          headers: {
            'x-apikey': this.apiKey,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          detections: data.data.attributes.last_analysis_stats,
          malware: data.data.attributes.last_analysis_results,
          lastAnalysisDate: data.data.attributes.last_analysis_date,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  async enrichDomain(domain: string): Promise<any> {
    try {
      const response = await fetch(
        `https://www.virustotal.com/api/v3/domains/${domain}`,
        {
          headers: {
            'x-apikey': this.apiKey,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          categories: data.data.attributes.categories,
          lastAnalysisDate: data.data.attributes.last_analysis_date,
          reputation: data.data.attributes.reputation,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        'https://www.virustotal.com/api/v3/users/me',
        {
          headers: {
            'x-apikey': this.apiKey,
          },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}

export class AlienVaultIntegration {
  private apiKey: string;

  constructor(config: IntegrationConfig) {
    this.apiKey = config.parameters?.apiKey || config.apiKey!;
  }

  async enrichIP(ip: string): Promise<any> {
    try {
      const response = await fetch(
        `https://otx.alienvault.com/api/v1/indicators/IPv4/${ip}/general`,
        {
          headers: {
            'X-OTX-API-KEY': this.apiKey,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          reputation: data.reputation,
          validIndicator: data.valid,
          typeInferred: data.type_inferred,
          lastUpdated: data.modified,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  async enrichDomain(domain: string): Promise<any> {
    try {
      const response = await fetch(
        `https://otx.alienvault.com/api/v1/indicators/domain/${domain}/general`,
        {
          headers: {
            'X-OTX-API-KEY': this.apiKey,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          reputation: data.reputation,
          validIndicator: data.valid,
          lastUpdated: data.modified,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  async enrichHash(hash: string): Promise<any> {
    try {
      const response = await fetch(
        `https://otx.alienvault.com/api/v1/indicators/file/${hash}/general`,
        {
          headers: {
            'X-OTX-API-KEY': this.apiKey,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          reputation: data.reputation,
          validIndicator: data.valid,
          lastUpdated: data.modified,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  async getPulses(limit: number = 10): Promise<any[]> {
    try {
      const response = await fetch(
        `https://otx.alienvault.com/api/v1/pulses/subscribed?limit=${limit}`,
        {
          headers: {
            'X-OTX-API-KEY': this.apiKey,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.results || [];
      }
      return [];
    } catch {
      return [];
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        'https://otx.alienvault.com/api/v1/user/me',
        {
          headers: {
            'X-OTX-API-KEY': this.apiKey,
          },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}

export class RecordedFutureIntegration {
  private apiKey: string;

  constructor(config: IntegrationConfig) {
    this.apiKey = config.parameters?.apiKey || config.apiKey!;
  }

  async searchIndicators(query: string): Promise<any[]> {
    try {
      const response = await fetch(
        `https://api.recordedfuture.com/v2/search`,
        {
          method: 'POST',
          headers: {
            'X-RFToken': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.data?.results || [];
      }
      return [];
    } catch {
      return [];
    }
  }

  async getRiskScore(entity: string, entityType: string): Promise<number | null> {
    try {
      const response = await fetch(
        `https://api.recordedfuture.com/v2/${entityType}/${entity}/risk`,
        {
          headers: {
            'X-RFToken': this.apiKey,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.data?.risk?.score || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  async getIntelligence(entity: string, entityType: string): Promise<any> {
    try {
      const response = await fetch(
        `https://api.recordedfuture.com/v2/${entityType}/${entity}`,
        {
          headers: {
            'X-RFToken': this.apiKey,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
      return null;
    } catch {
      return null;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(
        'https://api.recordedfuture.com/v2/user',
        {
          headers: {
            'X-RFToken': this.apiKey,
          },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}
