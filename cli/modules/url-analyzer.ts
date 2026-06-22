/**
 * BlockStop URL Analyzer
 * URL reputation checking and phishing detection
 */

import * as DomainAnalyzer from './domain-analyzer.js';

export interface URLAnalysisResult {
  url: string;
  domain: string;
  domainAnalysis: DomainAnalyzer.DomainAnalysis;
  pathAnalysis: PathAnalysis;
  schemeAnalysis: SchemeAnalysis;
  certificateWarnings: string[];
  riskScore: number;
  riskLevel: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  threats: URLThreat[];
  recommendation: string;
  timestamp: string;
}

export interface PathAnalysis {
  path: string;
  parameters: Record<string, string>;
  suspiciousIndicators: string[];
  riskScore: number;
}

export interface SchemeAnalysis {
  scheme: string;
  isSecure: boolean;
  warnings: string[];
}

export interface URLThreat {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

const COMMON_PHISHING_PATHS = [
  'account',
  'login',
  'signin',
  'authenticate',
  'verify',
  'confirm',
  'update',
  'security',
  'billing',
  'payment',
  'unlock',
];

const DATA_EXFIL_HOSTS = [
  'pastebin.com',
  'github.com',
  'gist.github.com',
  'dropbox.com',
  'drive.google.com',
  'onedrive.com',
  'mega.nz',
  'mediafire.com',
  'wetransfer.com',
];

const SUSPICIOUS_PARAMS = ['redirect', 'return', 'callback', 'email', 'user', 'pass', 'token', 'session'];

/**
 * Parse URL components
 */
export function parseURL(urlString: string): {
  url: URL | null;
  domain: string | null;
  path: string;
  parameters: Record<string, string>;
} {
  try {
    const url = new URL(urlString);
    const parameters: Record<string, string> = {};

    url.searchParams.forEach((value, key) => {
      parameters[key] = value;
    });

    return {
      url,
      domain: url.hostname,
      path: url.pathname,
      parameters,
    };
  } catch (e) {
    return {
      url: null,
      domain: null,
      path: '',
      parameters: {},
    };
  }
}

/**
 * Analyze URL path for suspicious patterns
 */
export function analyzeURLPath(path: string, domain: string): PathAnalysis {
  const indicators: string[] = [];
  let riskScore = 0;

  const lowerPath = path.toLowerCase();

  // Check for phishing keywords
  COMMON_PHISHING_PATHS.forEach(keyword => {
    if (lowerPath.includes(keyword)) {
      indicators.push(`Phishing keyword in path: ${keyword}`);
      riskScore += 10;
    }
  });

  // Check for encoded characters (potential obfuscation)
  if (/%[0-9a-f]{2}/i.test(path)) {
    indicators.push('URL-encoded characters in path');
    riskScore += 5;
  }

  // Check for unusual path depth
  const pathParts = path.split('/').filter(p => p);
  if (pathParts.length > 5) {
    indicators.push('Unusual path depth');
    riskScore += 5;
  }

  // Check for parameter injection attempts
  if (/['";]|<script|javascript:|onerror=/i.test(path)) {
    indicators.push('Possible injection attempt');
    riskScore += 20;
  }

  return {
    path,
    parameters: {},
    suspiciousIndicators: indicators,
    riskScore: Math.min(riskScore, 100),
  };
}

/**
 * Analyze URL scheme and security
 */
export function analyzeScheme(urlString: string): SchemeAnalysis {
  const warnings: string[] = [];
  let isSecure = false;

  try {
    const url = new URL(urlString);
    const scheme = url.protocol.replace(':', '');

    if (scheme === 'https') {
      isSecure = true;
    } else if (scheme === 'http') {
      warnings.push('Insecure HTTP connection');
    } else if (scheme === 'ftp') {
      warnings.push('FTP protocol (no encryption)');
    } else if (!['http', 'https', 'ftp'].includes(scheme)) {
      warnings.push(`Unusual scheme: ${scheme}`);
    }

    return {
      scheme,
      isSecure,
      warnings,
    };
  } catch (e) {
    return {
      scheme: 'unknown',
      isSecure: false,
      warnings: ['Unable to parse URL scheme'],
    };
  }
}

/**
 * Check for data exfiltration services
 */
export function isDataExfiltrationService(domain: string): boolean {
  return DATA_EXFIL_HOSTS.some(host => domain.toLowerCase().includes(host));
}

/**
 * Detect suspicious URL parameters
 */
export function detectSuspiciousParameters(parameters: Record<string, string>): { suspicious: boolean; issues: string[] } {
  const issues: string[] = [];

  Object.entries(parameters).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();

    // Check suspicious parameter names
    if (SUSPICIOUS_PARAMS.some(param => lowerKey.includes(param))) {
      if (value.length > 100) {
        issues.push(`Long value for parameter: ${key}`);
      }
      if (/[<>"'%;]|<script|javascript:/i.test(value)) {
        issues.push(`Potentially malicious value in parameter: ${key}`);
      }
    }

    // Check for encoding that might hide malicious content
    if (value.includes('%') || value.includes('&#')) {
      issues.push(`Encoded value in parameter: ${key}`);
    }
  });

  return {
    suspicious: issues.length > 0,
    issues,
  };
}

/**
 * Generate comprehensive URL analysis
 */
export function analyzeURL(urlString: string): URLAnalysisResult {
  const threats: URLThreat[] = [];
  let riskScore = 0;

  // Validate and parse URL
  const parsed = parseURL(urlString);

  if (!parsed.url || !parsed.domain) {
    return {
      url: urlString,
      domain: 'invalid',
      domainAnalysis: {
        domain: 'invalid',
        registered: false,
        age: null,
        suspiciousPatterns: ['Invalid URL format'],
        riskScore: 95,
        indicators: {
          isShortener: false,
          hasHighEntropy: false,
          isIDN: false,
          hasHomographChars: false,
          isIP: false,
          isFreshDomain: false,
          hasUnusualDepth: false,
        },
      },
      pathAnalysis: {
        path: '',
        parameters: {},
        suspiciousIndicators: [],
        riskScore: 0,
      },
      schemeAnalysis: {
        scheme: 'unknown',
        isSecure: false,
        warnings: ['Invalid URL'],
      },
      certificateWarnings: [],
      riskScore: 95,
      riskLevel: 'CRITICAL',
      threats: [
        {
          type: 'INVALID_URL',
          severity: 'CRITICAL',
          description: 'URL could not be parsed',
        },
      ],
      recommendation: 'Do not visit. Invalid URL format.',
      timestamp: new Date().toISOString(),
    };
  }

  // Domain analysis
  const domainAnalysis = DomainAnalyzer.analyzeDomain(parsed.domain);
  riskScore += domainAnalysis.riskScore * 0.4; // Domain is 40% of score

  if (domainAnalysis.riskScore >= 60) {
    threats.push({
      type: 'SUSPICIOUS_DOMAIN',
      severity: 'HIGH',
      description: `Domain has suspicious characteristics: ${domainAnalysis.suspiciousPatterns.slice(0, 2).join(', ')}`,
    });
  }

  // Path analysis
  const pathAnalysis = analyzeURLPath(parsed.path, parsed.domain);
  riskScore += pathAnalysis.riskScore * 0.3; // Path is 30% of score

  if (pathAnalysis.riskScore >= 50) {
    threats.push({
      type: 'SUSPICIOUS_PATH',
      severity: 'MEDIUM',
      description: `URL path contains suspicious patterns`,
    });
  }

  // Scheme analysis
  const schemeAnalysis = analyzeScheme(urlString);
  if (!schemeAnalysis.isSecure) {
    riskScore += 15; // Unsecure is 15% of score
    threats.push({
      type: 'INSECURE_SCHEME',
      severity: 'MEDIUM',
      description: schemeAnalysis.warnings[0] || 'Insecure protocol',
    });
  }

  // Parameter analysis
  const paramAnalysis = detectSuspiciousParameters(parsed.parameters);
  if (paramAnalysis.suspicious) {
    riskScore += 10;
    threats.push({
      type: 'SUSPICIOUS_PARAMETERS',
      severity: 'MEDIUM',
      description: paramAnalysis.issues[0],
    });
  }

  // Check for data exfiltration
  if (isDataExfiltrationService(parsed.domain)) {
    riskScore += 20;
    threats.push({
      type: 'DATA_EXFILTRATION',
      severity: 'HIGH',
      description: 'Domain is known for data exfiltration',
    });
  }

  riskScore = Math.min(riskScore, 100);

  // Determine risk level
  let riskLevel: URLAnalysisResult['riskLevel'] = 'SAFE';
  if (riskScore <= 10) riskLevel = 'SAFE';
  else if (riskScore <= 30) riskLevel = 'LOW';
  else if (riskScore <= 60) riskLevel = 'MEDIUM';
  else if (riskScore <= 85) riskLevel = 'HIGH';
  else riskLevel = 'CRITICAL';

  // Generate recommendation
  let recommendation = 'This URL appears safe to visit.';
  if (riskLevel === 'LOW') {
    recommendation = 'Exercise caution with this URL.';
  } else if (riskLevel === 'MEDIUM') {
    recommendation = 'This URL has suspicious characteristics. Verify before clicking.';
  } else if (riskLevel === 'HIGH') {
    recommendation = 'This URL appears to be malicious. Do not click.';
  } else if (riskLevel === 'CRITICAL') {
    recommendation = 'This URL is definitely malicious. Do not interact with it.';
  }

  return {
    url: urlString,
    domain: parsed.domain,
    domainAnalysis,
    pathAnalysis,
    schemeAnalysis,
    certificateWarnings: schemeAnalysis.warnings,
    riskScore,
    riskLevel,
    threats,
    recommendation,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Batch analyze multiple URLs
 */
export function analyzeMultipleURLs(urls: string[]): URLAnalysisResult[] {
  return urls.map(url => analyzeURL(url));
}

/**
 * Format URL analysis for display
 */
export function formatAnalysis(result: URLAnalysisResult): string {
  let output = '';

  output += '🔗 URL Security Analysis\n';
  output += '='.repeat(50) + '\n\n';

  output += 'URL:     ' + result.url + '\n';
  output += 'Domain:  ' + result.domain + '\n';
  output += 'Scheme:  ' + result.schemeAnalysis.scheme + '\n\n';

  // Domain analysis
  output += 'Domain Analysis:\n';
  output += '  Risk Score:     ' + result.domainAnalysis.riskScore + '/100\n';
  if (result.domainAnalysis.suspiciousPatterns.length > 0) {
    output += '  Issues:         ' + result.domainAnalysis.suspiciousPatterns.join(', ') + '\n';
  }
  output += '\n';

  // Threats
  if (result.threats.length > 0) {
    output += 'Detected Threats:\n';
    result.threats.forEach(threat => {
      output += `  [${threat.severity}] ${threat.type}\n`;
      output += `    ${threat.description}\n`;
    });
    output += '\n';
  }

  // Risk assessment
  output += 'Risk Assessment:\n';
  output += '  Score: ' + result.riskScore + '/100\n';
  output += '  Level: ' + result.riskLevel + '\n\n';

  // Recommendation
  output += 'Recommendation:\n';
  output += '  ' + result.recommendation + '\n';

  return output;
}

export const URL_ANALYZER = {
  parseURL,
  analyzeURLPath,
  analyzeScheme,
  isDataExfiltrationService,
  detectSuspiciousParameters,
  analyzeURL,
  analyzeMultipleURLs,
  formatAnalysis,
};
