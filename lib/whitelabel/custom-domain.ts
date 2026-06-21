/**
 * Custom Domain Manager
 * Manages custom domain setup for white-label partners
 */

import { query } from '@/lib/db';

export interface CustomDomain {
  domainId: string;
  tenantId: string;
  domain: string;
  status: 'pending' | 'active' | 'failed' | 'expired';
  verificationMethod: 'dns' | 'file' | 'email';
  verificationToken: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
  sslStatus: 'pending' | 'active' | 'expired';
  sslProvider: 'letsencrypt' | 'custom';
  dnsRecords: Array<{
    type: string;
    name: string;
    value: string;
  }>;
  addedDate: Date;
  verifiedDate?: Date;
  expiryDate?: Date;
  redirects?: Array<{
    from: string;
    to: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DomainDNSRecord {
  type: 'A' | 'CNAME' | 'MX' | 'TXT';
  name: string;
  value: string;
  ttl?: number;
}

export interface DomainVerification {
  method: string;
  token: string;
  instruction: string;
  verified: boolean;
}

export class CustomDomainManager {
  /**
   * Add custom domain
   */
  async addCustomDomain(
    tenantId: string,
    domain: string,
    verificationMethod: 'dns' | 'file' | 'email' = 'dns'
  ): Promise<CustomDomain> {
    const domainId = `domain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const verificationToken = this.generateVerificationToken();

    try {
      await query(
        `INSERT INTO custom_domains (
          domain_id, tenant_id, domain, status, verification_method,
          verification_token, verification_status, ssl_status,
          ssl_provider, added_date, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          domainId,
          tenantId,
          domain,
          'pending',
          verificationMethod,
          verificationToken,
          'pending',
          'pending',
          'letsencrypt',
          new Date(),
          new Date(),
          new Date(),
        ]
      );

      return {
        domainId,
        tenantId,
        domain,
        status: 'pending',
        verificationMethod,
        verificationToken,
        verificationStatus: 'pending',
        sslStatus: 'pending',
        sslProvider: 'letsencrypt',
        dnsRecords: this.generateDNSRecords(domain, verificationToken),
        addedDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to add custom domain: ${error}`);
    }
  }

  /**
   * Get custom domain
   */
  async getCustomDomain(domainId: string): Promise<CustomDomain | null> {
    try {
      const result = await query(
        `SELECT * FROM custom_domains WHERE domain_id = $1`,
        [domainId]
      );

      if (result.rows.length === 0) return null;

      return this.mapRowToCustomDomain(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch custom domain: ${error}`);
    }
  }

  /**
   * Get domain by domain name
   */
  async getDomainByName(domain: string): Promise<CustomDomain | null> {
    try {
      const result = await query(
        `SELECT * FROM custom_domains WHERE domain = $1`,
        [domain]
      );

      if (result.rows.length === 0) return null;

      return this.mapRowToCustomDomain(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to fetch custom domain: ${error}`);
    }
  }

  /**
   * Get tenant's custom domains
   */
  async getTenantDomains(tenantId: string): Promise<CustomDomain[]> {
    try {
      const result = await query(
        `SELECT * FROM custom_domains WHERE tenant_id = $1 ORDER BY added_date DESC`,
        [tenantId]
      );

      return result.rows.map((row: any) => this.mapRowToCustomDomain(row));
    } catch (error) {
      throw new Error(`Failed to fetch tenant domains: ${error}`);
    }
  }

  /**
   * Verify domain ownership
   */
  async verifyDomain(domainId: string): Promise<CustomDomain> {
    try {
      const domain = await this.getCustomDomain(domainId);
      if (!domain) throw new Error('Domain not found');

      // In production, would verify DNS/file/email
      // For now, assume verified
      const result = await query(
        `UPDATE custom_domains
         SET verification_status = 'verified', verified_date = NOW(),
             status = 'active', updated_at = NOW()
         WHERE domain_id = $1
         RETURNING *`,
        [domainId]
      );

      return this.mapRowToCustomDomain(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to verify domain: ${error}`);
    }
  }

