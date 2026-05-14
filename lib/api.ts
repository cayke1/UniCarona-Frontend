
import { clearAuthToken, getAuthToken, getRefreshToken, saveAuthToken, saveRefreshToken } from '@/lib/auth-token';
import type { DriverRide, MapRide, MyRequest } from '@/types/ride';
import { normalizeMapRides } from '@/lib/normalize-map-rides';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:3000/api';

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

/** Lista mensagens de validação do middleware Zod (`fields`). */
export function formatApiValidationFields(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const fields = (body as Record<string, unknown>).fields;
  if (!Array.isArray(fields) || fields.length === 0) return null;
  const lines: string[] = [];
  for (const item of fields) {
    if (!item || typeof item !== 'object') continue;
    const f = item as Record<string, unknown>;
    const field = typeof f.field === 'string' ? f.field : '';
    const msg = typeof f.message === 'string' ? f.message : '';
    if (field && msg) lines.push(`${field}: ${msg}`);
    else if (msg) lines.push(msg);
  }
  return lines.length ? lines.join('\n') : null;
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

export function extractRefreshTokenFromAuthResponse(data: Record<string, unknown>): string | null {
  if (typeof data.refreshToken === 'string') return data.refreshToken;
  if (typeof data.refresh_token === 'string') return data.refresh_token;
  const nested = data.data;
  if (nested && typeof nested === 'object') {
    return extractRefreshTokenFromAuthResponse(nested as Record<string, unknown>);
  }
  return null;
}

/** Persiste access + refresh conforme resposta do backend (`/auth/login`, `/auth/register`, `/auth/refresh`). */
export async function persistTokensFromAuthResponse(data: Record<string, unknown>): Promise<void> {
  const access = extractTokenFromAuthResponse(data);
  const refresh = extractRefreshTokenFromAuthResponse(data);
  if (access) await saveAuthToken(access);
  if (refresh) await saveRefreshToken(refresh);
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

const sessionInvalidationListeners = new Set<() => void>();

/** Permite ao `UserProvider` reagir quando o refresh falha em qualquer chamada autenticada. */
export function subscribeSessionInvalidation(handler: () => void): () => void {
  sessionInvalidationListeners.add(handler);
  return () => sessionInvalidationListeners.delete(handler);
}

function notifySessionInvalidation(): void {
  for (const h of sessionInvalidationListeners) {
    try {
      h();
    } catch {
      /* noop */
    }
  }
}

let refreshSessionPromise: Promise<boolean> | null = null;

/**
 * Uma única renovação por vez (evita consumir o refresh token duas vezes — o backend invalida o antigo).
 */
async function tryRefreshSessionOnce(): Promise<boolean> {
  if (!refreshSessionPromise) {
    refreshSessionPromise = (async (): Promise<boolean> => {
      try {
        const refresh = await getRefreshToken();
        if (!refresh) {
          await clearAuthToken();
          notifySessionInvalidation();
          return false;
        }
        const data = await request<Record<string, unknown>>('/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: refresh }),
        });
        await persistTokensFromAuthResponse(data);
        return true;
      } catch {
        await clearAuthToken();
        notifySessionInvalidation();
        return false;
      } finally {
        refreshSessionPromise = null;
      }
    })();
  }
  return refreshSessionPromise;
}

async function authRequest<T>(path: string, init: RequestInit, isRetryAfterRefresh = false): Promise<T> {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const token = await getAuthToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers as Record<string, string>),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    if (res.status === 401 && !isRetryAfterRefresh) {
      const refreshed = await tryRefreshSessionOnce();
      if (refreshed) {
        return authRequest<T>(path, init, true);
      }
    }
    const msg = messageFromBody(body, `Erro ${res.status}`);
    throw new ApiError(msg, res.status, body);
  }
  return body as T;
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

export type ResetPasswordPayload = {
  token: string;
  newPassword: string;
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

  refresh: (refreshToken: string) =>
    request<Record<string, unknown>>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  logout: (refreshToken: string) =>
    request<Record<string, unknown>>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  forgotPassword: (email: string) =>
    request<Record<string, unknown>>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (payload: ResetPasswordPayload) =>
    request<Record<string, unknown>>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

/** Tipos para telas de detalhe/solicitação (useCurrentUser). */
export type UserRole = 'driver' | 'passenger';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type PatchUserPayload = {
  pixKey?: string;
  name?: string;
};

export type UpdateRolePayload = {
  role: 'DRIVER' | 'PASSENGER';
  /** Obrigatório no servidor se o usuário ainda não tiver PIX; opcional se já cadastrado. */
  pixKey?: string;
};

/** Corpo de POST /api/rides — espelha `createRideSchema` (`UniCarona-Backend/src/schemas/ride.schema.ts`). */
export type CreateRidePayload = {
  departureTime: string;
  originAddress: string;
  originLat: number;
  originLng: number;
  destinationAddress: string;
  destinationLat: number;
  destinationLng: number;
  totalSeats: number;
  costPerKm?: number;
  distanceKm?: number;
  estimatedTotalCost?: number;
  costPerSeat?: number;
};

export type PreviewRidePayload = {
  originAddress: string;
  destinationAddress: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
};

export type RideRoutePayload = {
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
};

export type DrivingRouteGeometry = {
  coordinates: { latitude: number; longitude: number }[];
  distanceKm: number;
  durationMinutes: number;
};

export const userApi = {
  me: () =>
    authRequest<Record<string, unknown>>('/users/me', {
      method: 'GET',
    }),

  myRequests: () =>
    authRequest<MyRequest[]>('/users/me/requests', {
      method: 'GET',
    }),

  /** Backend: PUT /api/users/me */
  patchMe: (payload: PatchUserPayload) =>
    authRequest<Record<string, unknown>>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  /** Backend expõe POST /api/users/me/role (promover a motorista). */
  patchRole: (payload: UpdateRolePayload) =>
    authRequest<Record<string, unknown>>('/users/me/role', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const ridesApi = {
  /** GET /api/rides — query `lat` e `lng` quando a localização do usuário estiver disponível. */
  listMapRides: async (lat?: number, lng?: number): Promise<MapRide[]> => {
    const params = new URLSearchParams();
    if (lat !== undefined && Number.isFinite(lat)) params.set('lat', String(lat));
    if (lng !== undefined && Number.isFinite(lng)) params.set('lng', String(lng));
    const qs = params.toString();
    const body = await authRequest<unknown>(`/rides${qs ? `?${qs}` : ''}`, { method: 'GET' });
    return normalizeMapRides(body);
  },

  listMyDriverRides: () =>
    authRequest<DriverRide[]>('/rides/me', {
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

  /** Geometria da rota (Directions no servidor) para desenhar polyline no mapa. */
  routeGeometry: (payload: RideRoutePayload) =>
    authRequest<DrivingRouteGeometry>('/rides/route', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  create: (payload: CreateRidePayload) =>
    authRequest<Record<string, unknown>>('/rides', {
      method: 'POST',
      body: JSON.stringify(payload),
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
    payload: {
      requestedSeats: number;
      pickupLocation: string;
      dropoffLocation: string;
      pickupLat?: number;
      pickupLng?: number;
      dropoffLat?: number;
      dropoffLng?: number;
    }
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

  getRequest: (requestId: string) =>
    authRequest<Record<string, unknown>>(`/requests/${requestId}`, {
      method: 'GET',
    }),
};

export const paymentsApi = {
  mock: (requestId: string) =>
    authRequest<Record<string, unknown>>('/payments/mock', {
      method: 'POST',
      body: JSON.stringify({ requestId }),
    }),
};
