import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { ApiError, userApi } from '@/lib/api';
import { getAuthToken } from '@/lib/auth-token';
import { normalizeUserPayload, type NormalizedUser } from '@/lib/user-types';

type UserContextValue = {
  user: NormalizedUser | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  setUserFromServerResponse: (payload: Record<string, unknown>) => void;
  clearUser: () => void;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<NormalizedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearUser = useCallback(() => {
    setUser(null);
    setError(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) {
      clearUser();
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await userApi.me();
      setUser(normalizeUserPayload(response));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setUser(null);
        setError('Sessão expirada.');
        return;
      }
      const msg =
        e instanceof ApiError ? e.message : 'Não foi possível carregar seus dados.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [clearUser]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const setUserFromServerResponse = useCallback((payload: Record<string, unknown>) => {
    setUser(normalizeUserPayload(payload));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      refreshUser,
      setUserFromServerResponse,
      clearUser,
    }),
    [user, loading, error, refreshUser, setUserFromServerResponse, clearUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser deve ser usado dentro de UserProvider');
  }
  return ctx;
}
