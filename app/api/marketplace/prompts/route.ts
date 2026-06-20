/**
 * AI Prompts/Agents Marketplace API
 * Custom BetterBot instructions and industry-specific prompts
 */

import { NextRequest, NextResponse } from 'next/server';

export interface AIPrompt {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  createdBy: string;
  version: string;
  type: 'betterbot_instruction' | 'soc_analyst' | 'threat_hunter' | 'incident_responder' | 'admin';
  industry: 'healthcare' | 'finance' | 'retail' | 'manufacturing' | 'government' | 'education' | 'general';
  role: 'soc_analyst' | 'threat_hunter' | 'incident_commander' | 'admin' | 'malware_analyst';
  promptContent: string;
  systemInstruction: string;
  safetyGuidelines: string[];
  capabilities: string[]; // What this prompt enables
  restrictions: string[]; // What this prompt prevents
  modelCompatibility: string[]; // Which LLM models
  verificationStatus: 'pending' | 'verified' | 'unsafe' | 'archived';
  ratingScore: number;
  usageCount: number;
  downloadCount: number;
  tags: string[];
  exampleUseCases: string[];
  parameterization: {
    threat_level?: 'critical' | 'high' | 'medium' | 'low';
    investigation_depth?: 'basic' | 'detailed' | 'forensic';
    output_format?: 'json' | 'markdown' | 'html' | 'plaintext';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptFeedback {
  id: string;
  promptId: string;
  userId: string;
  rating: number; // 1-5
  usefulness: 'very_useful' | 'useful' | 'neutral' | 'not_useful';
  feedback: string;
  issueSeverity?: 'critical' | 'high' | 'medium' | 'low';
  createdAt: Date;
}

export interface PromptDeployment {
  id: string;
  promptId: string;
  userId: string;
  deployedAt: Date;
  status: 'active' | 'inactive' | 'archived';
  customizations: Record<string, any>;
  executionCount: number;
  successRate: number;
}

// In-memory storage
const prompts: Map<string, AIPrompt> = new Map();
const feedback: Map<string, PromptFeedback[]> = new Map();
const deployments: Map<string, PromptDeployment[]> = new Map();

// Initialize with sample prompts
function initializePrompts() {
  const samplePrompts: AIPrompt[] = [
    {
      id: 'prompt-001',
      name: 'SOC Analyst Assistant - Ransomware Response',
      description: 'Specialized BetterBot instruction set for SOC analysts handling ransomware incidents',
      creatorId: 'user-expert-001',
      createdBy: 'ExperiencedSOCAnalyst',
      version: '2.3.0',
      type: 'soc_analyst',
      industry: 'finance',
      role: 'soc_analyst',
      promptContent: `You are an expert SOC analyst specializing in ransomware incident response.
Your role is to:
1. Analyze malware samples and threat indicators
2. Identify ransomware families and attack patterns
3. Recommend containment and remediation steps
4. Generate timeline of compromise indicators
5. Provide tactical and strategic recommendations

When analyzing ransomware:
- Look for encryption signatures and behavior patterns
- Identify C2 communication patterns
- Track file system modifications
- Analyze backup system interactions
- Document lateral movement techniques`,
      systemInstruction: `Always prioritize containment over investigation. Provide clear, actionable steps.
Be precise with technical details. Cite sources for detection methods.
Consider business impact in all recommendations.`,
      safetyGuidelines: [
        'Do not provide actual ransomware code or payloads',
        'Do not recommend disabling security controls',
        'Always emphasize backup and recovery procedures',
        'Respect confidentiality of client information',
      ],
      capabilities: [
        'Malware analysis guidance',
        'Incident timeline construction',
        'Containment strategy',
        'Recovery planning',
        'IOC identification',
      ],
      restrictions: [
        'Cannot execute code',
        'Cannot access external networks',
        'Cannot modify security policies',
      ],
      modelCompatibility: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      verificationStatus: 'verified',
      ratingScore: 4.9,
      usageCount: 3420,
      downloadCount: 4100,
      tags: ['ransomware', 'incident-response', 'soc', 'finance'],
      exampleUseCases: [
        'Analyzing WannaCry variants',
        'Ryuk incident investigation',
        'Lockbit compromise assessment',
        'Recovery planning for encrypted systems',
      ],
      parameterization: {
        threat_level: 'critical',
        investigation_depth: 'forensic',
        output_format: 'markdown',
      },
      createdAt: new Date('2023-06-01'),
      updatedAt: new Date('2024-01-20'),
    },
    {
      id: 'prompt-002',
      name: 'Healthcare Threat Hunter',
      description: 'Industry-specific prompt for threat hunting in healthcare environments',
      creatorId: 'user-expert-002',
      createdBy: 'HealthcareSecuritySpecialist',
      version: '1.8.0',
      type: 'threat_hunter',
      industry: 'healthcare',
      role: 'threat_hunter',
      promptContent: `You are a threat hunter specializing in healthcare infrastructure.
Focus areas:
1. Medical device security
2. HIPAA compliance monitoring
3. Ransomware targeting hospital systems
4. Patient data exfiltration patterns
5. Insider threat indicators

Healthcare-specific indicators:
- RDP access to clinical systems from unusual locations
- Unusual database queries from non-medical staff
- Lateral movement between clinical and administrative networks
- Encryption operations on shared medical records storage
- VPN access during off-hours with device enrollment changes`,
      systemInstruction: `Prioritize patient safety and data protection. Consider business continuity impact.
Focus on preventive detection. Balance security with clinical workflow.`,
      safetyGuidelines: [
        'Protect patient privacy in all recommendations',
        'Ensure recommendations don\'t disrupt critical medical systems',
        'Consider regulatory requirements (HIPAA, HITRUST)',
        'Escalate potential patient safety issues immediately',
      ],
      capabilities: [
        'Healthcare threat intelligence',
        'Medical device monitoring',
        'HIPAA compliance checks',
        'Clinical system anomaly detection',
        'Insider threat detection',
      ],
      restrictions: [
        'Cannot modify clinical system configurations',
        'Cannot implement without clinical IT approval',
        'Cannot compromise patient care',
      ],
      modelCompatibility: ['claude-3-opus', 'claude-3-sonnet'],
      verificationStatus: 'verified',
      ratingScore: 4.7,
      usageCount: 1850,
      downloadCount: 2300,
      tags: ['healthcare', 'threat-hunting', 'hipaa', 'medical-devices'],
      exampleUseCases: [
        'Ransomware campaign targeting hospitals',
        'Medical device lateral movement detection',
        'Patient data access anomalies',
        'Insider threat identification',
      ],
      parameterization: {
        threat_level: 'high',
        investigation_depth: 'detailed',
        output_format: 'json',
      },
      createdAt: new Date('2023-08-15'),
      updatedAt: new Date('2024-01-18'),
    },
    {
      id: 'prompt-003',
      name: 'Financial Services Incident Commander',
      description: 'Executive-level incident response guidance for financial institutions',
      creatorId: 'user-expert-003',
      createdBy: 'FinanceSecurityLeader',
      version: '2.0.0',
      type: 'incident_responder',
      industry: 'finance',
      role: 'incident_commander',
      promptContent: `You are an incident commander for financial services organizations.
Responsibilities:
1. Strategic incident response planning
2. Executive communication and escalation
3. Regulatory notification requirements
4. Business continuity coordination
5. Third-party and vendor management

Financial-specific considerations:
- SEC/FINRA notification requirements
- Customer notification obligations
- Forensic preservation for legal proceedings
- Payment system continuity
- Treasury and trading system protection`,
      systemInstruction: `Think strategically about business impact. Consider regulatory implications.
Provide both technical and business-level recommendations.
Anticipate executive questions and provide answers.`,
      safetyGuidelines: [
        'Ensure legal compliance with financial regulations',
        'Maintain confidentiality of financial data',
        'Coordinate with legal counsel on disclosures',
        'Consider market impact of public statements',
      ],
      capabilities: [
        'Executive communication strategy',
        'Regulatory requirement navigation',
        'Business continuity planning',
        'Third-party coordination',
        'Legal holds and preservation',
      ],
      restrictions: [
        'Cannot make final regulatory decisions',
        'Cannot commit organization to disclosures',
        'Cannot override legal counsel',
      ],
      modelCompatibility: ['claude-3-opus', 'claude-3-sonnet'],
      verificationStatus: 'verified',
      ratingScore: 4.8,
      usageCount: 950,
      downloadCount: 1200,
      tags: ['finance', 'incident-response', 'executive', 'regulatory'],
      exampleUseCases: [
        'Major breach incident response',
        'Regulatory notification planning',
        'Executive briefing preparation',
        'Third-party risk assessment',
      ],
      parameterization: {
        threat_level: 'critical',
        investigation_depth: 'forensic',
        output_format: 'markdown',
      },
      createdAt: new Date('2023-07-01'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 'prompt-004',
      name: 'Malware Analysis Deep Dive',
      description: 'Detailed malware analysis and reverse engineering assistance',
      creatorId: 'user-expert-004',
      createdBy: 'MalwareAnalysisExpert',
      version: '1.5.0',
      type: 'betterbot_instruction',
      industry: 'general',
      role: 'malware_analyst',
      promptContent: `You are an expert malware analyst specializing in advanced analysis.
Provide guidance on:
1. Static and dynamic analysis techniques
2. Reverse engineering approaches
3. Behavior analysis and pattern recognition
4. Packing and obfuscation detection
5. Attribution indicators

Analytical framework:
- File properties and metadata analysis
- Import table analysis
- String extraction and analysis
- Control flow analysis
- Behavioral monitoring during execution`,
      systemInstruction: `Be technically precise. Provide reproducible analysis methods.
Include indicators of compromise. Consider evasion techniques.`,
      safetyGuidelines: [
        'Do not provide working malware samples',
        'Always recommend sandboxed analysis',
        'Emphasize safety precautions for dynamic analysis',
        'Consider environmental damage from malware execution',
      ],
      capabilities: [
        'Static analysis guidance',
        'Dynamic analysis recommendations',
        'Packing detection',
        'IOC extraction',
        'Family classification',
        'Attribution analysis',
      ],
      restrictions: [
        'Cannot execute malware',
        'Cannot provide functional exploit code',
        'Cannot bypass security controls',
      ],
      modelCompatibility: ['claude-3-opus'],
      verificationStatus: 'verified',
      ratingScore: 4.6,
      usageCount: 2100,
      downloadCount: 2850,
      tags: ['malware-analysis', 'reverse-engineering', 'advanced'],
      exampleUseCases: [
        'APT malware family analysis',
        'Ransomware variant assessment',
        'Zero-day behavior analysis',
        'Trojan IOC extraction',
      ],
      parameterization: {
        threat_level: 'high',
        investigation_depth: 'forensic',
        output_format: 'markdown',
      },
      createdAt: new Date('2023-09-10'),
      updatedAt: new Date('2024-01-12'),
    },
  ];

  for (const prompt of samplePrompts) {
    prompts.set(prompt.id, prompt);
    feedback.set(prompt.id, []);
    deployments.set(prompt.id, []);
  }
}

initializePrompts();

/**
 * GET /api/marketplace/prompts
 * List AI prompts/agents
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const industry = searchParams.get('industry');
    const role = searchParams.get('role');
    const type = searchParams.get('type');
    const verified = searchParams.get('verified') === 'true';
    const search = searchParams.get('search')?.toLowerCase();

    let result = Array.from(prompts.values());

    if (industry) {
      result = result.filter(p => p.industry === industry || p.industry === 'general');
    }

    if (role) {
      result = result.filter(p => p.role === role);
    }

    if (type) {
      result = result.filter(p => p.type === type);
    }

    if (verified) {
      result = result.filter(p => p.verificationStatus === 'verified');
    }

    if (search) {
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search) ||
          p.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    result.sort((a, b) => b.downloadCount - a.downloadCount);

    const total = result.length;
    const startIdx = (page - 1) * limit;
    const paginatedResults = result.slice(startIdx, startIdx + limit);

    return NextResponse.json({
      success: true,
      data: {
        prompts: paginatedResults,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        industries: ['healthcare', 'finance', 'retail', 'manufacturing', 'government', 'education', 'general'],
        roles: ['soc_analyst', 'threat_hunter', 'incident_commander', 'admin', 'malware_analyst'],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketplace/prompts
 * Submit a new prompt
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      creatorId,
      createdBy,
      type,
      industry,
      role,
      promptContent,
      systemInstruction,
      capabilities,
    } = body;

    if (!name || !description || !creatorId || !promptContent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const promptId = `prompt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newPrompt: AIPrompt = {
      id: promptId,
      name,
      description,
      creatorId,
      createdBy: createdBy || creatorId,
      version: '1.0.0',
      type: type || 'betterbot_instruction',
      industry: industry || 'general',
      role: role || 'admin',
      promptContent,
      systemInstruction: systemInstruction || '',
      safetyGuidelines: [],
      capabilities: capabilities || [],
      restrictions: [],
      modelCompatibility: ['claude-3-opus', 'claude-3-sonnet'],
      verificationStatus: 'pending',
      ratingScore: 0,
      usageCount: 0,
      downloadCount: 0,
      tags: [],
      exampleUseCases: [],
      parameterization: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prompts.set(promptId, newPrompt);
    feedback.set(promptId, []);
    deployments.set(promptId, []);

    return NextResponse.json(
      {
        success: true,
        data: newPrompt,
        message: 'Prompt submitted for verification',
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create prompt' },
      { status: 400 }
    );
  }
}

/**
 * POST /api/marketplace/prompts/:promptId/feedback
 * Submit feedback on a prompt
 */
export async function POST_FEEDBACK(request: NextRequest) {
  try {
    const promptId = request.nextUrl.pathname.split('/')[4];
    const { userId, rating, usefulness, feedbackText, issueSeverity } = await request.json();

    if (!promptId || !userId || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    const prompt = prompts.get(promptId);
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    const newFeedback: PromptFeedback = {
      id: `feedback-${Date.now()}`,
      promptId,
      userId,
      rating,
      usefulness: usefulness || 'neutral',
      feedback: feedbackText || '',
      issueSeverity,
      createdAt: new Date(),
    };

    if (!feedback.has(promptId)) {
      feedback.set(promptId, []);
    }

    feedback.get(promptId)!.push(newFeedback);

    const feedbackList = feedback.get(promptId) || [];
    prompt.ratingScore =
      Math.round((feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length) * 10) / 10;

    return NextResponse.json({
      success: true,
      data: newFeedback,
      message: 'Feedback submitted',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to submit feedback' },
      { status: 400 }
    );
  }
}

/**
 * POST /api/marketplace/prompts/:promptId/deploy
 * Deploy a prompt
 */
export async function POST_DEPLOY(request: NextRequest) {
  try {
    const promptId = request.nextUrl.pathname.split('/')[4];
    const { userId, customizations } = await request.json();

    if (!promptId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const prompt = prompts.get(promptId);
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    const deployment: PromptDeployment = {
      id: `deploy-${Date.now()}`,
      promptId,
      userId,
      deployedAt: new Date(),
      status: 'active',
      customizations: customizations || {},
      executionCount: 0,
      successRate: 0,
    };

    if (!deployments.has(promptId)) {
      deployments.set(promptId, []);
    }

    deployments.get(promptId)!.push(deployment);
    prompt.usageCount++;
    prompt.downloadCount++;

    return NextResponse.json(
      {
        success: true,
        data: deployment,
        message: 'Prompt deployed successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to deploy prompt' },
      { status: 400 }
    );
  }
}
