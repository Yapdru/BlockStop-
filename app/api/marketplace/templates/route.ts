/**
 * Threat Templates Marketplace API
 * Community-created threat rules and templates with versioning
 */

import { NextRequest, NextResponse } from 'next/server';

export interface ThreatTemplate {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  createdBy: string;
  version: string; // semantic versioning
  templateType: 'detection_rule' | 'investigation' | 'automation' | 'response_playbook';
  threatCategories: string[];
  industryFocus: string[]; // 'healthcare', 'finance', 'retail', etc.
  ruleFormat: 'yara' | 'snort' | 'suricata' | 'sigma' | 'custom';
  ruleContent: string;
  requiredTools: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  verified: boolean;
  verifiedAt?: Date;
  ratingScore: number;
  usageCount: number;
  downloadCount: number;
  featured: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  changelog: Array<{
    version: string;
    date: Date;
    changes: string;
    downloadCount: number;
  }>;
  testing: {
    lastTestedDate?: Date;
    detectionRate: number; // 0-100
    falsePositiveRate: number; // 0-100
    malwareFamily?: string;
  };
}

export interface TemplateRating {
  id: string;
  templateId: string;
  userId: string;
  rating: number; // 1-5
  review: string;
  helpful: number;
  createdAt: Date;
}

export interface TemplateUsage {
  id: string;
  templateId: string;
  userId: string;
  version: string;
  deployedAt: Date;
  status: 'active' | 'inactive' | 'archived';
  detectionCount: number;
  falsePositives: number;
  feedback?: string;
}

// In-memory storage
const templates: Map<string, ThreatTemplate> = new Map();
const templateRatings: Map<string, TemplateRating[]> = new Map();
const templateUsage: Map<string, TemplateUsage[]> = new Map();

// Sample templates
function initializeTemplates() {
  const sampleTemplates: ThreatTemplate[] = [
    {
      id: 'template-001',
      name: 'Ransomware Behavior Detection',
      description: 'Detect common ransomware behaviors including file encryption and shadow copy deletion',
      creatorId: 'user-123',
      createdBy: 'SecurityTeam',
      version: '2.1.0',
      templateType: 'detection_rule',
      threatCategories: ['ransomware', 'encryption', 'data-exfiltration'],
      industryFocus: ['healthcare', 'finance', 'manufacturing'],
      ruleFormat: 'sigma',
      ruleContent: `title: Ransomware Behavior Detection
detection:
  selection:
    EventID: 4688
    CommandLine|contains:
      - 'vssadmin'
      - 'wmic'
      - 'fsutil'
  condition: selection`,
      requiredTools: ['Sysmon', 'Windows Event Log'],
      difficulty: 'intermediate',
      verified: true,
      verifiedAt: new Date('2024-01-15'),
      ratingScore: 4.7,
      usageCount: 2430,
      downloadCount: 3100,
      featured: true,
      tags: ['ransomware', 'detection', 'windows', 'behavior'],
      createdAt: new Date('2023-06-01'),
      updatedAt: new Date('2024-01-15'),
      changelog: [
        {
          version: '2.1.0',
          date: new Date('2024-01-15'),
          changes: 'Added shadow copy detection patterns',
          downloadCount: 800,
        },
        {
          version: '2.0.5',
          date: new Date('2023-12-20'),
          changes: 'Improved FP reduction',
          downloadCount: 1200,
        },
      ],
      testing: {
        lastTestedDate: new Date('2024-01-18'),
        detectionRate: 92,
        falsePositiveRate: 2.1,
        malwareFamily: 'Ryuk, Lockbit, WannaCry',
      },
    },
    {
      id: 'template-002',
      name: 'Phishing Email Detection Rules',
      description: 'Advanced pattern matching for phishing email detection',
      creatorId: 'user-456',
      createdBy: 'EmailSecurityExpert',
      version: '1.8.3',
      templateType: 'detection_rule',
      threatCategories: ['phishing', 'credential-theft', 'social-engineering'],
      industryFocus: ['all'],
      ruleFormat: 'custom',
      ruleContent: `Rule: Phishing Email Detection
IF email contains:
  - Urgency keywords: "verify", "confirm", "urgent"
  - Credential requests: "password", "username", "2fa"
  - Suspicious links: shortened URLs, IP-based domains
  - Spoofed sender: domain mismatch, similar-looking domain
THEN: Alert as phishing`,
      requiredTools: ['Email Gateway', 'DNS', 'WHOIS'],
      difficulty: 'beginner',
      verified: true,
      verifiedAt: new Date('2024-01-10'),
      ratingScore: 4.5,
      usageCount: 5670,
      downloadCount: 7200,
      featured: true,
      tags: ['phishing', 'email-security', 'detection'],
      createdAt: new Date('2023-05-15'),
      updatedAt: new Date('2024-01-10'),
      changelog: [
        {
          version: '1.8.3',
          date: new Date('2024-01-10'),
          changes: 'Added domain similarity detection',
          downloadCount: 1100,
        },
      ],
      testing: {
        lastTestedDate: new Date('2024-01-19'),
        detectionRate: 88,
        falsePositiveRate: 3.5,
        malwareFamily: 'Various phishing campaigns',
      },
    },
    {
      id: 'template-003',
      name: 'Lateral Movement Detection',
      description: 'Detect suspicious lateral movement patterns in network',
      creatorId: 'user-789',
      createdBy: 'NetworkSecurityExpert',
      version: '3.0.0',
      templateType: 'investigation',
      threatCategories: ['lateral-movement', 'privilege-escalation', 'apt'],
      industryFocus: ['finance', 'government', 'technology'],
      ruleFormat: 'yara',
      ruleContent: `rule LateralMovement {
  strings:
    $a1 = "admin$" nocase
    $a2 = "c$" nocase
    $p1 = "psexec" nocase
    $p2 = "wmiexec" nocase
  condition:
    any of ($a*) and any of ($p*)
}`,
      requiredTools: ['Sysmon', 'Network Monitoring', 'EDR'],
      difficulty: 'advanced',
      verified: true,
      verifiedAt: new Date('2023-12-25'),
      ratingScore: 4.8,
      usageCount: 1850,
      downloadCount: 2300,
      featured: false,
      tags: ['lateral-movement', 'detection', 'apt', 'investigation'],
      createdAt: new Date('2023-04-01'),
      updatedAt: new Date('2024-01-05'),
      changelog: [
        {
          version: '3.0.0',
          date: new Date('2024-01-05'),
          changes: 'Complete rewrite with improved accuracy',
          downloadCount: 450,
        },
      ],
      testing: {
        lastTestedDate: new Date('2024-01-17'),
        detectionRate: 95,
        falsePositiveRate: 1.2,
        malwareFamily: 'APT28, APT33, Wizard Spider',
      },
    },
  ];

  for (const template of sampleTemplates) {
    templates.set(template.id, template);
    templateRatings.set(template.id, []);
    templateUsage.set(template.id, []);
  }
}