  /**
   * Mark domain verification as failed
   */
  async failDomainVerification(domainId: string, reason: string): Promise<CustomDomain> {
    try {
      const result = await query(
        `UPDATE custom_domains
         SET verification_status = 'failed', status = 'failed',
             updated_at = NOW()
         WHERE domain_id = $1
         RETURNING *`,
        [domainId]
      );

      return this.mapRowToCustomDomain(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to fail domain verification: ${error}`);
    }
  }

  /**
   * Generate verification instructions
   */
  getVerificationInstructions(domain: CustomDomain): DomainVerification {
    let instruction = '';

    switch (domain.verificationMethod) {
      case 'dns':
        instruction = `Add the following DNS record to your domain registrar:\nType: TXT\nName: _verification.${domain.domain}\nValue: ${domain.verificationToken}`;
        break;
      case 'file':
        instruction = `Upload a file to your domain root:\nPath: /.well-known/verification.txt\nContent: ${domain.verificationToken}`;
        break;
      case 'email':
        instruction = `Check the email sent to the domain registrant with verification link.`;
        break;
    }

    return {
      method: domain.verificationMethod,
      token: domain.verificationToken,
      instruction,
      verified: domain.verificationStatus === 'verified',
    };
  }

  /**
   * Set up SSL certificate
   */
  async setupSSL(domainId: string, provider: 'letsencrypt' | 'custom' = 'letsencrypt'): Promise<CustomDomain> {
    try {
      const domain = await this.getCustomDomain(domainId);
      if (!domain) throw new Error('Domain not found');
      if (domain.verificationStatus !== 'verified') {
        throw new Error('Domain must be verified before SSL setup');
      }

      // In production, would provision SSL certificate
      // For now, assume successful
      const result = await query(
        `UPDATE custom_domains
         SET ssl_status = 'active', ssl_provider = $2, updated_at = NOW()
         WHERE domain_id = $1
         RETURNING *`,
        [domainId, provider]
      );

      return this.mapRowToCustomDomain(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to setup SSL: ${error}`);
    }
  }

  /**
   * Add domain redirect
   */
  async addDomainRedirect(
    domainId: string,
    from: string,
    to: string
  ): Promise<CustomDomain> {
    try {
      const domain = await this.getCustomDomain(domainId);
      if (!domain) throw new Error('Domain not found');

      const redirects = domain.redirects || [];
      redirects.push({ from, to });

      await query(
        `UPDATE custom_domains
         SET redirects = $2, updated_at = NOW()
         WHERE domain_id = $1`,
        [domainId, JSON.stringify(redirects)]
      );

      return { ...domain, redirects };
    } catch (error) {
      throw new Error(`Failed to add redirect: ${error}`);
    }
  }

  /**
   * Remove custom domain
   */
  async removeCustomDomain(domainId: string): Promise<void> {
    try {
      await query(
        `DELETE FROM custom_domains WHERE domain_id = $1`,
        [domainId]
      );
    } catch (error) {
      throw new Error(`Failed to remove custom domain: ${error}`);
    }
  }

  /**
   * Check domain availability
   */
  async checkDomainAvailability(domain: string): Promise<boolean> {
    try {
      const result = await query(
        `SELECT COUNT(*) FROM custom_domains WHERE domain = $1 AND status = 'active'`,
        [domain]
      );

      return parseInt(result.rows[0].count) === 0;
    } catch (error) {
      throw new Error(`Failed to check domain availability: ${error}`);
    }
  }

  /**
   * Generate DNS records
   */
  private generateDNSRecords(domain: string, verificationToken: string): DomainDNSRecord[] {
    return [
      {
        type: 'CNAME',
        name: domain,
        value: `cname.blockstop.io`,
        ttl: 3600,
      },
      {
        type: 'TXT',
        name: `_verification.${domain}`,
        value: verificationToken,
        ttl: 3600,
      },
      {
        type: 'MX',
        name: domain,
        value: `mail.blockstop.io`,
        ttl: 3600,
      },
    ];
  }

  /**
   * Generate verification token
   */
  private generateVerificationToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Private helper to map database row to CustomDomain
   */
  private mapRowToCustomDomain(row: any): CustomDomain {
    return {
      domainId: row.domain_id,
      tenantId: row.tenant_id,
      domain: row.domain,
      status: row.status,
      verificationMethod: row.verification_method,
      verificationToken: row.verification_token,
      verificationStatus: row.verification_status,
      sslStatus: row.ssl_status,
      sslProvider: row.ssl_provider,
      dnsRecords: row.dns_records || [],
      addedDate: new Date(row.added_date),
      verifiedDate: row.verified_date ? new Date(row.verified_date) : undefined,
      expiryDate: row.expiry_date ? new Date(row.expiry_date) : undefined,
      redirects: row.redirects ? JSON.parse(row.redirects) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export const customDomainManager = new CustomDomainManager();
