import { getApiUrl } from './config';

interface ApiRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export class ApiClient {
  private static isRefreshing = false;
  private static refreshPromise: Promise<any> | null = null;

  private static async makeRequest(endpoint: string, options: ApiRequestOptions = {}): Promise<Response> {
    const token = localStorage.getItem('auth_token');
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    const requestOptions = {
      method: 'GET',
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    let response = await fetch(getApiUrl(endpoint), requestOptions);

    // If unauthorized, try to refresh token (but avoid concurrent refreshes)
    if (response.status === 401 && token && !this.isRefreshing) {
      console.log('Token expired, attempting refresh...');
      
      try {
        // Use a shared promise to avoid concurrent refresh attempts
        if (!this.refreshPromise) {
          this.isRefreshing = true;
          this.refreshPromise = this.performTokenRefresh(token);
        }
        
        const refreshResult = await this.refreshPromise;
        
        if (refreshResult.success) {
          // Retry original request with new token
          const retryOptions = {
            ...requestOptions,
            headers: {
              ...requestOptions.headers,
              'Authorization': `Bearer ${refreshResult.newToken}`,
            },
          };

          response = await fetch(getApiUrl(endpoint), retryOptions);
          
          if (response.ok) {
            console.log('Request successful after token refresh');
          }
        } else {
          // Refresh failed, redirect to login only once
          this.handleAuthFailure();
          throw new Error('Authentication failed');
        }
      } catch (error) {
        console.error('Error during token refresh:', error);
        this.handleAuthFailure();
        throw error;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    } else if (response.status === 401 && this.isRefreshing) {
      // If we're already refreshing, wait for it to complete
      try {
        if (this.refreshPromise) {
          const refreshResult = await this.refreshPromise;
          if (refreshResult.success) {
            // Retry with new token
            const retryOptions = {
              ...requestOptions,
              headers: {
                ...requestOptions.headers,
                'Authorization': `Bearer ${refreshResult.newToken}`,
              },
            };
            response = await fetch(getApiUrl(endpoint), retryOptions);
          }
        }
      } catch {
        // If waiting for refresh fails, continue with original response
      }
    }

    return response;
  }

  private static async performTokenRefresh(token: string): Promise<{ success: boolean; newToken?: string }> {
    try {
      const refreshResponse = await fetch(getApiUrl('api/auth/refresh'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        localStorage.setItem('auth_token', refreshData.token);
        localStorage.setItem('auth_user', JSON.stringify(refreshData.user));
        return { success: true, newToken: refreshData.token };
      } else {
        console.error('Token refresh failed:', refreshResponse.status, refreshResponse.statusText);
        return { success: false };
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false };
    }
  }

  private static handleAuthFailure() {
    // Only clear storage and redirect if not already done
    if (localStorage.getItem('auth_token')) {
      console.error('Authentication failed, clearing storage and redirecting to login');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      
      // Use replace to avoid back button issues
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
  }

  static async get(endpoint: string, headers?: Record<string, string>): Promise<Response> {
    return this.makeRequest(endpoint, { method: 'GET', headers });
  }

  static async post(endpoint: string, body?: any, headers?: Record<string, string>): Promise<Response> {
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  static async put(endpoint: string, body?: any, headers?: Record<string, string>): Promise<Response> {
    return this.makeRequest(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  static async delete(endpoint: string, headers?: Record<string, string>): Promise<Response> {
    return this.makeRequest(endpoint, { method: 'DELETE', headers });
  }
}
