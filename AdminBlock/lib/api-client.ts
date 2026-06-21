/**
 * API client for AdminBlock endpoints
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

class ApiClient {
  private baseUrl: string;
  private timeout: number = 10000;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || API_BASE_URL;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Request failed',
          code: data.code || `HTTP_${response.status}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
        code: 'FETCH_ERROR',
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const url = new URL(endpoint, this.baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return this.fetch<T>(url.pathname + url.search, {
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.fetch<T>(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * File upload
   */
  async uploadFile<T>(endpoint: string, file: File): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.fetch<T>(endpoint, {
      method: 'POST',
      headers: {
        // Remove Content-Type, let browser set it with boundary
      },
      body: formData as any,
    });
  }
}

// Admin-specific API client
export class AdminApiClient extends ApiClient {
  constructor() {
    super('/api/admin');
  }

  // Authentication
  async verifyPasscode(passcode: string): Promise<ApiResponse<{ token: string }>> {
    return this.post<{ token: string }>('/auth/verify', { passcode });
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.post<void>('/auth/logout', {});
  }

  // Users
  async getUsers(): Promise<ApiResponse<unknown[]>> {
    return this.get<unknown[]>('/users');
  }

  async getUser(userId: string): Promise<ApiResponse<unknown>> {
    return this.get<unknown>(`/users/${userId}`);
  }

  async kickUser(userId: string): Promise<ApiResponse<void>> {
    return this.post<void>(`/users/${userId}/kick`, {});
  }

  // Payments
  async getPayments(limit?: number, offset?: number): Promise<ApiResponse<unknown[]>> {
    return this.get<unknown[]>('/payments', { limit, offset });
  }

  async getRevenueStats(): Promise<ApiResponse<unknown>> {
    return this.get<unknown>('/revenue');
  }

  // Servers
  async getServers(): Promise<ApiResponse<unknown[]>> {
    return this.get<unknown[]>('/servers');
  }

  async getServerStatus(serverId: string): Promise<ApiResponse<unknown>> {
    return this.get<unknown>(`/servers/${serverId}`);
  }

  // Logs
  async getLogs(limit?: number, offset?: number): Promise<ApiResponse<unknown[]>> {
    return this.get<unknown[]>('/logs', { limit, offset });
  }

  async getFilteredLogs(filters: Record<string, unknown>): Promise<ApiResponse<unknown[]>> {
    return this.get<unknown[]>('/logs', filters);
  }

  // Health
  async getHealth(): Promise<ApiResponse<unknown>> {
    return this.get<unknown>('/health');
  }
}

export default new AdminApiClient();
