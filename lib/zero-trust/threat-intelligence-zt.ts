import { query } from '@/lib/db';

export interface ThreatIntelligence {
  threatId: string;
  threatType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  indicators: string[];
  detectedAt: Date;
  affectedUsers: string[];
  affectedDevices: string[];
  mitigation: string[];
}

export interface ThreatContext {
  userId: string;
  deviceId: string;
  ipAddress: string;
  location: string;
  userAgent: string;
  accessContext: any;
}

export class ThreatIntelligence {
  private readonly THREAT_INTEL_CACHE_TTL_MINUTES = 60;
  private readonly CRITICAL_THRESHOLD = 85;
  private readonly HIGH_THRESHOLD = 65;
  private readonly MEDIUM_THRESHOLD = 45;

  /**
   * Analyze incoming threat intelligence
   */
  async analyzeThreatIntel(threatContext: ThreatContext): Promise<ThreatIntelligence | null> {
    try {
      let threatScore = 0;
      const indicators: string[] = [];
      const threatTypes: string[] = [];

      // Check if IP is in known threat database
      const ipThreatScore = await this.checkIPReputation(threatContext.ipAddress);
      if (ipThreatScore > 0) {
        threatScore += ipThreatScore;
        indicators.push(`IP address ${threatContext.ipAddress} has threat reputation score: ${ipThreatScore}`);
        threatTypes.push('malicious_ip');
      }

      // Check if user agent indicates known malware
      const userAgentThreatScore = await this.checkUserAgentReputation(threatContext.userAgent);
      if (userAgentThreatScore > 0) {
        threatScore += userAgentThreatScore;
        indicators.push(`User agent indicates known threat: ${threatContext.userAgent}`);
        threatTypes.push('malicious_user_agent');
      }

      // Check for credential stuffing patterns
      const credStuffingScore = await this.checkCredentialStuffingPatterns(threatContext.userId);
      if (credStuffingScore > 0) {
        threatScore += credStuffingScore;
        indicators.push('Credential stuffing attack pattern detected');
        threatTypes.push('credential_stuffing');
      }

      // Check for botnet activity
      const botnethScore = await this.checkBotnethActivity(threatContext.deviceId);
      if (botnethScore > 0) {
        threatScore += botnethScore;
        indicators.push('Potential botnet activity detected on device');
        threatTypes.push('botnet_activity');
      }

      // Check for known C2 communication patterns
      const c2Score = await this.checkCommand2ControlPatterns(threatContext.ipAddress, threatContext.userAgent);
      if (c2Score > 0) {
        threatScore += c2Score;
        indicators.push('Known command and control (C2) pattern detected');
        threatTypes.push('c2_communication');
      }

      // Check for phishing/social engineering indicators
      const phishingScore = await this.checkPhishingIndicators(threatContext.accessContext);
      if (phishingScore > 0) {
        threatScore += phishingScore;
        indicators.push('Phishing/social engineering indicators detected');
        threatTypes.push('phishing_attempt');
      }

      // Check for ransomware indicators
      const ransomwareScore = await this.checkRansomwareIndicators(threatContext.deviceId);
      if (ransomwareScore > 0) {
        threatScore += ransomwareScore;
        indicators.push('Ransomware activity indicators detected');
        threatTypes.push('ransomware_activity');
      }

      // Normalize threat score
      threatScore = Math.min(100, threatScore);

      if (threatScore > 0) {
        const severity = this.calculateSeverity(threatScore);
        const threat: ThreatIntelligence = {
          threatId: this.generateThreatId(),
          threatType: threatTypes.join(','),
          severity,
          description: this.generateThreatDescription(threatTypes, threatScore),
          indicators,
          detectedAt: new Date(),
          affectedUsers: [threatContext.userId],
          affectedDevices: [threatContext.deviceId],
          mitigation: this.generateMitigation(threatTypes, severity),
        };

        // Store threat intelligence
        await this.storeThreatIntel(threat);

        // If critical, trigger immediate response
        if (severity === 'critical') {
          await this.triggerThreatResponse(threat, threatContext);
        }

        return threat;
      }

      return null;
    } catch (error) {
      console.error(`Error analyzing threat intelligence:`, error);
      throw error;
    }
  }

  /**
   * Check IP reputation against threat databases
   */
  private async checkIPReputation(ipAddress: string): Promise<number> {
    try {
      // Check if IP is in known malicious IP list
      const result = await query(
        `SELECT severity FROM zero_trust_anomalies
         WHERE ip_address = $1::INET AND anomaly_type IN ('known_malicious_ip', 'c2_server', 'botnet_ip')
         AND detected_at > NOW() - INTERVAL '7 days'`,
        [ipAddress]
      );

      if (result.rows.length > 0) {
        const row = result.rows[0];
        switch (row.severity) {
          case 'critical':
            return 40;
          case 'high':
            return 25;
          case 'medium':
            return 15;
          default:
            return 5;
        }
      }

      return 0;
    } catch (error) {
      console.error(`Error checking IP reputation for ${ipAddress}:`, error);
      return 0;
    }
  }

