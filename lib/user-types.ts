export type UserRole = 'PASSAGEIRO' | 'MOTORISTA' | string;

export type NormalizedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  pixKey: string | null;
  balanceCents: number | null;
  /** Curso / programa (quando o backend enviar). */
  major: string | null;
  /** Instituição de ensino (quando o backend enviar). */
  institution: string | null;
  photoUrl: string | null;
};

export type NormalizedRide = {
  id: string;
  originLabel: string;
  destinationLabel: string;
  status: string;
  departureAt: string | null;
  seatsOffered: number | null;
  priceCents: number | null;
  originLat: number | null;
  originLng: number | null;
  destinationLat: number | null;
  destinationLng: number | null;
  driverName: string | null;
  vehicle: string | null;
};

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

function pickNumber(source: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const n = Number(value.replace(',', '.'));
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function balanceReaisFromUnknown(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    const fn = (value as { toNumber?: () => number }).toNumber;
    if (typeof fn === 'function') {
      const n = fn.call(value);
      return typeof n === 'number' && Number.isFinite(n) ? n : null;
    }
  }
  return null;
}

/** Lista de papéis como no Prisma (`UserRole`: DRIVER, PASSENGER) ou legado em PT. */
function parseRoles(data: Record<string, unknown>): string[] {
  const raw = data.roles;
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === 'string');
  }
  return [];
}

/** Indica se o usuário normalizado atua como motorista (alinhado ao backend DRIVER / MOTORISTA). */
export function isDriverUser(user: NormalizedUser): boolean {
  const r = String(user.role).toUpperCase();
  return r === 'DRIVER' || r === 'MOTORISTA';
}

function isDriverFromPayload(data: Record<string, unknown>): boolean {
  const roles = parseRoles(data);
  if (roles.some((r) => r.toUpperCase() === 'DRIVER' || r.toUpperCase() === 'MOTORISTA')) {
    return true;
  }
  const single = pickString(data, ['role', 'tipo', 'userRole', 'type']);
  if (single) {
    const u = single.toUpperCase();
    return u === 'MOTORISTA' || u === 'DRIVER';
  }
  return false;
}

export function normalizeUserPayload(payload: Record<string, unknown>): NormalizedUser {
  /** GET /users/me do Express devolve o usuário no root (sem { user: ... }). */
  const firstLayer = asRecord(payload.user) ?? asRecord(payload.data) ?? payload;
  const data = asRecord(firstLayer.user) ?? firstLayer;

  const balance =
    pickNumber(data, ['balanceCents', 'saldoCentavos', 'walletBalanceCents']) ??
    (() => {
      for (const key of ['balance', 'saldo', 'walletBalance']) {
        const raw = data[key];
        const reais = balanceReaisFromUnknown(raw);
        if (reais != null) return Math.round(reais * 100);
      }
      return null;
    })();

  return {
    id: pickString(data, ['id', '_id', 'userId']) ?? '',
    name: pickString(data, ['name', 'fullName', 'nome']) ?? 'Não informado',
    email: pickString(data, ['email']) ?? 'Não informado',
    role: isDriverFromPayload(data) ? 'MOTORISTA' : 'PASSAGEIRO',
    pixKey: pickString(data, ['pixKey', 'pix', 'chavePix', 'pix_key']) ?? null,
    balanceCents: balance,
    major:
      pickString(data, ['major', 'curso', 'course', 'program', 'programaAcademico']) ?? null,
    institution:
      pickString(data, [
        'institution',
        'universidade',
        'university',
        'college',
        'faculdade',
        'schoolName',
      ]) ?? null,
    photoUrl: pickString(data, ['photoUrl', 'avatarUrl', 'avatar', 'image', 'foto']) ?? null,
  };
}

function pickRideString(ride: Record<string, unknown>, keys: string[]): string {
  const v = pickString(ride, keys);
  return v ?? '—';
}

