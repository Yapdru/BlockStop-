/**
 * Authentication Service
 * Handles OAuth flow and token management
 */

import type { User, SubscriptionToken } from '../shared/types';
import * as storage from '../shared/storage';

const AUTH_URL = 'https://auth.blockstop.io';
const API_URL = 'https://api.blockstop.io';
const REDIRECT_URI = `chrome-extension://${chrome.runtime.id}/auth-callback.html`;

interface AuthCodeResponse {
  code: string;
  state: string;
}

interface TokenExchangeResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

/**
 * Initiate OAuth flow
 */
export async function initiateOAuth(): Promise<AuthCodeResponse> {
  const state = crypto.randomUUID();
  const scopes = ['profile', 'email'].join(' ');

  const params = new URLSearchParams({
    client_id: chrome.runtime.id,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: scopes,
    state,
  });

  const authUrl = `${AUTH_URL}/oauth/authorize?${params.toString()}`;

  return new Promise((resolve, reject) => {
    const openWindow = window.open(
      authUrl,
      'blockstop-auth',
      'width=500,height=600'
    );

    if (!openWindow) {
      reject(new Error('Failed to open auth window'));
      return;
    }

    const checkWindow = setInterval(() => {
      if (openWindow.closed) {
        clearInterval(checkWindow);
        reject(new Error('Auth window closed'));
      }
    }, 500);

    // Listen for auth callback message
    window.addEventListener('message', (event) => {
      if (event.source !== openWindow) return;

      if (event.data.type === 'AUTH_CODE') {
        clearInterval(checkWindow);
        openWindow?.close();
        resolve({
          code: event.data.code,
          state: event.data.state,
        });
      }
    });
  });
}

/**
 * Exchange auth code for tokens
 */
export async function exchangeCodeForToken(
  code: string
): Promise<{ user: User; accessToken: string; refreshToken: string }> {
  try {
    const response = await fetch(`${API_URL}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        redirectUri: REDIRECT_URI,
        clientId: chrome.runtime.id,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const data = (await response.json()) as TokenExchangeResponse;

    // Store tokens
    const expiresAt = Date.now() + data.expiresIn * 1000;
    await storage.setAuthToken(data.accessToken, expiresAt);
    await storage.setUserInfo(data.user);

    // Store refresh token separately
    await chrome.storage.sync.set({
      refresh_token: data.refreshToken,
    });

    return {
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<string> {
  try {
    const result = await chrome.storage.sync.get('refresh_token');
    const refreshToken = result.refresh_token;

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // Refresh failed, clear auth
      await logout();
      throw new Error('Token refresh failed');
    }

    const data = (await response.json()) as {
      accessToken: string;
      expiresIn: number;
    };

    // Update stored token
    const expiresAt = Date.now() + data.expiresIn * 1000;
    await storage.setAuthToken(data.accessToken, expiresAt);

    return data.accessToken;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}

/**
 * Get valid access token, refreshing if necessary
 */
export async function getValidAccessToken(): Promise<string> {
  const token = await storage.getAuthToken();
  const isExpired = await storage.isTokenExpired();

  if (!token) {
    throw new Error('No authentication token available');
  }

  if (isExpired) {
    return refreshAccessToken();
  }

  return token;
}

/**
 * Validate subscription token
 */
export async function validateSubscriptionToken(
  token: string
): Promise<SubscriptionToken> {
  try {
    const response = await fetch(`${API_URL}/api/auth/validate-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Token validation failed');
    }

    const data = (await response.json()) as SubscriptionToken;
    return data;
  } catch (error) {
    console.error('Error validating subscription token:', error);
    throw error;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await storage.getAuthToken();
  const user = await storage.getUserInfo();
  return !!(token && user);
}

/**
 * Get current user info
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      return null;
    }

    const user = await storage.getUserInfo();
    if (!user) {
      return null;
    }

    // Verify token is still valid
    const isExpired = await storage.isTokenExpired();
    if (isExpired) {
      try {
        await refreshAccessToken();
      } catch {
        await logout();
        return null;
      }
    }

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    const token = await storage.getAuthToken();

    // Notify server of logout
    if (token) {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).catch(() => {
        // Ignore errors on logout
      });
    }

    // Clear stored auth data
    await storage.clearAuthToken();
    await storage.setUserInfo(null as any);
    await chrome.storage.sync.remove('refresh_token');
  } catch (error) {
    console.error('Error during logout:', error);
  }
}

/**
 * Get authentication status with detailed info
 */
export async function getAuthStatus(): Promise<{
  isAuthenticated: boolean;
  user: User | null;
  tokenExpires: number | null;
  canRefresh: boolean;
}> {
  try {
    const isAuth = await isAuthenticated();
    const user = await storage.getUserInfo();

    const result = await chrome.storage.sync.get('token_expires_at');
    const tokenExpires = result.token_expires_at || null;

    const refreshResult = await chrome.storage.sync.get('refresh_token');
    const canRefresh = !!refreshResult.refresh_token;

    return {
      isAuthenticated: isAuth,
      user,
      tokenExpires,
      canRefresh,
    };
  } catch (error) {
    console.error('Error getting auth status:', error);
    return {
      isAuthenticated: false,
      user: null,
      tokenExpires: null,
      canRefresh: false,
    };
  }
}

/**
 * Check if token needs refresh (within 5 minutes of expiry)
 */
export async function needsTokenRefresh(): Promise<boolean> {
  try {
    const result = await chrome.storage.sync.get('token_expires_at');
    const expiresAt = result.token_expires_at;

    if (!expiresAt) {
      return false;
    }

    const timeUntilExpiry = expiresAt - Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    return timeUntilExpiry < fiveMinutes;
  } catch (error) {
    console.error('Error checking token refresh need:', error);
    return false;
  }
}
