/**
 * BlockStop Email Utilities
 * MIME parsing, header extraction, and email validation
 */

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailHeader {
  [key: string]: string | string[];
}

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  contentTransferEncoding: string;
  size: number;
  threat?: {
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    reason: string;
  };
}

export interface EmailPart {
  contentType: string;
  contentTransferEncoding: string;
  headers: EmailHeader;
  body: string;
  boundary?: string;
  parts?: EmailPart[];
}

/**
 * RFC 5322 compliant email regex
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Validate email address format
 */
export function validateEmailAddress(email: string): boolean {
  if (!email || email.length > 254) {
    return false;
  }

  return EMAIL_REGEX.test(email);
}

/**
 * Parse email address with name
 */
export function parseEmailAddress(addressString: string): EmailAddress | null {
  // Format: "Name <email@example.com>" or "email@example.com"
  const match = /^(?:"?([^"<]*)?"?\s*<([^>]+)>|([^\s@]+@[^\s@]+))$/.exec(addressString.trim());

  if (!match) {
    return null;
  }

  let email = '';
  let name: string | undefined;

  if (match[2]) {
    email = match[2].trim();
    name = match[1]?.trim();
  } else if (match[3]) {
    email = match[3].trim();
  }

  if (!validateEmailAddress(email)) {
    return null;
  }

  return { email, name: name || undefined };
}

/**
 * Extract all headers from raw email
 */
export function extractEmailHeaders(rawEmail: string): EmailHeader {
  const headers: EmailHeader = {};
  const headerSection = rawEmail.split('\n\n')[0];

  if (!headerSection) {
    return headers;
  }

  // Split headers respecting line continuations
  let currentHeader = '';
  headerSection.split('\n').forEach(line => {
    if (line.match(/^[\s\t]/) && currentHeader) {
      // Continuation of previous header
      const lastKey = Object.keys(headers)[Object.keys(headers).length - 1];
      if (lastKey) {
        const current = headers[lastKey];
        if (Array.isArray(current)) {
          current[current.length - 1] += ' ' + line.trim();
        } else {
          headers[lastKey] = String(current) + ' ' + line.trim();
        }
      }
    } else if (line.includes(':')) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      const lowerKey = key.toLowerCase();

      if (headers[lowerKey]) {
        if (Array.isArray(headers[lowerKey])) {
          (headers[lowerKey] as string[]).push(value);
        } else {
          headers[lowerKey] = [String(headers[lowerKey]), value];
        }
      } else {
        headers[lowerKey] = value;
      }

      currentHeader = lowerKey;
    }
  });

  return headers;
}

/**
 * Get single header value
 */
export function getHeaderValue(headers: EmailHeader, name: string): string | null {
  const value = headers[name.toLowerCase()];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value ? String(value) : null;
}

/**
 * Get all header values as array
 */
export function getHeaderValues(headers: EmailHeader, name: string): string[] {
  const value = headers[name.toLowerCase()];

  if (Array.isArray(value)) {
    return value;
  }

  return value ? [String(value)] : [];
}

/**
 * Extract URLs from email content
 */
export function extractURLs(content: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]*)/gi;
  const matches = content.match(urlRegex) || [];

  // Remove duplicates
  return [...new Set(matches)];
}

/**
 * Detect shortener URLs
 */
export function checkShorteners(url: string): boolean {
  const shortenerDomains = [
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
  ];

  const urlObj = new URL(url);
  const domain = urlObj.hostname.toLowerCase();

  return shortenerDomains.some(shortener => domain.includes(shortener.replace('www.', '')));
}

/**
 * Parse MIME content type header
 */
export function parseMimeType(contentType: string): { type: string; subtype: string; params: Record<string, string> } {
  const [mainType, ...rest] = contentType.split(';').map(s => s.trim());
  const [type, subtype] = mainType.split('/');

  const params: Record<string, string> = {};
  rest.forEach(param => {
    const [key, value] = param.split('=');
    if (key && value) {
      params[key.trim()] = value.replace(/^"(.*)"$/, '$1');
    }
  });

  return { type: type || '', subtype: subtype || '', params };
}

/**
 * Extract MIME parts from multipart email
 */