export function normalizeRideListPayload(payload: Record<string, unknown>): NormalizedRide[] {
  const raw =
    (Array.isArray(payload.rides) && payload.rides) ||
    (Array.isArray(payload.data) && payload.data) ||
    (Array.isArray(payload.items) && payload.items) ||
    (Array.isArray(payload) && payload) ||
    [];

  if (!Array.isArray(raw)) return [];

  return raw.map((item) => {
    const ride = asRecord(item) ?? {};
    const originObj = asRecord(ride.origin) ?? {};
    const destObj = asRecord(ride.destination) ?? {};
    const driverObj = asRecord(ride.driver) ?? {};

    const origin =
      pickRideString(ride, [
        'originAddress',
        'originLabel',
        'from',
        'origem',
      ]) ||
      pickString(originObj, ['address', 'name', 'label']) ||
      pickString(ride, ['origin']) ||
      '—';
    const dest =
      pickRideString(ride, [
        'destinationAddress',
        'destinationLabel',
        'to',
        'destino',
      ]) ||
      pickString(destObj, ['address', 'name', 'label']) ||
      pickString(ride, ['destination']) ||
      '—';
    const departure =
      pickString(ride, ['departureAt', 'departureTime', 'startsAt', 'dataHora']) ?? null;
    const price =
      pickNumber(ride, ['priceCents', 'precoCentavos']) ??
      (() => {
        const reais = pickNumber(ride, [
          'costPerSeat',
          'price',
          'preco',
          'valor',
          'estimatedTotalCost',
        ]);
        return reais != null ? Math.round(reais * 100) : null;
      })();

    const originLat =
      pickNumber(ride, ['originLat', 'origin_lat']) ??
      pickNumber(originObj, ['lat', 'latitude']) ??
      null;
    const originLng =
      pickNumber(ride, ['originLng', 'originLon', 'origin_lng']) ??
      pickNumber(originObj, ['lng', 'longitude']) ??
      null;
    const destinationLat =
      pickNumber(ride, ['destinationLat', 'destination_lat']) ??
      pickNumber(destObj, ['lat', 'latitude']) ??
      null;
    const destinationLng =
      pickNumber(ride, ['destinationLng', 'destinationLon', 'destination_lng']) ??
      pickNumber(destObj, ['lng', 'longitude']) ??
      null;

    const driverName =
      pickString(driverObj, ['name', 'fullName', 'nome']) ??
      pickString(ride, ['driverName']) ??
      null;
    const vehicle =
      pickString(driverObj, ['vehicle', 'veiculo', 'vehicleInfo', 'car']) ??
      pickString(ride, ['vehicle', 'veiculo']) ??
      null;

    return {
      id: pickString(ride, ['id', '_id']) ?? String(Math.random()),
      originLabel: origin,
      destinationLabel: dest,
      status: pickString(ride, ['status', 'state']) ?? 'UNKNOWN',
      departureAt: departure,
      seatsOffered: pickNumber(ride, [
        'availableSeats',
        'seatsOffered',
        'seats',
        'vagas',
        'totalSeats',
      ]),
      priceCents: price,
      originLat,
      originLng,
      destinationLat,
      destinationLng,
      driverName,
      vehicle,
    };
  });
}

export function formatMoneyFromCents(cents: number | null): string {
  if (cents == null || Number.isNaN(cents)) return '—';
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export type RidePreview = {
  distanceKm: number | null;
  durationMin: number | null;
  suggestedPriceCents: number | null;
  fuelCostCents: number | null;
};

function pickNumberLoose(source: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const n = Number(value.replace(',', '.'));
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

/** Normaliza resposta de POST /rides/preview. */
export function normalizePreviewPayload(payload: Record<string, unknown>): RidePreview {
  const data = asRecord(payload.data) ?? asRecord(payload.preview) ?? payload;
  const suggested =
    pickNumberLoose(data, ['suggestedPriceCents', 'priceCents']) ??
    (() => {
      const reais = pickNumberLoose(data, ['suggestedPrice', 'price', 'preco']);
      return reais != null ? Math.round(reais * 100) : null;
    })();
  const fuel =
    pickNumberLoose(data, ['fuelCostCents', 'estimatedCostCents']) ??
    (() => {
      const reais = pickNumberLoose(data, ['fuelCost', 'estimatedCost']);
      return reais != null ? Math.round(reais * 100) : null;
    })();

  return {
    distanceKm: pickNumberLoose(data, ['distanceKm', 'distance', 'distanciaKm']),
    durationMin: pickNumberLoose(data, ['durationMin', 'duration', 'duracaoMin']),
    suggestedPriceCents: suggested,
    fuelCostCents: fuel,
  };
}
