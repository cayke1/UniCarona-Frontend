import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { ApiError, subscribeSessionInvalidation, userApi } from '@/lib/api';
import { getAuthToken } from '@/lib/auth-token';
import { normalizeUserPayload, type NormalizedUser } from '@/lib/user-types';

type UserContextValue = {
  user: NormalizedUser | null;
  loading: boolean;
  error: string | null;
  /** `true` após a primeira verificação de sessão (token + /users/me), para o roteador raiz não piscar. */
  initialHydrationDone: boolean;
  refreshUser: () => Promise<void>;
  setUserFromServerResponse: (payload: Record<string, unknown>) => void;
  clearUser: () => void;
};

export const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<NormalizedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialHydrationDone, setInitialHydrationDone] = useState(false);
  const hydrationDoneRef = useRef(false);
  const refreshChainRef = useRef(Promise.resolve());

  const markHydrationDone = useCallback(() => {
    if (!hydrationDoneRef.current) {
      hydrationDoneRef.current = true;
      setInitialHydrationDone(true);
    }
  }, []);

  const clearUser = useCallback(() => {
    setUser(null);
    setError(null);
  }, []);

  useEffect(() => {
    return subscribeSessionInvalidation(() => {
      setUser(null);
      setError('Sessão expirada. Faça login novamente.');
      setLoading(false);
    });
  }, []);

  const refreshUser = useCallback(async () => {
    const run = async () => {
      const token = await getAuthToken();
      if (!token) {
        clearUser();
        setLoading(false);
        markHydrationDone();
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
          setError('Sessão expirada. Faça login novamente.');
          return;
        }
        const msg =
          e instanceof ApiError ? e.message : 'Não foi possível carregar seus dados.';
        setError(msg);
      } finally {
        setLoading(false);
        markHydrationDone();
      }
    };

    refreshChainRef.current = refreshChainRef.current.then(run).catch(() => {});
    await refreshChainRef.current;
  }, [clearUser, markHydrationDone]);

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
      initialHydrationDone,
      refreshUser,
      setUserFromServerResponse,
      clearUser,
    }),
    [user, loading, error, initialHydrationDone, refreshUser, setUserFromServerResponse, clearUser]
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