initializeTemplates();

/**
 * GET /api/marketplace/templates
 * List all threat templates
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const industry = searchParams.get('industry');
    const difficulty = searchParams.get('difficulty');
    const verified = searchParams.get('verified') === 'true';
    const search = searchParams.get('search')?.toLowerCase();

    let result = Array.from(templates.values());

    if (category) {
      result = result.filter(t => t.threatCategories.includes(category));
    }

    if (industry) {
      result = result.filter(t => t.industryFocus.includes(industry));
    }

    if (difficulty) {
      result = result.filter(t => t.difficulty === difficulty);
    }

    if (verified) {
      result = result.filter(t => t.verified);
    }

    if (search) {
      result = result.filter(
        t =>
          t.name.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search) ||
          t.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    result.sort((a, b) => b.downloadCount - a.downloadCount);

    const total = result.length;
    const startIdx = (page - 1) * limit;
    const paginatedResults = result.slice(startIdx, startIdx + limit);

    return NextResponse.json({
      success: true,
      data: {
        templates: paginatedResults,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        categories: ['ransomware', 'phishing', 'lateral-movement', 'privilege-escalation', 'apt'],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketplace/templates
 * Create a new threat template
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      creatorId,
      createdBy,
      ruleFormat,
      ruleContent,
      templateType,
      threatCategories,
      industryFocus,
    } = body;

    if (!name || !description || !creatorId || !ruleContent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const templateId = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newTemplate: ThreatTemplate = {
      id: templateId,
      name,
      description,
      creatorId,
      createdBy: createdBy || creatorId,
      version: '1.0.0',
      templateType: templateType || 'detection_rule',
      threatCategories: threatCategories || [],
      industryFocus: industryFocus || ['all'],
      ruleFormat: ruleFormat || 'custom',
      ruleContent,
      requiredTools: [],
      difficulty: 'intermediate',
      verified: false,
      ratingScore: 0,
      usageCount: 0,
      downloadCount: 0,
      featured: false,
      tags: threatCategories || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      changelog: [
        {
          version: '1.0.0',
          date: new Date(),
          changes: 'Initial release',
          downloadCount: 0,
        },
      ],
      testing: {
        detectionRate: 0,
        falsePositiveRate: 0,
      },
    };

    templates.set(templateId, newTemplate);
    templateRatings.set(templateId, []);
    templateUsage.set(templateId, []);

    return NextResponse.json(
      {
        success: true,
        data: newTemplate,
        message: 'Template created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: 400 }
    );
  }
}

/**
 * POST /api/marketplace/templates/:templateId/rate
 * Rate a template
 */
export async function POST_RATE(request: NextRequest) {
  try {
    const templateId = request.nextUrl.pathname.split('/')[4];
    const { userId, rating, review } = await request.json();

    if (!templateId || !userId || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    const template = templates.get(templateId);
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    const newRating: TemplateRating = {
      id: `rating-${Date.now()}`,
      templateId,
      userId,
      rating,
      review: review || '',
      helpful: 0,
      createdAt: new Date(),
    };

    if (!templateRatings.has(templateId)) {
      templateRatings.set(templateId, []);
    }

    templateRatings.get(templateId)!.push(newRating);

    const ratings = templateRatings.get(templateId) || [];
    template.ratingScore =
      Math.round((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) * 10) / 10;

    return NextResponse.json({
      success: true,
      data: newRating,
      message: 'Rating submitted',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to submit rating' },
      { status: 400 }
    );
  }
}

/**
 * POST /api/marketplace/templates/:templateId/deploy
 * Deploy a template
 */
export async function POST_DEPLOY(request: NextRequest) {
  try {
    const templateId = request.nextUrl.pathname.split('/')[4];
    const { userId, version } = await request.json();

    if (!templateId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const template = templates.get(templateId);
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    const usage: TemplateUsage = {
      id: `usage-${Date.now()}`,
      templateId,
      userId,
      version: version || template.version,
      deployedAt: new Date(),
      status: 'active',
      detectionCount: 0,
      falsePositives: 0,
    };

    if (!templateUsage.has(templateId)) {
      templateUsage.set(templateId, []);
    }

    templateUsage.get(templateId)!.push(usage);
    template.usageCount++;
    template.downloadCount++;

    return NextResponse.json(
      {
        success: true,
        data: usage,
        message: 'Template deployed successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to deploy template' },
      { status: 400 }
    );
  }
}
