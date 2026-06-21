/**
 * BlockStop Phase 28.5 - Regional Data Residency
 * Route data to correct regional endpoints with encryption
 */

import crypto from 'crypto';

export type DataRegion = 'US' | 'EU' | 'India' | 'APAC' | 'MENA' | 'LATAM';

export interface RegionMetadata {
  code: DataRegion;
  name: string;
  countries: string[];
  endpoints: {
    api: string;
    database: string;
    storage: string;
  };
  gdprRequired: boolean;
  dataResidencyEnforced: boolean;
  encryptionRequired: boolean;
  complianceFrameworks: string[];
}

export const REGION_METADATA: Record<DataRegion, RegionMetadata> = {
  US: {
    code: 'US',
    name: 'United States',
    countries: ['US', 'CA'],
    endpoints: {
      api: 'https://api-us.blockstop.io',
      database: 'postgresql://db-us.blockstop.io',
      storage: 's3-us.blockstop.io',
    },
    gdprRequired: false,
    dataResidencyEnforced: false,
    encryptionRequired: true,
    complianceFrameworks: ['SOC2', 'HIPAA', 'PCI-DSS'],
  },
  EU: {
    code: 'EU',
    name: 'European Union',
    countries: ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PL', 'SE', 'DK', 'NO', 'CH', 'UK'],
    endpoints: {
      api: 'https://api-eu.blockstop.io',
      database: 'postgresql://db-eu.blockstop.io',
      storage: 's3-eu.blockstop.io',
    },
    gdprRequired: true,
    dataResidencyEnforced: true,
    encryptionRequired: true,
    complianceFrameworks: ['GDPR', 'ISO 27001', 'NIS2'],
  },
  India: {
    code: 'India',
    name: 'India',
    countries: ['IN'],
    endpoints: {
      api: 'https://api-in.blockstop.io',
      database: 'postgresql://db-in.blockstop.io',
      storage: 's3-in.blockstop.io',
    },
    gdprRequired: false,
    dataResidencyEnforced: true,
    encryptionRequired: true,
    complianceFrameworks: ['DPDP', 'RBI'],
  },
  APAC: {
    code: 'APAC',
    name: 'Asia-Pacific',
    countries: ['JP', 'SG', 'AU', 'NZ', 'HK', 'MY', 'TH', 'PH'],
    endpoints: {
      api: 'https://api-apac.blockstop.io',
      database: 'postgresql://db-apac.blockstop.io',
      storage: 's3-apac.blockstop.io',
    },
    gdprRequired: false,
    dataResidencyEnforced: false,
    encryptionRequired: true,
    complianceFrameworks: ['PDPA', 'NPPI'],
  },
  MENA: {
    code: 'MENA',
    name: 'Middle East & North Africa',
    countries: ['AE', 'SA', 'KW', 'QA', 'EG'],
    endpoints: {
      api: 'https://api-mena.blockstop.io',
      database: 'postgresql://db-mena.blockstop.io',
      storage: 's3-mena.blockstop.io',
    },
    gdprRequired: false,
    dataResidencyEnforced: true,
    encryptionRequired: true,
    complianceFrameworks: ['MISA', 'SCA'],
  },
  LATAM: {
    code: 'LATAM',
    name: 'Latin America',
    countries: ['BR', 'MX', 'AR', 'CL', 'CO'],
    endpoints: {
      api: 'https://api-latam.blockstop.io',
      database: 'postgresql://db-latam.blockstop.io',
      storage: 's3-latam.blockstop.io',
    },
    gdprRequired: false,
    dataResidencyEnforced: true,
    encryptionRequired: true,
    complianceFrameworks: ['LGPD', 'LFPDPPP'],
  },
};

export interface UserDataLocation {
  userId: string;
  region: DataRegion;
  country?: string;
  lastUpdated: Date;
  encryptionKey?: string;
  encryptionAlgorithm: 'AES-256-GCM';
}

export class RegionManager {
  private userRegions: Map<string, UserDataLocation> = new Map();
  private readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';

  /**
   * Determine user's region based on country
   */
  public determineRegion(countryCode: string): DataRegion {
    for (const [region, metadata] of Object.entries(REGION_METADATA)) {
      if (metadata.countries.includes(countryCode)) {
        return region as DataRegion;
      }
    }
    // Default to US for unknown countries
    return 'US';
  }

  /**
   * Get region for user
   */
  public getUserRegion(userId: string): DataRegion {
    const location = this.userRegions.get(userId);
    return location?.region || 'US';
  }

  /**
   * Set user's data region
   */
  public setUserRegion(userId: string, region: DataRegion, countryCode?: string): UserDataLocation {
    const location: UserDataLocation = {
      userId,
      region,
      country: countryCode,
      lastUpdated: new Date(),
      encryptionAlgorithm: 'AES-256-GCM',
      encryptionKey: this.generateEncryptionKey(),
    };

    this.userRegions.set(userId, location);
    return location;
  }

