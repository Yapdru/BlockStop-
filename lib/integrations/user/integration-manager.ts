import { UserIntegration, ServiceProvider, IntegrationStatus, ScanResult } from './types';
import { IntegrationFactory } from './integration-factory';
import { getDb } from '@/lib/db';

export class IntegrationManager {
  private factory: IntegrationFactory;

  constructor(factory: IntegrationFactory) {
    this.factory = factory;
  }

  async connectIntegration(
    userId: string,
    provider: ServiceProvider,
    authCode: string,
    scopes: string[]
  ): Promise<UserIntegration> {
    const db = getDb();

    const tempIntegration: UserIntegration = {
      id: `${provider}_${Date.now()}`,
      userId,
      provider,
      serviceType: this.factory.getServiceType(provider),
      accessToken: '',
      isActive: true,
      scopes,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const integration = this.factory.createIntegration(userId, tempIntegration);
    const tokens = await integration.exchangeCodeForToken(authCode);

    const result = await db.query(
      `INSERT INTO user_integrations (user_id, provider, service_type, access_token, refresh_token, expires_at, is_active, scopes, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING id, user_id, provider, service_type, access_token, refresh_token, expires_at, is_active, scopes, metadata, created_at, updated_at`,
      [
        userId,
        provider,
        this.factory.getServiceType(provider),
        tokens.accessToken,
        tokens.refreshToken || null,
        tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000) : null,
        true,
        JSON.stringify(scopes),
        '{}'
      ]
    );

    return this.mapRowToIntegration(result.rows[0]);
  }

  async disconnectIntegration(userId: string, integrationId: string): Promise<void> {
    const db = getDb();

    const result = await db.query(
      'SELECT * FROM user_integrations WHERE id = $1 AND user_id = $2',
      [integrationId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Integration not found');
    }

    const row = result.rows[0];
    const tempIntegration = this.mapRowToIntegration(row);
    const integration = this.factory.createIntegration(userId, tempIntegration);

    try {
      await integration.disconnect();
    } catch (error) {
      console.error('Error disconnecting integration:', error);
    }

    await db.query('DELETE FROM user_integrations WHERE id = $1 AND user_id = $2', [integrationId, userId]);
  }

  async getIntegration(userId: string, integrationId: string): Promise<UserIntegration> {
    const db = getDb();
    const result = await db.query(
      'SELECT * FROM user_integrations WHERE id = $1 AND user_id = $2',
      [integrationId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Integration not found');
    }

    return this.mapRowToIntegration(result.rows[0]);
  }

  async getUserIntegrations(userId: string): Promise<UserIntegration[]> {
    const db = getDb();
    const result = await db.query(
      'SELECT * FROM user_integrations WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return result.rows.map(row => this.mapRowToIntegration(row));
  }

  async getIntegrationsByProvider(userId: string, provider: ServiceProvider): Promise<UserIntegration[]> {
    const db = getDb();
    const result = await db.query(
      'SELECT * FROM user_integrations WHERE user_id = $1 AND provider = $2',
      [userId, provider]
    );

    return result.rows.map(row => this.mapRowToIntegration(row));
  }

  async getIntegrationStatus(userId: string, integrationId: string): Promise<IntegrationStatus> {
    const integration = await this.getIntegration(userId, integrationId);

    return {
      provider: integration.provider,
      isConnected: integration.isActive,
      lastSyncAt: integration.metadata.lastSyncAt ? new Date(integration.metadata.lastSyncAt as string) : undefined,
      errorMessage: integration.metadata.errorMessage as string | undefined,
      tokenExpiry: integration.expiresAt
    };
  }

  async scanWithIntegration(userId: string, integrationId: string): Promise<ScanResult> {
    const integration = await this.getIntegration(userId, integrationId);

    if (!integration.isActive) {
      throw new Error('Integration is not active');
    }

    try {
      const instance = this.factory.createIntegration(userId, integration);
      const result = await instance.scanForThreats();

      const db = getDb();
      await db.query(
        'UPDATE user_integrations SET metadata = metadata || $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify({ lastSyncAt: new Date().toISOString(), lastScanResult: { itemsScanned: result.itemsScanned, threatsDetected: result.threatsDetected } }), integrationId]
      );

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const db = getDb();
      await db.query(
        'UPDATE user_integrations SET metadata = metadata || $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify({ errorMessage, lastErrorAt: new Date().toISOString() }), integrationId]
      );

      throw error;
    }
  }

  private mapRowToIntegration(row: any): UserIntegration {
    return {
      id: row.id,
      userId: row.user_id,
      provider: row.provider,
      serviceType: row.service_type,
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
      isActive: row.is_active,
      scopes: typeof row.scopes === 'string' ? JSON.parse(row.scopes) : row.scopes || [],
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata || {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}
