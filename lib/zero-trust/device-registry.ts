import { query } from '@/lib/db';

export interface DeviceRecord {
  deviceId: string;
  userId: string;
  deviceName: string;
  deviceType: 'laptop' | 'mobile' | 'tablet' | 'desktop' | 'unknown';
  osType: string;
  osVersion: string;
  registeredAt: Date;
  lastSeen: Date;
  trustScore: number;
  status: 'active' | 'inactive' | 'revoked' | 'quarantined';
}

export class DeviceRegistry {
  /**
   * Register a new device for a user
   */
  async registerDevice(userId: string, deviceInfo: Partial<DeviceRecord>): Promise<DeviceRecord> {
    try {
      const deviceId = deviceInfo.deviceId || this.generateDeviceId();
      const deviceName = deviceInfo.deviceName || 'Unnamed Device';
      const deviceType = deviceInfo.deviceType || 'unknown';
      const osType = deviceInfo.osType || 'unknown';
      const osVersion = deviceInfo.osVersion || 'unknown';

      const result = await query(
        `INSERT INTO zero_trust_devices (device_id, user_id, device_name, device_type, os_type, os_version, trust_score, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
         ON CONFLICT (user_id, device_id) DO UPDATE
         SET device_name = $3, device_type = $4, os_type = $5, os_version = $6, status = 'active', updated_at = CURRENT_TIMESTAMP
         RETURNING device_id, user_id, device_name, device_type, os_type, os_version, registered_at, last_seen, trust_score, status`,
        [deviceId, userId, deviceName, deviceType, osType, osVersion, 50]
      );

      if (result.rows.length === 0) {
        throw new Error('Failed to register device');
      }

      const device = result.rows[0];
      return this.mapDeviceRecord(device);
    } catch (error) {
      console.error(`Error registering device for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific device by device ID
   */
  async getDevice(deviceId: string): Promise<DeviceRecord | null> {
    try {
      const result = await query(
        `SELECT device_id, user_id, device_name, device_type, os_type, os_version, registered_at, last_seen, trust_score, status
         FROM zero_trust_devices
         WHERE device_id = $1`,
        [deviceId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapDeviceRecord(result.rows[0]);
    } catch (error) {
      console.error(`Error retrieving device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * List all devices for a user
   */
  async listUserDevices(userId: string): Promise<DeviceRecord[]> {
    try {
      const result = await query(
        `SELECT device_id, user_id, device_name, device_type, os_type, os_version, registered_at, last_seen, trust_score, status
         FROM zero_trust_devices
         WHERE user_id = $1
         ORDER BY last_seen DESC`,
        [userId]
      );

      return result.rows.map((row) => this.mapDeviceRecord(row));
    } catch (error) {
      console.error(`Error listing devices for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update device information
   */
  async updateDevice(deviceId: string, updates: Partial<DeviceRecord>): Promise<DeviceRecord> {
    try {
      // Build dynamic update query
      const updateFields: string[] = [];
      const updateValues: unknown[] = [];
      let paramCount = 1;

      if (updates.deviceName) {
        updateFields.push(`device_name = $${paramCount}`);
        updateValues.push(updates.deviceName);
        paramCount++;
      }

      if (updates.deviceType) {
        updateFields.push(`device_type = $${paramCount}`);
        updateValues.push(updates.deviceType);
        paramCount++;
      }

      if (updates.trustScore !== undefined) {
        updateFields.push(`trust_score = $${paramCount}`);
        updateValues.push(updates.trustScore);
        paramCount++;
      }

      if (updates.status) {
        updateFields.push(`status = $${paramCount}`);
        updateValues.push(updates.status);
        paramCount++;
      }

      // Always update the updated_at timestamp
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateFields.push(`last_seen = CURRENT_TIMESTAMP`);

      // Add device ID to params
      updateValues.push(deviceId);

      const updateQuery = `UPDATE zero_trust_devices
                          SET ${updateFields.join(', ')}
                          WHERE device_id = $${paramCount}
                          RETURNING device_id, user_id, device_name, device_type, os_type, os_version, registered_at, last_seen, trust_score, status`;

      const result = await query(updateQuery, updateValues);

      if (result.rows.length === 0) {
        throw new Error('Device not found');
      }

      return this.mapDeviceRecord(result.rows[0]);
    } catch (error) {
      console.error(`Error updating device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Revoke a device - prevent it from being used
   */
  async revokeDevice(deviceId: string): Promise<void> {
    try {
      await query(
        `UPDATE zero_trust_devices
         SET status = 'revoked', updated_at = CURRENT_TIMESTAMP
         WHERE device_id = $1`,
        [deviceId]
      );

      // Log the revocation action
      await query(
        `INSERT INTO zero_trust_device_trust_history (device_id, new_level, reason, changed_by)
         VALUES ($1, 'revoked', 'Device revoked by administrator', 'system')`,
        [deviceId]
      );
    } catch (error) {
      console.error(`Error revoking device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Quarantine a compromised device
   */
  async quarantineDevice(deviceId: string, reason: string): Promise<void> {
    try {
      await query(
        `UPDATE zero_trust_devices
         SET status = 'quarantined', is_compromised = TRUE, compromised_reason = $1, quarantine_reason = $1, quarantined_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE device_id = $2`,
        [reason, deviceId]
      );

      // Log the quarantine action
      await query(
        `INSERT INTO zero_trust_device_trust_history (device_id, new_level, reason, changed_by)
         VALUES ($1, 'quarantined', $2, 'system')`,
        [deviceId, reason]
      );
    } catch (error) {
      console.error(`Error quarantining device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Unquarantine a device after remediation
   */
  async unquarantineDevice(deviceId: string): Promise<void> {
    try {
      await query(
        `UPDATE zero_trust_devices
         SET status = 'active', is_compromised = FALSE, compromised_reason = NULL, quarantine_reason = NULL, quarantined_at = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE device_id = $1`,
        [deviceId]
      );

      // Log the unquarantine action
      await query(
        `INSERT INTO zero_trust_device_trust_history (device_id, new_level, reason, changed_by)
         VALUES ($1, 'active', 'Device unquarantined after remediation', 'system')`,
        [deviceId]
      );
    } catch (error) {
      console.error(`Error unquarantining device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Update device last seen timestamp
   */
  async updateLastSeen(deviceId: string): Promise<void> {
    try {
      await query(
        `UPDATE zero_trust_devices
         SET last_seen = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE device_id = $1`,
        [deviceId]
      );
    } catch (error) {
      console.error(`Error updating last seen for device ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Get devices by status
   */
  async getDevicesByStatus(userId: string, status: string): Promise<DeviceRecord[]> {
    try {
      const result = await query(
        `SELECT device_id, user_id, device_name, device_type, os_type, os_version, registered_at, last_seen, trust_score, status
         FROM zero_trust_devices
         WHERE user_id = $1 AND status = $2
         ORDER BY last_seen DESC`,
        [userId, status]
      );

      return result.rows.map((row) => this.mapDeviceRecord(row));
    } catch (error) {
      console.error(`Error getting devices by status:`, error);
      throw error;
    }
  }

  /**
   * Generate a unique device ID
   */
  private generateDeviceId(): string {
    return `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Map database row to DeviceRecord
   */
  private mapDeviceRecord(row: any): DeviceRecord {
    return {
      deviceId: row.device_id,
      userId: row.user_id,
      deviceName: row.device_name,
      deviceType: row.device_type || 'unknown',
      osType: row.os_type,
      osVersion: row.os_version,
      registeredAt: new Date(row.registered_at),
      lastSeen: new Date(row.last_seen),
      trustScore: parseFloat(row.trust_score),
      status: row.status,
    };
  }
}

export const deviceRegistry = new DeviceRegistry();
