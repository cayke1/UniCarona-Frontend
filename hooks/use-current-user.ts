import type { User } from '@/lib/api';
import { useUser } from '@/contexts/user-context';
import { isDriverUser, type NormalizedUser } from '@/lib/user-types';

function toLegacyUser(n: NormalizedUser): User {
  return {
    id: n.id,
    name: n.name,
    email: n.email,
    role: isDriverUser(n) ? 'driver' : 'passenger',
  };
}

/** Preferir `useUser()`; este hook mantém o formato legado `User` para telas que já o usavam. */
export function useCurrentUser() {
  const { user, loading, error } = useUser();
  return {
    user: user ? toLegacyUser(user) : null,
    loading,
    error,
  };
}
