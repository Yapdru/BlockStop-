import type {
  User,
  EmailAnalysisRequest,
  EmailAnalysisResult,
  LinkCheckResult,
  FileAnalysisResult,
  TierLevel,
  ExtensionConfig,
} from './types';
import * as authService from '../background/auth-service';
import * as tierGating from '../background/tier-gating';
import * as offlineDB from '../background/offline-db';

export class BlockStopAPI {
  private apiUrl = 'https://api.blockstop.io';

  /**
   * Scan email with optional offline fallback
   */
  async scanEmail(
    request: EmailAnalysisRequest,
    offlineMode: boolean = false
  ): Promise<EmailAnalysisResult> {
    try {
      const token = await authService.getValidAccessToken();
      const user = await authService.getCurrentUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // Check feature access
      if (!tierGating.checkFeatureAccess('emailScanning', user.tier)) {
        throw new Error(
          tierGating.getRestrictionMessage('emailScanning', user.tier) ||
            'Email scanning not available for your tier'
        );
      }

      // Try offline first if enabled and available
      if (offlineMode && tierGating.supportsOfflineMode(user.tier)) {
        try {
          const result = await this.scanEmailOffline(request, user.tier);
          return result;
        } catch (error) {
          console.warn('Offline scan failed, falling back to API:', error);
        }
      }

      // API scan
      const response = await fetch(`${this.apiUrl}/api/extension/scan/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Email scan failed: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error scanning email:', error);
      throw error;
    }
  }

  /**
   * Scan email using offline database
   */
  private async scanEmailOffline(
    request: EmailAnalysisRequest,
    tier: TierLevel
  ): Promise<EmailAnalysisResult> {
    const threats = [];
    const suspiciousLinks = [];
    const safeLinks = [];

    // Check phishing patterns
    const patterns = await offlineDB.getPhishingPatterns();
    const emailContent = `${request.emailSubject} ${request.emailBody}`.toLowerCase();

    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(emailContent)) {
          threats.push({
            id: crypto.randomUUID(),
            type: 'phishing' as const,
            severity: 'high' as const,
            title: 'Phishing Indicator',
            description: `Email matches known phishing pattern`,
            indicators: [pattern],
            confidence: 75,
            timestamp: Date.now(),
          });
        }
      } catch (e) {
        console.warn('Invalid regex pattern:', pattern);
      }
    }

    // Check links
    if (request.links) {
      for (const link of request.links) {
        const sig = await offlineDB.searchSignatureByHash(
          await this.hashString(link)
        );
        if (sig) {
          suspiciousLinks.push(link);
          threats.push(sig as any);
        } else {
          safeLinks.push(link);
        }
      }
    }

    return {
      riskScore: Math.min(100, threats.length * 20),
      threats,
      safeLinks,
      suspiciousLinks,
      timestamp: Date.now(),
    };
  }

  /**
   * Check link with optional offline fallback
   */
  async checkLink(
    url: string,
    offlineMode: boolean = false
  ): Promise<LinkCheckResult> {
    try {
      const token = await authService.getValidAccessToken();
      const user = await authService.getCurrentUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // Check feature access
      if (!tierGating.checkFeatureAccess('linkChecking', user.tier)) {
        throw new Error(
          tierGating.getRestrictionMessage('linkChecking', user.tier) ||
            'Link checking not available for your tier'
        );
      }

      // Try offline first if enabled
      if (offlineMode && tierGating.supportsOfflineMode(user.tier)) {
        try {
          const result = await this.checkLinkOffline(url, user.tier);
          return result;
        } catch (error) {
          console.warn('Offline link check failed, falling back to API:', error);
        }
      }

      // API check
      const response = await fetch(`${this.apiUrl}/api/extension/scan/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`Link check failed: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error checking link:', error);
      throw error;
    }
  }

  /**
   * Check link using offline database
   */
  private async checkLinkOffline(
    url: string,
    tier: TierLevel
  ): Promise<LinkCheckResult> {
    const hash = await this.hashString(url);
    const sig = await offlineDB.searchSignatureByHash(hash);

    return {
      url,
      isSafe: !sig,
      threats: sig ? [sig as any] : undefined,
      riskScore: sig ? 80 : 0,
      lastChecked: Date.now(),
    };
  }

  /**
   * Scan file with optional offline fallback
   */
  async scanFile(
    file: File,
    offlineMode: boolean = false
  ): Promise<FileAnalysisResult> {
    try {
      const token = await authService.getValidAccessToken();
      const user = await authService.getCurrentUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // Check feature access
      if (!tierGating.checkFeatureAccess('fileScanning', user.tier)) {
        throw new Error(
          tierGating.getRestrictionMessage('fileScanning', user.tier) ||
            'File scanning not available for your tier'
        );
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.apiUrl}/api/extension/scan/file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`File scan failed: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error scanning file:', error);
      throw error;
    }
  }

  /**
   * Get extension configuration
   */
  async getConfig(): Promise<ExtensionConfig> {
    try {
      const token = await authService.getValidAccessToken();

      const response = await fetch(`${this.apiUrl}/api/extension/config`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Config fetch failed: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error getting extension config:', error);
      throw error;
    }
  }

  /**
   * Get user tier information
   */
  async getUserTier(): Promise<{
    tier: TierLevel;
    features: typeof tierGating.getTierFeatures;
    rateLimit: typeof tierGating.getRateLimit;
  }> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      return {
        tier: user.tier,
        features: tierGating.getTierFeatures(user.tier),
        rateLimit: tierGating.getRateLimit(user.tier),
      };
    } catch (error) {
      console.error('Error getting user tier:', error);
      throw error;
    }
  }

  /**
   * Check if user can perform scan
   */
  async canPerformScan(period: 'day' | 'hour' = 'day'): Promise<boolean> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return false;

      // In a real app, would fetch actual scan counts from API
      // For now, always allow (rate limiting on server side)
      return tierGating.canPerformScan(user.tier, 0, period);
    } catch (error) {
      console.error('Error checking scan capability:', error);
      return false;
    }
  }

  /**
   * Simple string hashing for signatures
   */
  private async hashString(str: string): Promise<string> {
    const encoded = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}
