/**
 * Hunt Templates - Pre-built threat hunting templates
 */

export interface HuntTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  huntType: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedDuration: number;
  mitreTechniques: string[];
  indicators: Array<{
    type: string;
    pattern: string;
    severity: string;
  }>;
  queries: string[];
  recommendations: string[];
}

export const HUNT_TEMPLATES: Record<string, HuntTemplate> = {
  PASS_THE_HASH: {
    id: "pth",
    name: "Pass the Hash",
    description: "Detect lateral movement using stolen NTLM hashes",
    category: "Credential Access",
    huntType: "behavior",
    difficulty: "intermediate",
    estimatedDuration: 60,
    mitreTechniques: ["T1550.002"],
    indicators: [
      {
        type: "pattern",
        pattern: "4768.*0x0$",
        severity: "high",
      },
      {
        type: "pattern",
        pattern: "4769.*encrypted_part_missing",
        severity: "high",
      },
    ],
    queries: [
      "EventID IN (4768, 4769) AND TicketEncryptionType = 0",
      "Account logons without password auth attempt",
    ],
    recommendations: [
      "Implement MFA",
      "Monitor 4768/4769 events",
      "Use Kerberos encryption",
    ],
  },

  ENUMERATION: {
    id: "enum",
    name: "Active Directory Enumeration",
    description: "Detect LDAP enumeration and recon activities",
    category: "Reconnaissance",
    huntType: "behavior",
    difficulty: "beginner",
    estimatedDuration: 45,
    mitreTechniques: ["T1087.002", "T1201"],
    indicators: [
      {
        type: "pattern",
        pattern: "LDAP.*Filter.*displayName",
        severity: "medium",
      },
      {
        type: "pattern",
        pattern: "Get-ADUser.*-Filter",
        severity: "medium",
      },
    ],
    queries: [
      "SearchFilter containing common LDAP filters",
      "PowerShell LDAP queries from non-admin",
    ],
    recommendations: [
      "Disable anonymous LDAP binds",
      "Monitor LDAP queries",
      "Restrict AD tools usage",
    ],
  },

  SUSPICIOUS_LOGONS: {
    id: "susp_logon",
    name: "Suspicious Logon Detection",
    description: "Identify anomalous authentication patterns",
    category: "Initial Access",
    huntType: "anomaly",
    difficulty: "beginner",
    estimatedDuration: 30,
    mitreTechniques: ["T1190", "T1133"],
    indicators: [
      {
        type: "pattern",
        pattern: "Failed logons > 10 in 10 minutes",
        severity: "high",
      },
      {
        type: "pattern",
        pattern: "Logon from impossible travel",
        severity: "critical",
      },
    ],
    queries: [
      "Multiple failed logons followed by success",
      "Logons from geographically distant locations within short time",
    ],
    recommendations: [
      "Enable MFA",
      "Configure account lockout",
      "Monitor logon events",
    ],
  },

  DATA_EXFILTRATION: {
    id: "exfil",
    name: "Data Exfiltration Detection",
    description: "Detect bulk data transfers and suspicious exports",
    category: "Exfiltration",
    huntType: "anomaly",
    difficulty: "advanced",
    estimatedDuration: 90,
    mitreTechniques: ["T1048", "T1567"],
    indicators: [
      {
        type: "pattern",
        pattern: "Large file transfer to external IP",
        severity: "critical",
      },
      {
        type: "pattern",
        pattern: "Bulk export from database or cloud",
        severity: "high",
      },
    ],
    queries: [
      "Network transfers > 1GB in 1 hour",
      "Database exports during off-hours",
      "Cloud storage access from unusual locations",
    ],
    recommendations: [
      "Monitor large transfers",
      "Implement DLP",
      "Restrict external transfers",
    ],
  },

  PRIVILEGE_ESCALATION: {
    id: "privesc",
    name: "Privilege Escalation",
    description: "Detect attempts to escalate privileges",
    category: "Privilege Escalation",
    huntType: "behavior",
    difficulty: "advanced",
    estimatedDuration: 75,
    mitreTechniques: ["T1548", "T1134"],
    indicators: [
      {
        type: "pattern",
        pattern: "Add-LocalGroupMember to Administrators",
        severity: "critical",
      },
      {
        type: "pattern",
        pattern: "UAC bypass detected",
        severity: "high",
      },
    ],
    queries: [
      "PowerShell elevation attempts",
      "Group membership changes to admin groups",
      "SetToken privilege granted",
    ],
    recommendations: [
      "Monitor admin group changes",
      "Enforce UAC",
      "Use PAM solutions",
    ],
  },
};

export class HuntTemplateManager {
  /**
   * Get template by ID
   */
  static getTemplate(id: string): HuntTemplate | null {
    return HUNT_TEMPLATES[id] || null;
  }

  /**
   * Get all templates
   */
  static getAllTemplates(): HuntTemplate[] {
    return Object.values(HUNT_TEMPLATES);
  }

  /**
   * Get templates by category
   */
  static getTemplatesByCategory(category: string): HuntTemplate[] {
    return Object.values(HUNT_TEMPLATES).filter((t) => t.category === category);
  }

  /**
   * Get templates by difficulty
   */
  static getTemplatesByDifficulty(difficulty: "beginner" | "intermediate" | "advanced"): HuntTemplate[] {
    return Object.values(HUNT_TEMPLATES).filter((t) => t.difficulty === difficulty);
  }

  /**
   * Get MITRE techniques covered
   */
  static getMitreTechniques(): string[] {
    const techniques = new Set<string>();
    for (const template of Object.values(HUNT_TEMPLATES)) {
      for (const tech of template.mitreTechniques) {
        techniques.add(tech);
      }
    }
    return Array.from(techniques);
  }

  /**
   * Create hunt from template
   */
  static createHuntFromTemplate(
    templateId: string,
    customization?: {
      name?: string;
      timeRange?: { start: Date; end: Date };
      targetScope?: string[];
    }
  ): any {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    return {
      name: customization?.name || template.name,
      description: template.description,
      huntType: template.huntType,
      templateId,
      indicators: template.indicators,
      queries: template.queries,
      estimatedDuration: template.estimatedDuration,
      timeRange: customization?.timeRange,
      targetScope: customization?.targetScope,
    };
  }
}

export default HuntTemplateManager;