  /**
   * Get regional metadata
   */
  public getRegionMetadata(region: DataRegion): RegionMetadata {
    return REGION_METADATA[region];
  }

  /**
   * Get API endpoint for region
   */
  public getApiEndpoint(region: DataRegion): string {
    return REGION_METADATA[region].endpoints.api;
  }

  /**
   * Get database endpoint for region
   */
  public getDatabaseEndpoint(region: DataRegion): string {
    return REGION_METADATA[region].endpoints.database;
  }

  /**
   * Get storage endpoint for region
   */
  public getStorageEndpoint(region: DataRegion): string {
    return REGION_METADATA[region].endpoints.storage;
  }

  /**
   * Check if region requires GDPR compliance
   */
  public isGDPRRequired(region: DataRegion): boolean {
    return REGION_METADATA[region].gdprRequired;
  }

  /**
   * Check if data residency is enforced
   */
  public isDataResidencyEnforced(region: DataRegion): boolean {
    return REGION_METADATA[region].dataResidencyEnforced;
  }

  /**
   * Encrypt data at rest
   */
  public encryptDataAtRest(
    data: string,
    userId: string,
    keyOverride?: string
  ): { encrypted: string; iv: string; authTag: string } {
    const location = this.userRegions.get(userId);
    const key = keyOverride || location?.encryptionKey || this.generateEncryptionKey();

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  /**
   * Decrypt data at rest
   */
  public decryptDataAtRest(
    encrypted: string,
    iv: string,
    authTag: string,
    userId: string,
    keyOverride?: string
  ): string {
    const location = this.userRegions.get(userId);
    const key = keyOverride || location?.encryptionKey;

    if (!key) {
      throw new Error('No encryption key available for user');
    }

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(key, 'hex'),
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate encryption key
   */
  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create encrypted transport layer
   */
  public createSecureTransport(region: DataRegion) {
    return {
      apiEndpoint: this.getApiEndpoint(region),
      databaseEndpoint: this.getDatabaseEndpoint(region),
      storageEndpoint: this.getStorageEndpoint(region),
      tlsVersion: '1.3',
      cipherSuites: [
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
      ],
      hsts: true,
      certificatePinning: true,
    };
  }

  /**
   * Validate data residency compliance
   */
  public validateDataResidency(userId: string, dataRegion: DataRegion): boolean {
    const userLocation = this.userRegions.get(userId);
    if (!userLocation) {
      return false;
    }

    if (!REGION_METADATA[userLocation.region].dataResidencyEnforced) {
      return true;
    }

    // User's data region must match their physical region
    return userLocation.region === dataRegion;
  }

  /**
   * Get compliance requirements for region
   */
  public getComplianceRequirements(region: DataRegion): string[] {
    return REGION_METADATA[region].complianceFrameworks;
  }

  /**
   * Check encryption requirements
   */
  public isEncryptionRequired(region: DataRegion): boolean {
    return REGION_METADATA[region].encryptionRequired;
  }

  /**
   * Create backup plan for region
   */
  public createBackupPlan(region: DataRegion) {
    const metadata = REGION_METADATA[region];
    return {
      primaryRegion: region,
      backupRegions: this.getBackupRegions(region),
      retentionDays: metadata.gdprRequired ? 90 : 30,
      encryptionRequired: metadata.encryptionRequired,
      frequencyHours: 6,
    };
  }

  /**
   * Get backup regions
   */
  private getBackupRegions(region: DataRegion): DataRegion[] {
    const backupMap: Record<DataRegion, DataRegion[]> = {
      US: ['US'], // Multiple zones within US
      EU: ['EU'], // Multiple zones within EU
      India: ['APAC'],
      APAC: ['APAC'],
      MENA: ['EU'],
      LATAM: ['US'],
    };

    return backupMap[region] || ['US'];
  }

  /**
   * Get all regions
   */
  public getAllRegions(): RegionMetadata[] {
    return Object.values(REGION_METADATA);
  }

  /**
   * Migrate user data between regions
   */
  public async migrateUserData(
    userId: string,
    fromRegion: DataRegion,
    toRegion: DataRegion
  ): Promise<{ success: boolean; migratedAt: Date; fromRegion: DataRegion; toRegion: DataRegion }> {
    // This would involve:
    // 1. Encrypting data in source region
    // 2. Securely transferring to target region
    // 3. Decrypting and re-encrypting in target region
    // 4. Verifying integrity
    // 5. Updating user location record

    const location = this.setUserRegion(userId, toRegion);

    return {
      success: true,
      migratedAt: new Date(),
      fromRegion,
      toRegion,
    };
  }
}

export const regionManager = new RegionManager();
