import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { authApi, isAuthExpiredError, isTransientApiError, isUserBlockedError, USER_BLOCKED_EVENT } from '../lib/api';
import { shouldRefreshAfterAppResume } from '../lib/appLifecycle';
import { mapUserProfileFromApi, UserProfile } from '../lib/authUser';

interface AuthContextType {
  user: UserProfile | null;
  isBlocked: boolean;
  isLoading: boolean;
  login: (initData: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hiddenAtRef = useRef<number | null>(null);
  const lastResumeRefreshAtRef = useRef(0);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.getMe();
      const mappedUser = mapUserProfileFromApi(userData);
      setUser(mappedUser);
      setIsBlocked(mappedUser.isBlocked);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);

      if (isUserBlockedError(error)) {
        setIsBlocked(true);
        setUser(prev => prev ? { ...prev, isBlocked: true } : prev);
        return;
      }

      if (isAuthExpiredError(error)) {
        localStorage.removeItem('access_token');
        setUser(null);
        setIsBlocked(false);
        return;
      }

      if (!isTransientApiError(error)) {
        console.warn('Keeping current session after profile refresh error:', error);
      }
    }
  }, []);

  const login = useCallback(async (initData: string) => {
    setIsLoading(true);
    try {
      const { access_token } = await authApi.telegramLogin(initData);
      localStorage.setItem('access_token', access_token);
      await refreshUser();
    } catch (error) {
      console.error('Login failed:', error);
      if (isUserBlockedError(error)) {
        setIsBlocked(true);
        return;
      }
      localStorage.removeItem('access_token');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    setUser(null);
    setIsBlocked(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsBlocked(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleUserBlocked = () => {
      setIsBlocked(true);
      setUser(prev => prev ? { ...prev, isBlocked: true } : prev);
    };

    window.addEventListener(USER_BLOCKED_EVENT, handleUserBlocked);

    return () => {
      window.removeEventListener(USER_BLOCKED_EVENT, handleUserBlocked);
    };
  }, []);

  useEffect(() => {
    const refreshAfterResume = () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const now = Date.now();
      if (!shouldRefreshAfterAppResume({
        now,
        hiddenAt: hiddenAtRef.current,
        lastRefreshAt: lastResumeRefreshAtRef.current,
      })) {
        return;
      }

      lastResumeRefreshAtRef.current = now;
      hiddenAtRef.current = null;
      void refreshUser();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
        return;
      }

      refreshAfterResume();
    };

    window.addEventListener('focus', refreshAfterResume);
    window.addEventListener('pageshow', refreshAfterResume);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', refreshAfterResume);
      window.removeEventListener('pageshow', refreshAfterResume);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, isBlocked, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
