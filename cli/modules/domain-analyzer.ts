/**
 * BlockStop Domain Analysis
 * Domain reputation and phishing pattern detection
 */

export interface DomainAnalysis {
  domain: string;
  registered: boolean;
  age: number | null; // Days
  suspiciousPatterns: string[];
  riskScore: number;
  indicators: {
    isShortener: boolean;
    hasHighEntropy: boolean;
    isIDN: boolean;
    hasHomographChars: boolean;
    isIP: boolean;
    isFreshDomain: boolean;
    hasUnusualDepth: boolean;
  };
}

const HOMOGRAPH_CHARS: Record<string, string> = {
  а: 'a',
  е: 'e',
  о: 'o',
  р: 'p',
  с: 'c',
  у: 'u',
  х: 'x',
  у: 'y',
  ё: 'e',
  і: 'i',
};

const SUSPICIOUS_TLDS = ['.tk', '.ml', '.ga', '.cf', '.gq'];

const SHORTENER_DOMAINS = [
  'bit.ly',
  'tinyurl.com',
  'goo.gl',
  'ow.ly',
  'short.link',
  'rebrand.ly',
  'buff.ly',
  'adf.ly',
  'youtu.be',
  'is.gd',
  'tr.im',
  'tiny.cc',
  'shorte.st',
  'u.to',
];

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    // Try to extract domain manually
    const match = url.match(/https?:\/\/([^/?#]+)/i);
    return match ? match[1] : null;
  }
}

/**
 * Check if domain is URL shortener
 */
export function isShortener(domain: string): boolean {
  const cleanDomain = domain.toLowerCase().replace('www.', '');
  return SHORTENER_DOMAINS.some(shortener => cleanDomain === shortener || cleanDomain.endsWith('.' + shortener));
}

/**
 * Check if URL is IP-based
 */
export function isIPAddress(domain: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([\da-f]{1,4}:){7}[\da-f]{1,4}$/i;

  return ipv4Regex.test(domain) || ipv6Regex.test(domain);
}

/**
 * Detect International Domain Names (IDN)
 */
export function isIDN(domain: string): boolean {
  return /[^\x00-\x7F]/.test(domain);
}

/**
 * Detect homograph attack patterns
 */
export function detectHomographAttack(domain: string): boolean {
  // Check for Cyrillic characters that look like Latin
  for (const [cyrillic, latin] of Object.entries(HOMOGRAPH_CHARS)) {
    if (domain.includes(cyrillic)) {
      return true;
    }
  }

  // Check for mixed alphabets
  const hasCyrillic = /[а-яёіґє]/i.test(domain);
  const hasLatin = /[a-z]/i.test(domain);
  const hasGreek = /[α-ω]/i.test(domain);

  return (hasCyrillic && hasLatin) || (hasGreek && hasLatin);
}

/**
 * Calculate domain name entropy (randomness)
 * High entropy suggests obfuscation or generated domains
 */
export function calculateEntropy(domain: string): number {
  const cleanDomain = domain.replace(/[^a-z0-9]/gi, '');

  if (cleanDomain.length < 3) {
    return 0;
  }

  const frequency: Record<string, number> = {};

  for (const char of cleanDomain.toLowerCase()) {
    frequency[char] = (frequency[char] || 0) + 1;
  }

  let entropy = 0;
  for (const freq of Object.values(frequency)) {
    const p = freq / cleanDomain.length;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

/**
 * Detect unusual subdomain depth
 */
export function hasUnusualSubdomainDepth(domain: string): boolean {
  const parts = domain.split('.');

  // More than 4 levels is suspicious
  if (parts.length > 4) {
    return true;
  }

  // Check for excessively long subdomains
  for (const part of parts) {
    if (part.length > 50) {
      return true;
    }
  }

  return false;
}

/**
 * Detect domain age (simple heuristic)
 */
export function estimateDomainAge(domain: string): number | null {
  // This is a placeholder - real implementation would use WHOIS data
  // Check if domain looks newly registered based on patterns
  const randomPattern = /[a-z]{10,}\.tk|[0-9]{5,}\.ga/i;

  if (randomPattern.test(domain)) {
    return 0; // Likely very new
  }

  return null; // Unknown
}

/**
 * Check for suspicious character patterns
 */
export function hasSuspiciousCharacters(domain: string): string[] {
  const suspicions: string[] = [];

  // Check for multiple hyphens
  if ((domain.match(/-/g) || []).length > 2) {
    suspicions.push('Multiple hyphens in domain');
  }

  // Check for repeated characters
  if (/(.)\1{3,}/.test(domain)) {
    suspicions.push('Repeated characters in domain');
  }

  // Check for numbers in suspicious patterns
  if (/[0-9]{4,}/.test(domain)) {
    suspicions.push('Long sequence of numbers');
  }

  // Check for confusing number/letter combinations
  if (/[1l]|[0o]|[5s]|[8b]/i.test(domain)) {
    suspicions.push('Confusing character combinations');
  }

  return suspicions;
}

/**
 * Detect typosquatting patterns
 */
export function detectTyposquatting(domain: string, targetBrands: string[] = []): string[] {
  const commonBrands = [
    'amazon',
    'apple',
    'google',
    'microsoft',
    'facebook',
    'twitter',
    'paypal',
    'bank',
    'login',
    'account',
  ];

  const brands = [...commonBrands, ...targetBrands];
  const suspicions: string[] = [];

  brands.forEach(brand => {
    // Missing character
    if (domain.includes(brand.slice(0, -1)) && !domain.includes(brand)) {
      suspicions.push(`Possible typosquat: ${brand}`);
    }

    // One character different
    const brandRegex = new RegExp(brand.split('').join('.{0,2}'), 'i');
    if (brandRegex.test(domain) && domain !== brand) {
      suspicions.push(`Possible typosquat: ${brand}`);
    }

    // Same domain with different TLD
    if (domain.split('.')[0].toLowerCase() === brand.toLowerCase()) {
      suspicions.push(`Same domain, different TLD: ${brand}`);
    }
  });

  return suspicions;
}

/**
 * Check for suspicious TLDs
 */
export function checkSuspiciousTLD(domain: string): boolean {
  return SUSPICIOUS_TLDS.some(tld => domain.toLowerCase().endsWith(tld));
}

/**
 * Comprehensive domain analysis
 */
export function analyzeDomain(domain: string): DomainAnalysis {
  let riskScore = 0;
  const suspiciousPatterns: string[] = [];

  // Check if shortener
  const isShortenerDomain = isShortener(domain);
  if (isShortenerDomain) {
    riskScore += 20;
    suspiciousPatterns.push('URL shortener service');
  }

  // Check if IP
  const isIP = isIPAddress(domain);
  if (isIP) {
    riskScore += 25;
    suspiciousPatterns.push('IP-based domain');
  }

  // Check for homograph attack
  const hasHomograph = detectHomographAttack(domain);
  if (hasHomograph) {
    riskScore += 30;
    suspiciousPatterns.push('Homograph attack characters');
  }

  // Check entropy
  const entropy = calculateEntropy(domain);
  const highEntropy = entropy > 4.2;
  if (highEntropy) {
    riskScore += 15;
    suspiciousPatterns.push('High entropy domain name');
  }

  // Check IDN
  const isIDNDomain = isIDN(domain);
  if (isIDNDomain) {
    riskScore += 10;
    suspiciousPatterns.push('International Domain Name');
  }

  // Check subdomain depth
  const unusualDepth = hasUnusualSubdomainDepth(domain);
  if (unusualDepth) {
    riskScore += 10;
    suspiciousPatterns.push('Unusual subdomain depth');
  }

  // Check suspicious TLD
  if (checkSuspiciousTLD(domain)) {
    riskScore += 15;
    suspiciousPatterns.push('Suspicious TLD');
  }

  // Check suspicious characters
  const charSuspicions = hasSuspiciousCharacters(domain);
  suspiciousPatterns.push(...charSuspicions);
  riskScore += charSuspicions.length * 5;

  // Estimate domain age
  const age = estimateDomainAge(domain);
  const isFresh = age !== null && age < 30;
  if (isFresh) {
    riskScore += 10;
    suspiciousPatterns.push('Newly registered domain');
  }

  riskScore = Math.min(riskScore, 100);

  return {
    domain,
    registered: !suspiciousPatterns.includes('Newly registered domain'),
    age: age,
    suspiciousPatterns,
    riskScore,
    indicators: {
      isShortener: isShortenerDomain,
      hasHighEntropy: highEntropy,
      isIDN: isIDNDomain,
      hasHomographChars: hasHomograph,
      isIP: isIP,
      isFreshDomain: isFresh,
      hasUnusualDepth: unusualDepth,
    },
  };
}

export const DOMAIN_ANALYZER = {
  extractDomain,
  isShortener,
  isIPAddress,
  isIDN,
  detectHomographAttack,
  calculateEntropy,
  hasUnusualSubdomainDepth,
  estimateDomainAge,
  hasSuspiciousCharacters,
  detectTyposquatting,
  checkSuspiciousTLD,
  analyzeDomain,
};
