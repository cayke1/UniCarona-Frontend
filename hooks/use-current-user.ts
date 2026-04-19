import { useState, useEffect } from 'react';
import { userApi, User, UserRole } from '@/lib/api';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function pickString(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function normalizeUser(payload: Record<string, unknown>): User | null {
  const firstLayer = asRecord(payload.user) ?? asRecord(payload.data) ?? payload;
  const data = asRecord(firstLayer.user) ?? firstLayer;

  const id = pickString(data, ['id', '_id', 'userId']);
  const name = pickString(data, ['name', 'fullName', 'nome']);
  const email = pickString(data, ['email']);
  const rawRole = pickString(data, ['role', 'tipo', 'userType']);
  const normalizedRole = rawRole?.toUpperCase();
  const role: UserRole =
    normalizedRole === 'DRIVER' || normalizedRole === 'MOTORISTA' ? 'driver' : 'passenger';

  if (!id || !name || !email) return null;
  return { id, name, email, role };
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    userApi
      .me()
      .then((data) => setUser(normalizeUser(data)))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading, error };
}
