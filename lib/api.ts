
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

export type PatchUserPayload = {
  pixKey?: string;
  name?: string;
};

export type UpdateRolePayload = {
  role: 'DRIVER' | 'PASSENGER';
};

export type CreateRidePayload = {
  originAddress: string;
  destinationAddress: string;
  originPlaceId?: string;
  destinationPlaceId?: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  departureAt: string;
  seatsOffered: number;
  priceCents?: number;
};

export type PreviewRidePayload = {
  originAddress: string;
  destinationAddress: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
};

export const userApi = {
  me: () =>
    authRequest<Record<string, unknown>>('/users/me', {
      method: 'GET',
    }),

  patchMe: (payload: PatchUserPayload) =>
    authRequest<Record<string, unknown>>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  patchRole: (payload: UpdateRolePayload) =>
    authRequest<Record<string, unknown>>('/users/me/role', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};

export const ridesApi = {
  listMyDriverRides: () =>
    authRequest<Record<string, unknown>>('/rides/me?as=driver', {
      method: 'GET',
    }),

  listMyRidesViaUser: () =>
    authRequest<Record<string, unknown>>('/users/me/rides', {
      method: 'GET',
    }),

  preview: (payload: PreviewRidePayload) =>
    authRequest<Record<string, unknown>>('/rides/preview', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  create: (payload: CreateRidePayload) =>
    authRequest<Record<string, unknown>>('/rides', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
