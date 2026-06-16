/**
 * Custom Testing Utilities
 *
 * Provides custom render function with providers (theme, auth, etc.)
 * and additional testing utilities for React components.
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';

/**
 * Mock session for authenticated tests
 */
export const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    image: 'https://example.com/avatar.jpg',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

/**
 * Mock providers wrapper component
 */
interface AllProvidersProps {
  children: React.ReactNode;
  session?: typeof mockSession | null;
}

const AllProviders: React.FC<AllProvidersProps> = ({
  children,
  session = null,
}) => {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
};

/**
 * Custom render function that includes providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: typeof mockSession | null;
}

export function renderWithProviders(
  ui: ReactElement,
  { session = null, ...renderOptions }: CustomRenderOptions = {}
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders session={session}>{children}</AllProviders>
    ),
    ...renderOptions,
  });
}

/**
 * Wait for async operations with custom timeout
 */
export const waitForAsync = (ms: number = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock fetch with predefined response
 */
export function mockFetch(data: any, status: number = 200) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    } as Response)
  );
}

/**
 * Mock localStorage
 */
export const setupLocalStorageMock = () => {
  const store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => {
        delete store[key];
      });
    },
  };
};

/**
 * Create mock user with optional overrides
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'user-123',
    email: 'user@example.com',
    name: 'Test User',
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock team with optional overrides
 */
export function createMockTeam(overrides = {}) {
  return {
    id: 'team-123',
    name: 'Test Team',
    slug: 'test-team',
    description: 'A test team',
    imageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock scan result with optional overrides
 */
export function createMockScanResult(overrides = {}) {
  return {
    id: 'scan-123',
    fileName: 'test-file.pdf',
    fileSize: 1024000,
    riskScore: 45,
    riskLevel: 'medium',
    threatCount: 3,
    threatTypes: ['phishing', 'malware'],
    scanDate: new Date(),
    isClean: false,
    ...overrides,
  };
}

/**
 * Create mock email scan result with optional overrides
 */
export function createMockEmailScanResult(overrides = {}) {
  return {
    id: 'email-scan-123',
    fromAddress: 'sender@example.com',
    subject: 'Test Email',
    riskScore: 65,
    riskLevel: 'high',
    isPhishing: true,
    hasAttachments: false,
    threatDetected: true,
    scanDate: new Date(),
    ...overrides,
  };
}

/**
 * Re-export everything from React Testing Library
 */
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
