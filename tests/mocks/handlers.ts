/**
 * Mock Service Worker Handlers
 *
 * Defines API request handlers for testing without making real API calls.
 * Uses MSW to intercept and mock HTTP requests.
 */

import { http, HttpResponse } from 'msw';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Mock user data
 */
const mockUsers = {
  'test@example.com': {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: true,
    tier: 'pro',
    createdAt: new Date().toISOString(),
  },
};

/**
 * Mock team data
 */
const mockTeams = {
  'team-123': {
    id: 'team-123',
    name: 'Test Team',
    slug: 'test-team',
    ownerId: 'user-123',
    members: [],
    createdAt: new Date().toISOString(),
  },
};

/**
 * Mock scan results
 */
const mockScanResults = {
  'scan-123': {
    id: 'scan-123',
    fileName: 'test-file.pdf',
    fileSize: 1024000,
    riskScore: 45,
    riskLevel: 'medium',
    threatCount: 3,
    threatTypes: ['phishing', 'malware'],
    scanDate: new Date().toISOString(),
    isClean: false,
    details: {
      malware: { detected: true, threats: ['Trojan.Generic'] },
      phishing: { detected: true, likelihood: 0.75 },
      suspicious: { detected: false },
    },
  },
};

/**
 * Auth Handlers
 */
export const authHandlers = [
  // Login endpoint
  http.post(`${API_URL}/auth/signin`, async ({ request }) => {
    const body = await request.json() as any;
    const { email, password } = body;

    if (email === 'test@example.com' && password === 'password123') {
      return HttpResponse.json({
        success: true,
        user: mockUsers['test@example.com'],
        token: 'test-jwt-token',
      });
    }

    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  // Register endpoint
  http.post(`${API_URL}/auth/register`, async ({ request }) => {
    const body = await request.json() as any;
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return HttpResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      success: true,
      user: {
        id: 'new-user-id',
        email,
        name,
        emailVerified: false,
      },
      token: 'new-jwt-token',
    });
  }),

  // Logout endpoint
  http.post(`${API_URL}/auth/logout`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Get session
  http.get(`${API_URL}/auth/session`, () => {
    return HttpResponse.json({
      user: mockUsers['test@example.com'],
    });
  }),

  // Verify email
  http.post(`${API_URL}/auth/verify-email`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      success: true,
      message: 'Email verified',
    });
  }),

  // 2FA setup
  http.post(`${API_URL}/auth/2fa/setup`, () => {
    return HttpResponse.json({
      secret: 'test-secret-key',
      qrCode: 'data:image/png;base64,iVBORw0KGg...',
    });
  }),

  // 2FA verify
  http.post(`${API_URL}/auth/2fa/verify`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      success: body.code === '123456',
      message: body.code === '123456' ? '2FA enabled' : 'Invalid code',
    });
  }),
];

/**
 * File Scan Handlers
 */
export const fileScanHandlers = [
  // Upload file for scanning
  http.post(`${API_URL}/file/upload`, async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return HttpResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      success: true,
      scanId: 'scan-123',
      fileName: file.name,
      fileSize: file.size,
      message: 'File uploaded and scanning...',
    });
  }),

  // Get scan results
  http.get(`${API_URL}/file/results/:scanId`, ({ params }) => {
    const { scanId } = params;
    const result = mockScanResults[scanId as string];

    if (!result) {
      return HttpResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(result);
  }),
];

/**
 * Email Scan Handlers
 */
export const emailScanHandlers = [
  // Scan email
  http.post(`${API_URL}/email/scan`, async ({ request }) => {
    const body = await request.json() as any;
    const { from, subject, body: emailBody } = body;

    return HttpResponse.json({
      success: true,
      scanId: 'email-scan-123',
      riskScore: 65,
      riskLevel: 'high',
      isPhishing: subject?.toLowerCase().includes('urgent'),
      threats: ['phishing_attempt', 'suspicious_links'],
    });
  }),

  // Get email scan history
  http.get(`${API_URL}/email/history`, () => {
    return HttpResponse.json({
      scans: [
        {
          id: 'email-scan-123',
          from: 'suspicious@example.com',
          subject: 'URGENT: Action Required',
          riskScore: 85,
          riskLevel: 'critical',
          scanDate: new Date().toISOString(),
        },
      ],
    });
  }),
];

/**
 * Team Handlers
 */
export const teamHandlers = [
  // Create team
  http.post(`${API_URL}/teams/create`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      success: true,
      team: {
        id: 'new-team-id',
        name: body.name,
        slug: body.slug,
        ownerId: 'user-123',
      },
    });
  }),

  // List teams
  http.get(`${API_URL}/teams/list`, () => {
    return HttpResponse.json({
      teams: [mockTeams['team-123']],
    });
  }),

  // Get team members
  http.get(`${API_URL}/teams/:teamId/members`, () => {
    return HttpResponse.json({
      members: [
        {
          id: 'member-1',
          userId: 'user-123',
          teamId: 'team-123',
          role: 'owner',
          email: 'test@example.com',
        },
      ],
    });
  }),

  // Add team member
  http.post(`${API_URL}/teams/:teamId/members`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      success: true,
      member: {
        id: 'new-member-id',
        userId: 'new-user-id',
        teamId: 'team-123',
        role: body.role || 'member',
        email: body.email,
      },
    });
  }),
];

/**
 * Dashboard Handlers
 */
export const dashboardHandlers = [
  // Get dashboard stats
  http.get(`${API_URL}/dashboard/stats`, () => {
    return HttpResponse.json({
      totalScans: 156,
      threatsDetected: 42,
      filesAnalyzed: 198,
      currentMonth: {
        scans: 45,
        threats: 12,
        avgRiskScore: 38,
      },
      trend: [
        { date: '2024-01-01', scans: 5, threats: 2 },
        { date: '2024-01-02', scans: 8, threats: 3 },
        { date: '2024-01-03', scans: 6, threats: 1 },
      ],
    });
  }),

  // Get recent scans
  http.get(`${API_URL}/dashboard/recent-scans`, () => {
    return HttpResponse.json({
      scans: [
        mockScanResults['scan-123'],
      ],
    });
  }),
];

/**
 * User Settings Handlers
 */
export const settingsHandlers = [
  // Get user settings
  http.get(`${API_URL}/user/settings`, () => {
    return HttpResponse.json({
      theme: 'dark',
      emailNotifications: true,
      twoFactorEnabled: false,
      privacy: 'private',
    });
  }),

  // Update user settings
  http.put(`${API_URL}/user/settings`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      success: true,
      settings: body,
    });
  }),

  // Get user tier
  http.get(`${API_URL}/user/tier`, () => {
    return HttpResponse.json({
      tier: 'pro',
      monthlyScans: 1000,
      scansUsed: 156,
      features: ['email_scanning', 'file_analysis', 'team_collaboration'],
    });
  }),
];

/**
 * Combine all handlers
 */
export const handlers = [
  ...authHandlers,
  ...fileScanHandlers,
  ...emailScanHandlers,
  ...teamHandlers,
  ...dashboardHandlers,
  ...settingsHandlers,
];
