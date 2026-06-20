import type {
  User,
  EmailAnalysisRequest,
  EmailAnalysisResult,
  LinkCheckResult,
  FileAnalysisResult,
} from './types';

export class BlockStopAPI {
  private apiUrl = 'https://api.blockstop.io';
  private authToken: string | null = null;

  async authenticate(email: string): Promise<User> {
    const response = await fetch(`${this.apiUrl}/api/auth/oauth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) throw new Error('Authentication failed');
    const user = await response.json();
    this.authToken = user.token;
    return user;
  }

  async scanEmail(request: EmailAnalysisRequest): Promise<EmailAnalysisResult> {
    const response = await fetch(`${this.apiUrl}/api/extension/scan/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) throw new Error('Email scan failed');
    return response.json();
  }

  async checkLink(url: string): Promise<LinkCheckResult> {
    const response = await fetch(`${this.apiUrl}/api/extension/scan/link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) throw new Error('Link check failed');
    return response.json();
  }

  async scanFile(file: File): Promise<FileAnalysisResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.apiUrl}/api/extension/scan/file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
      },
      body: formData,
    });

    if (!response.ok) throw new Error('File scan failed');
    return response.json();
  }

  async getConfig() {
    const response = await fetch(`${this.apiUrl}/api/extension/config`, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
      },
    });

    if (!response.ok) throw new Error('Config fetch failed');
    return response.json();
  }
}
