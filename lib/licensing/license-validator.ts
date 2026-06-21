/**
 * Enterprise License Validator
 * Validate and authenticate licenses
 */

export interface ValidationResult {
  valid: boolean;
  licenseId: string;
  organizationId: string;
  organizationName: string;
  licenseType: "perpetual" | "annual" | "per-user";
  tier: "pro" | "enterprise";
  status: "active" | "expired" | "revoked" | "invalid";
  expiresAt?: Date;
  features: string[];
  message: string;
  validatedAt: Date;
}

export interface LicenseValidationConfig {
  allowOffline?: boolean;
  offlineCacheDuration?: number; // seconds
  validateChecksum?: boolean;
  checkRevocation?: boolean;
}

export class LicenseValidator {
  private cache: Map<
    string,
    {
      result: ValidationResult;
      timestamp: Date;
    }
  > = new Map();

  private revocationList: Set<string> = new Set();
  private offlineCache: Map<
    string,
    {
      result: ValidationResult;
      timestamp: Date;
    }
  > = new Map();

  /**
   * Validate a license key
   */
  async validateLicense(
    licenseKey: string,
    organizationId: string,
    config: LicenseValidationConfig = {}
  ): Promise<ValidationResult> {
    const defaultConfig: LicenseValidationConfig = {
      allowOffline: true,
      offlineCacheDuration: 86400, // 24 hours
      validateChecksum: true,
      checkRevocation: true,
    };

    const mergedConfig = { ...defaultConfig, ...config };

    // Check cache first
    const cached = this.cache.get(licenseKey);
    if (cached) {
      return cached.result;
    }

    try {
      // In production, validate against server/database
      const result = await this.performValidation(
        licenseKey,
        organizationId,
        mergedConfig
      );

      // Cache the result
      this.cache.set(licenseKey, {
        result,
        timestamp: new Date(),
      });

      return result;
    } catch (error) {
      // Try offline cache if allowed
      if (mergedConfig.allowOffline) {
        const offlineCached = this.offlineCache.get(licenseKey);
        if (offlineCached) {
          const age =
            (Date.now() - offlineCached.timestamp.getTime()) / 1000;
          if (
            age <
            (mergedConfig.offlineCacheDuration || 86400)
          ) {
            return {
              ...offlineCached.result,
              message:
                "Validated from offline cache (server unavailable)",
            };
          }
        }
      }

      return {
        valid: false,
        licenseId: "UNKNOWN",
        organizationId,
        organizationName: "Unknown",
        licenseType: "annual",
        tier: "pro",
        status: "invalid",
        features: [],
        message: `Validation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        validatedAt: new Date(),
      };
    }
  }

  /**
   * Perform actual validation
   */
  private async performValidation(
    licenseKey: string,
    organizationId: string,
    config: LicenseValidationConfig
  ): Promise<ValidationResult> {
    // Validate license key format
    if (!this.isValidLicenseKeyFormat(licenseKey)) {
      return {
        valid: false,
        licenseId: "INVALID_FORMAT",
        organizationId,
        organizationName: "Unknown",
        licenseType: "annual",
        tier: "pro",
        status: "invalid",
        features: [],
        message: "Invalid license key format",
        validatedAt: new Date(),
      };
    }

    // In production: Query database for license details
    // For now, return mock validation
    const mockLicense = {
      licenseId: "LIC-MOCK-001",
      organizationId,
      organizationName: "Demo Organization",
      licenseType: "perpetual" as const,
      tier: "enterprise" as const,
      status: "active" as const,
      expiresAt: undefined,
      features: [
        "advanced_analytics",
        "api_access",
        "webhook_support",
        "sso",
      ],
    };

    // Check if revoked
    if (
      config.checkRevocation &&
      this.revocationList.has(licenseKey)
    ) {
      return {
        valid: false,
        licenseId: mockLicense.licenseId,
        organizationId: mockLicense.organizationId,
        organizationName: mockLicense.organizationName,
        licenseType: mockLicense.licenseType,
        tier: mockLicense.tier,
        status: "revoked",
        features: [],
        message: "License has been revoked",
        validatedAt: new Date(),
      };
    }

    // Check expiration
    if (
      mockLicense.expiresAt &&
      new Date() > mockLicense.expiresAt
    ) {
      return {
        valid: false,
        licenseId: mockLicense.licenseId,
        organizationId: mockLicense.organizationId,
        organizationName: mockLicense.organizationName,
        licenseType: mockLicense.licenseType,
        tier: mockLicense.tier,
        status: "expired",
        expiresAt: mockLicense.expiresAt,
        features: [],
        message: "License has expired",
        validatedAt: new Date(),
      };
    }

    const result: ValidationResult = {
      valid: true,
      licenseId: mockLicense.licenseId,
      organizationId: mockLicense.organizationId,
      organizationName: mockLicense.organizationName,
      licenseType: mockLicense.licenseType,
      tier: mockLicense.tier,
      status: mockLicense.status,
      expiresAt: mockLicense.expiresAt,
      features: mockLicense.features,
      message: "License is valid",
      validatedAt: new Date(),
    };

    // Cache offline
    this.offlineCache.set(licenseKey, {
      result,
      timestamp: new Date(),
    });

    return result;
  }

  /**
   * Validate license key format
   */
  private isValidLicenseKeyFormat(key: string): boolean {
    // Format: XXXX-XXXX-XXXX-XXXX-XXXX
    const licenseKeyRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return licenseKeyRegex.test(key);
  }

  /**
   * Batch validate licenses
   */
  async validateBatch(
    licenses: Array<{ key: string; organizationId: string }>,
    config?: LicenseValidationConfig
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const license of licenses) {
      const result = await this.validateLicense(
        license.key,
        license.organizationId,
        config
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Add license to revocation list
   */
  async revokeLicense(licenseKey: string): Promise<void> {
    this.revocationList.add(licenseKey);
    this.cache.delete(licenseKey);
  }

  /**
   * Check if license has feature
   */
  async hasFeature(
    licenseKey: string,
    feature: string,
    organizationId: string
  ): Promise<boolean> {
    const validation = await this.validateLicense(licenseKey, organizationId);
    return validation.valid && validation.features.includes(feature);
  }

  /**
   * Get remaining license validity
   */
  async getRemainingValidity(
    licenseKey: string,
    organizationId: string
  ): Promise<{
    daysRemaining: number | null;
    valid: boolean;
  }> {
    const validation = await this.validateLicense(licenseKey, organizationId);

    if (!validation.valid) {
      return {
        daysRemaining: null,
        valid: false,
      };
    }

    if (!validation.expiresAt) {
      return {
        daysRemaining: null, // Perpetual
        valid: true,
      };
    }

    const daysRemaining = Math.floor(
      (validation.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return {
      daysRemaining: Math.max(0, daysRemaining),
      valid: daysRemaining > 0,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear offline cache
   */
  clearOfflineCache(): void {
    this.offlineCache.clear();
  }

  /**
   * Get validation statistics
   */
  getStats(): {
    cacheSize: number;
    offlineCacheSize: number;
    revocationListSize: number;
  } {
    return {
      cacheSize: this.cache.size,
      offlineCacheSize: this.offlineCache.size,
      revocationListSize: this.revocationList.size,
    };
  }

  /**
   * Verify license tier
   */
  async verifyTier(
    licenseKey: string,
    requiredTier: "pro" | "enterprise",
    organizationId: string
  ): Promise<boolean> {
    const validation = await this.validateLicense(licenseKey, organizationId);

    if (!validation.valid) {
      return false;
    }

    if (requiredTier === "enterprise") {
      return validation.tier === "enterprise";
    }

    return true; // Pro and Enterprise both valid for "pro" requirement
  }
}

export default LicenseValidator;
