"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User } from '@/lib/api';
import { config, getApiUrl } from '@/lib/config';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Optimized storage loader
  const loadAuthFromStorage = useCallback(() => {
    try {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error loading auth from storage:', error);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load token and user from localStorage on mount
  useEffect(() => {
    loadAuthFromStorage();
      
    // Set up event listener to handle storage changes from other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth_token' || event.key === 'auth_user') {
        loadAuthFromStorage();
      }
    };
    
    // Set up event listener for token expired events
    const handleTokenExpired = () => {
      console.log('Token expired, logging out user');
      logout();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth:token-expired', handleTokenExpired);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:token-expired', handleTokenExpired);
    };
  }, [loadAuthFromStorage]);

  const login = useCallback(async (username: string, password: string): Promise<void> => {
    try {
      const response = await fetch(getApiUrl(config.authLoginEndpoint), {
        method: 'POST',
        headers: {
          'Content-Type': config.contentType.json,
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      // Store token and user
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);
  
  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const currentToken = localStorage.getItem('auth_token');
      if (!currentToken) {
        console.log('No token found for refresh');
        return false;
      }

      console.log('Attempting token refresh...');
      const response = await fetch(getApiUrl('api/auth/refresh'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': config.contentType.json,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store new token and user
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        
        setToken(data.token);
        setUser(data.user);
        
        console.log('Token refreshed successfully');
        return true;
      } else {
        // If refresh fails, logout user
        console.error('Token refresh failed:', response.status, response.statusText);
        logout();
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      return false;
    }
  }, [logout]);

  const isAuthenticated = useMemo(() => !!user && !!token, [user, token]);

  const value = useMemo(() => ({
    user,
    token,
    isLoading,
    login,
    logout,
    setUser,
    isAuthenticated,
    refreshToken,
  }), [user, token, isLoading, login, logout, isAuthenticated, refreshToken]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