  /**
   * Check user agent for known malware signatures
   */
  private async checkUserAgentReputation(userAgent: string): Promise<number> {
    try {
      // Check for known malicious user agents
      const maliciousPatterns = [
        /sqlmap/i,
        /nikto/i,
        /nessus/i,
        /nmap/i,
        /masscan/i,
        /metasploit/i,
        /burp/i,
        /zaproxy/i,
      ];

      for (const pattern of maliciousPatterns) {
        if (pattern.test(userAgent)) {
          return 30; // High threat for automated scanning tools
        }
      }

      return 0;
    } catch (error) {
      console.error(`Error checking user agent reputation:`, error);
      return 0;
    }
  }

  /**
   * Detect credential stuffing attack patterns
   */
  private async checkCredentialStuffingPatterns(userId: string): Promise<number> {
    try {
      // Check for multiple failed login attempts
      const result = await query(
        `SELECT COUNT(*) as failed_attempts FROM zero_trust_access_requests
         WHERE user_id = $1 AND decision = 'denied'
         AND timestamp > NOW() - INTERVAL '1 hour'`,
        [userId]
      );

      const failedAttempts = parseInt(result.rows[0].failed_attempts);

      if (failedAttempts >= 20) {
        return 50; // Critical credential stuffing
      } else if (failedAttempts >= 10) {
        return 30;
      } else if (failedAttempts >= 5) {
        return 15;
      }

      return 0;
    } catch (error) {
      console.error(`Error checking credential stuffing for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Check for botnet activity
   */
  private async checkBotnethActivity(deviceId: string): Promise<number> {
    try {
      // Check for botnet indicators
      const result = await query(
        `SELECT COUNT(*) as indicator_count FROM zero_trust_device_health_issues
         WHERE device_id = $1 AND issue_type IN ('botnet_malware', 'suspicious_outbound_connection', 'malware_detected')
         AND resolved = FALSE`,
        [deviceId]
      );

      const indicatorCount = parseInt(result.rows[0].indicator_count);

      if (indicatorCount > 0) {
        return 35; // Significant botnet threat
      }

      return 0;
    } catch (error) {
      console.error(`Error checking botnet activity for device ${deviceId}:`, error);
      return 0;
    }
  }

  /**
   * Detect command and control (C2) communication patterns
   */
  private async checkCommand2ControlPatterns(ipAddress: string, userAgent: string): Promise<number> {
    try {
      // Check for known C2 domains/IPs
      const c2Patterns = [
        /command.*control/i,
        /c2.*server/i,
        /beacon/i,
        /shell.*reverse/i,
      ];

      for (const pattern of c2Patterns) {
        if (pattern.test(userAgent) || pattern.test(ipAddress)) {
          return 50; // Critical C2 threat
        }
      }

      // Check for suspicious DNS queries or connection patterns
      const result = await query(
        `SELECT COUNT(*) as suspicious_connections FROM zero_trust_anomalies
         WHERE ip_address = $1::INET AND anomaly_type = 'c2_communication'
         AND detected_at > NOW() - INTERVAL '7 days'`,
        [ipAddress]
      );

      if (parseInt(result.rows[0].suspicious_connections) > 0) {
        return 40;
      }

      return 0;
    } catch (error) {
      console.error(`Error checking C2 patterns:`, error);
      return 0;
    }
  }

  /**
   * Check for phishing and social engineering indicators
   */
  private async checkPhishingIndicators(accessContext: any): Promise<number> {
    try {
      // Check for phishing-related patterns in access context
      if (accessContext && accessContext.resource) {
        const phishingPatterns = [
          /verify.*account/i,
          /confirm.*identity/i,
          /update.*password/i,
          /click.*link/i,
          /urgent.*action/i,
        ];

        for (const pattern of phishingPatterns) {
          if (pattern.test(accessContext.resource)) {
            return 30;
          }
        }
      }

      return 0;
    } catch (error) {
      console.error(`Error checking phishing indicators:`, error);
      return 0;
    }
  }

  /**
   * Check for ransomware activity indicators
   */
  private async checkRansomwareIndicators(deviceId: string): Promise<number> {
    try {
      // Check for ransomware file patterns or behavior
      const result = await query(
        `SELECT COUNT(*) as ransomware_indicators FROM zero_trust_device_health_issues
         WHERE device_id = $1 AND issue_type IN ('suspicious_file_encryption', 'mass_file_modification', 'ransomware_detected')
         AND resolved = FALSE`,
        [deviceId]
      );

      if (parseInt(result.rows[0].ransomware_indicators) > 0) {
        return 60; // High ransomware threat
      }

      return 0;
    } catch (error) {
      console.error(`Error checking ransomware indicators for device ${deviceId}:`, error);
      return 0;
    }
  }

  /**
   * Calculate threat severity from threat score
   */
  private calculateSeverity(threatScore: number): 'critical' | 'high' | 'medium' | 'low' {
    if (threatScore >= this.CRITICAL_THRESHOLD) {
      return 'critical';
    } else if (threatScore >= this.HIGH_THRESHOLD) {
      return 'high';
    } else if (threatScore >= this.MEDIUM_THRESHOLD) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Generate threat description
   */
  private generateThreatDescription(threatTypes: string[], threatScore: number): string {
    const threats = threatTypes.join(', ');
    return `Detected ${threats} with threat score ${threatScore}/100`;
  }

  /**
   * Generate mitigation recommendations
   */
  private generateMitigation(threatTypes: string[], severity: string): string[] {
    const mitigations: string[] = [];

    if (threatTypes.includes('malicious_ip')) {
      mitigations.push('Block IP address at network perimeter');
      mitigations.push('Revoke all sessions from this IP');
    }

    if (threatTypes.includes('credential_stuffing')) {
      mitigations.push('Force password reset for affected user');
      mitigations.push('Enable multi-factor authentication');
    }

    if (threatTypes.includes('botnet_activity')) {
      mitigations.push('Isolate infected device from network');
      mitigations.push('Run full malware scan and removal');
    }

    if (threatTypes.includes('c2_communication')) {
      mitigations.push('Immediately isolate device');
      mitigations.push('Perform forensic analysis');
      mitigations.push('Revoke all credentials');
    }

    if (threatTypes.includes('phishing_attempt')) {
      mitigations.push('Alert user about phishing attempt');
      mitigations.push('Train user on phishing recognition');
    }

    if (threatTypes.includes('ransomware_activity')) {
      mitigations.push('Immediately isolate device');
      mitigations.push('Restore from clean backup');
      mitigations.push('Conduct incident response');
    }

    if (severity === 'critical') {
      mitigations.unshift('IMMEDIATE ACTION: Escalate to security team');
      mitigations.push('Initiate incident response procedures');
    }

    return mitigations;
  }

  /**
   * Store threat intelligence in database
   */
  private async storeThreatIntel(threat: ThreatIntelligence): Promise<void> {
    try {
      await query(
        `INSERT INTO zero_trust_anomalies (user_id, device_id, anomaly_type, severity, description, anomaly_score, detected_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [threat.affectedUsers[0], threat.affectedDevices[0], threat.threatType, threat.severity, threat.description, 75]
      );
    } catch (error) {
      console.error(`Error storing threat intelligence:`, error);
      throw error;
    }
  }

  /**
   * Trigger threat response
   */
  private async triggerThreatResponse(threat: ThreatIntelligence, threatContext: ThreatContext): Promise<void> {
    try {
      // Log critical threat
      console.error(`CRITICAL THREAT DETECTED: ${threat.description}`);
      console.error(`Mitigation: ${threat.mitigation.join('; ')}`);

      // Kill all sessions for affected users
      for (const userId of threat.affectedUsers) {
        await query(
          `UPDATE zero_trust_sessions SET is_active = FALSE, expires_at = CURRENT_TIMESTAMP
           WHERE user_id = $1 AND is_active = TRUE`,
          [userId]
        );
      }

      // Alert security team (in production)
      // - Send critical alert email
      // - Create incident ticket
      // - Trigger automatic response actions
    } catch (error) {
      console.error(`Error triggering threat response:`, error);
      throw error;
    }
  }

  /**
   * Generate unique threat ID
   */
  private generateThreatId(): string {
    return `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get recent threats
   */
  async getRecentThreats(limitHours: number = 24): Promise<ThreatIntelligence[]> {
    try {
      const result = await query(
        `SELECT DISTINCT user_id, device_id, anomaly_type, severity, description, anomaly_score, detected_at
         FROM zero_trust_anomalies
         WHERE anomaly_type IN ('malicious_ip', 'botnet_activity', 'c2_communication', 'ransomware_activity', 'credential_stuffing')
         AND detected_at > NOW() - INTERVAL '${limitHours} hours'
         ORDER BY detected_at DESC`,
        []
      );

      return result.rows.map((row) => ({
        threatId: `threat_${row.user_id}_${row.device_id}`,
        threatType: row.anomaly_type,
        severity: row.severity,
        description: row.description,
        indicators: [row.description],
        detectedAt: new Date(row.detected_at),
        affectedUsers: [row.user_id],
        affectedDevices: [row.device_id],
        mitigation: [],
      }));
    } catch (error) {
      console.error(`Error getting recent threats:`, error);
      throw error;
    }
  }
}

export const threatIntelligence = new ThreatIntelligence();
