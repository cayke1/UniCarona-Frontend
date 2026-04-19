/**
 * Cliente HTTP para o backend.
 * Base: EXPO_PUBLIC_API_URL (ex.: http://192.168.x.x:3000/api)
 *
 * Rotas esperadas (ajuste os paths em authApi se o seu backend usar outros nomes):
 * - POST /auth/register — body: { name, email, password }
 * - POST /auth/login — body: { email, password }
 * - POST /auth/forgot-password — body: { email }
 */
import { getAuthToken } from '@/lib/auth-token';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {};
  }
}

function messageFromBody(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>;
    if (typeof o.message === 'string') return o.message;
    if (typeof o.error === 'string') return o.error;
    if (Array.isArray(o.message) && typeof o.message[0] === 'string') return o.message[0];
  }
  return fallback;
}

export function extractTokenFromAuthResponse(data: Record<string, unknown>): string | null {
  if (typeof data.token === 'string') return data.token;
  if (typeof data.accessToken === 'string') return data.accessToken;
  if (typeof data.access_token === 'string') return data.access_token;
  const nested = data.data;
  if (nested && typeof nested === 'object') {
    return extractTokenFromAuthResponse(nested as Record<string, unknown>);
  }
  return null;
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers as Record<string, string>),
    },
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    const msg = messageFromBody(body, `Erro ${res.status}`);
    throw new ApiError(msg, res.status, body);
  }
  return body as T;
}

async function authRequest<T>(path: string, init: RequestInit): Promise<T> {
  const token = await getAuthToken();
  return request<T>(path, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string>),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export const authApi = {
  register: (payload: RegisterPayload) =>
    request<Record<string, unknown>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: LoginPayload) =>
    request<Record<string, unknown>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  forgotPassword: (email: string) =>
    request<Record<string, unknown>>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};

export type UserRole = 'driver' | 'passenger';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export const userApi = {
  me: () =>
    authRequest<Record<string, unknown>>('/users/me', {
      method: 'GET',
    }),
};

export const rideApi = {
  getById: (id: string) =>
    authRequest<Record<string, unknown>>(`/rides/${id}`, { method: 'GET' }),

  acceptPassenger: (requestId: string) =>
    authRequest<Record<string, unknown>>(`/requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ACCEPTED' }),
    }),

  rejectPassenger: (requestId: string) =>
    authRequest<Record<string, unknown>>(`/requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'REJECTED' }),
    }),

  toggleBooking: (rideId: string, open: boolean) =>
    authRequest<Record<string, unknown>>(`/rides/${rideId}`, {
      method: 'PATCH',
      body: JSON.stringify({ bookingOpen: open }),
    }),

  joinRequest: (
    rideId: string,
    payload: { requestedSeats: number; pickupLocation: string; dropoffLocation: string }
  ) =>
    authRequest<Record<string, unknown>>(`/rides/${rideId}/requests`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  cancelRequest: (requestId: string) =>
    authRequest<Record<string, unknown>>(`/requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CANCELLED' }),
    }),
};
