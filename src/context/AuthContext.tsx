import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { authApi, isAuthExpiredError, isTransientApiError, isUserBlockedError, USER_BLOCKED_EVENT } from '../lib/api';
import { shouldRefreshAfterAppResume } from '../lib/appLifecycle';
import { mapUserProfileFromApi, UserProfile } from '../lib/authUser';
import { getAuthExpiredRecoveryAction, getTelegramStartupAuthAction } from '../lib/telegramAuthStartup';

interface AuthContextType {
  user: UserProfile | null;
  isBlocked: boolean;
  isLoading: boolean;
  login: (initData: string) => Promise<UserProfile | null>;
  logout: () => void;
  refreshUser: (options?: { showLoading?: boolean }) => Promise<UserProfile | null>;
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
  const loginPromiseRef = useRef<Promise<UserProfile | null> | null>(null);
  const hiddenAtRef = useRef<number | null>(null);
  const lastResumeRefreshAtRef = useRef(0);

  const getTelegramInitData = useCallback((): string | undefined => {
    return (window as any).Telegram?.WebApp?.initData || undefined;
  }, []);

  const applyUserData = useCallback((userData: any): UserProfile => {
    const mappedUser = mapUserProfileFromApi(userData) as UserProfile;
    setUser(mappedUser);
    setIsBlocked(mappedUser.isBlocked);
    return mappedUser;
  }, []);

  const loadCurrentUser = useCallback(async (): Promise<UserProfile> => {
    const userData = await authApi.getMe();
    return applyUserData(userData);
  }, [applyUserData]);

  const loginWithTelegramInitData = useCallback(async (initData: string): Promise<UserProfile | null> => {
    if (loginPromiseRef.current) {
      return await loginPromiseRef.current;
    }

    const loginPromise = (async () => {
      const { access_token } = await authApi.telegramLogin(initData);
      localStorage.setItem('access_token', access_token);
      return await loadCurrentUser();
    })();

    loginPromiseRef.current = loginPromise;

    try {
      return await loginPromise;
    } finally {
      loginPromiseRef.current = null;
    }
  }, [loadCurrentUser]);

  const clearSession = useCallback(() => {
    localStorage.removeItem('access_token');
    setUser(null);
    setIsBlocked(false);
  }, []);

  const refreshUser = useCallback(async (options: { showLoading?: boolean } = {}) => {
    if (options.showLoading) {
      setIsLoading(true);
    }

    try {
      return await loadCurrentUser();
    } catch (error) {
      console.error('Failed to fetch user profile:', error);

      if (isUserBlockedError(error)) {
        setIsBlocked(true);
        setUser(prev => prev ? { ...prev, isBlocked: true } : prev);
        return null;
      }

      if (isAuthExpiredError(error)) {
        const initData = getTelegramInitData();
        if (getAuthExpiredRecoveryAction(initData) === 'telegram-login' && initData) {
          try {
            return await loginWithTelegramInitData(initData);
          } catch (loginError) {
            console.error('Failed to recover expired auth with Telegram login:', loginError);
          }
        }

        clearSession();
        return null;
      }

      if (!isTransientApiError(error)) {
        console.warn('Keeping current session after profile refresh error:', error);
      }

      return null;
    } finally {
      if (options.showLoading) {
        setIsLoading(false);
      }
    }
  }, [clearSession, getTelegramInitData, loadCurrentUser, loginWithTelegramInitData]);

  const login = useCallback(async (initData: string) => {
    try {
      return await loginWithTelegramInitData(initData);
    } catch (error) {
      console.error('Login failed:', error);
      if (isUserBlockedError(error)) {
        setIsBlocked(true);
        return null;
      }
      clearSession();
      throw error;
    }
  }, [clearSession, loginWithTelegramInitData]);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    (window as any).Telegram?.WebApp?.ready?.();
    const token = localStorage.getItem('access_token');
    const initData = getTelegramInitData();
    const startupAction = getTelegramStartupAuthAction({ initData, accessToken: token });

    if (startupAction === 'refresh') {
      refreshUser().finally(() => setIsLoading(false));
      return;
    }

    if (startupAction === 'login' && initData) {
      login(initData)
        .catch((error) => {
          console.error('Telegram startup login failed:', error);
        })
        .finally(() => setIsLoading(false));
      return;
    }

    setIsBlocked(false);
    setIsLoading(false);
  }, [getTelegramInitData, login, refreshUser]);

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
      const initData = getTelegramInitData();
      if (!token) {
        if (initData) {
          lastResumeRefreshAtRef.current = Date.now();
          void login(initData).catch((error) => {
            console.error('Telegram resume login failed:', error);
          });
        }
        return;
      }

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
  }, [getTelegramInitData, login, refreshUser]);

  return (
    <AuthContext.Provider value={{ user, isBlocked, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