export function extractMIMEParts(rawEmail: string): EmailPart | null {
  const headers = extractEmailHeaders(rawEmail);
  const contentType = getHeaderValue(headers, 'content-type') || 'text/plain';
  const { params } = parseMimeType(contentType);
  const boundary = params.boundary;

  const [headerSection, ...bodyParts] = rawEmail.split('\n\n');
  const body = bodyParts.join('\n\n');

  const part: EmailPart = {
    contentType,
    contentTransferEncoding: getHeaderValue(headers, 'content-transfer-encoding') || '7bit',
    headers,
    body,
    boundary,
    parts: [],
  };

  if (boundary) {
    const boundaryRegex = new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:--)?`, 'g');
    const sections = body.split(boundaryRegex).filter(s => s.trim() && !s.startsWith('--'));

    part.parts = sections
      .map(section => {
        const [partHeader, ...partBodyParts] = section.split('\n\n');
        const partBody = partBodyParts.join('\n\n');

        if (!partHeader || !partBody) {
          return null;
        }

        const partHeaders = extractEmailHeaders(partHeader + '\n\n' + partBody);
        const partContentType = getHeaderValue(partHeaders, 'content-type') || 'text/plain';

        return {
          contentType: partContentType,
          contentTransferEncoding: getHeaderValue(partHeaders, 'content-transfer-encoding') || '7bit',
          headers: partHeaders,
          body: partBody.trim(),
        };
      })
      .filter((p): p is EmailPart => p !== null);
  }

  return part;
}

/**
 * Detect file attachments and their types
 */
export function detectAttachments(emailPart: EmailPart): EmailAttachment[] {
  const attachments: EmailAttachment[] = [];

  if (!emailPart.parts) {
    return attachments;
  }

  const dangerousExtensions = [
    'exe',
    'dll',
    'scr',
    'bat',
    'cmd',
    'com',
    'pif',
    'msi',
    'app',
    'deb',
    'sh',
    'ps1',
    'vbs',
    'js',
    'jar',
    'zip',
    'rar',
    '7z',
  ];
  const dangerousMimeTypes = [
    'application/x-msdownload',
    'application/x-msdos-program',
    'application/x-executable',
    'application/x-elf',
    'application/x-sharedlib',
    'application/x-shellscript',
  ];

  emailPart.parts.forEach(part => {
    const contentDisposition = getHeaderValue(part.headers, 'content-disposition') || '';
    const { params } = parseMimeType(contentDisposition);
    const filename = params.filename || '';

    if (filename && contentDisposition.includes('attachment')) {
      const ext = filename.split('.').pop()?.toLowerCase() || '';
      const isDangerous = dangerousExtensions.includes(ext) || dangerousMimeTypes.includes(part.contentType);

      const attachment: EmailAttachment = {
        filename,
        mimeType: part.contentType,
        contentTransferEncoding: part.contentTransferEncoding,
        size: part.body.length,
      };

      if (isDangerous) {
        attachment.threat = {
          type: 'DANGEROUS_ATTACHMENT',
          severity: 'HIGH',
          reason: `File type ${ext} is potentially dangerous`,
        };
      }

      attachments.push(attachment);
    }
  });

  return attachments;
}

/**
 * Analyze SPF record
 */
export function analyzeSPF(headers: EmailHeader): { valid: boolean; passes: string[] } {
  const receivedHeader = getHeaderValue(headers, 'received') || '';

  // Check for SPF pass indicators
  const spfPasses = receivedHeader.match(/spf=pass/gi) || [];
  const authResults = getHeaderValue(headers, 'authentication-results') || '';
  const authSpf = authResults.match(/spf\s*=\s*pass/gi) || [];

  const passes = [...spfPasses, ...authSpf];
  return {
    valid: passes.length > 0,
    passes,
  };
}

/**
 * Analyze DKIM signature
 */
export function analyzeDKIM(headers: EmailHeader): { valid: boolean; signatures: string[] } {
  const dkimSignature = getHeaderValues(headers, 'dkim-signature') || [];
  const authResults = getHeaderValue(headers, 'authentication-results') || '';
  const dkimPasses = authResults.match(/dkim\s*=\s*pass/gi) || [];

  return {
    valid: dkimPasses.length > 0,
    signatures: dkimSignature,
  };
}

/**
 * Analyze DMARC policy
 */
export function analyzeDMARC(headers: EmailHeader): { compliant: boolean; dmarc: string; policy?: string } {
  const authResults = getHeaderValue(headers, 'authentication-results') || '';
  const dmarcMatch = authResults.match(/dmarc\s*=\s*(\w+)/i);
  const dmarc = dmarcMatch?.[1] || 'none';
  const policyMatch = authResults.match(/dmarc\.policy\s*=\s*(\w+)/i);
  const policy = policyMatch?.[1];

  return {
    compliant: dmarc === 'pass',
    dmarc,
    policy,
  };
}

/**
 * Check for suspicious authentication headers
 */
export function analyzeSuspiciousHeaders(headers: EmailHeader): string[] {
  const issues: string[] = [];

  // Check for missing authentication
  if (!getHeaderValue(headers, 'dkim-signature')) {
    issues.push('Missing DKIM signature');
  }

  if (!getHeaderValue(headers, 'authentication-results')) {
    issues.push('Missing authentication results');
  }

  // Check for header injection attempts
  const fromHeader = getHeaderValue(headers, 'from') || '';
  if (fromHeader.includes('\n') || fromHeader.includes('\r')) {
    issues.push('Header injection detected in From');
  }

  const replyToHeader = getHeaderValue(headers, 'reply-to') || '';
  if (replyToHeader && (replyToHeader.includes('\n') || replyToHeader.includes('\r'))) {
    issues.push('Header injection detected in Reply-To');
  }

  // Check for spoofed domains
  const from = parseEmailAddress(fromHeader);
  const returnPath = getHeaderValue(headers, 'return-path') || '';
  const returnPathEmail = parseEmailAddress(returnPath);

  if (from && returnPathEmail && from.email !== returnPathEmail.email) {
    const fromDomain = from.email.split('@')[1];
    const returnPathDomain = returnPathEmail.email.split('@')[1];

    if (fromDomain !== returnPathDomain) {
      issues.push('Domain mismatch between From and Return-Path');
    }
  }

  return issues;
}

export const EMAIL_UTILS = {
  validateEmailAddress,
  parseEmailAddress,
  extractEmailHeaders,
  getHeaderValue,
  getHeaderValues,
  extractURLs,
  checkShorteners,
  parseMimeType,
  extractMIMEParts,
  detectAttachments,
  analyzeSPF,
  analyzeDKIM,
  analyzeDMARC,
  analyzeSuspiciousHeaders,
};
