import type { MapRide } from '@/types/ride';
import { parseDecimal } from '@/lib/parse-decimal';

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== 'object') return null;
  return v as Record<string, unknown>;
}

function num(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return parseDecimal(v);
}

/** Normaliza um item de GET /api/rides (JSON do Prisma/Express). */
export function normalizeMapRideItem(raw: unknown): MapRide | null {
  const r = asRecord(raw);
  if (!r) return null;
  const id = typeof r.id === 'string' ? r.id : null;
  if (!id) return null;

  const driverRaw = asRecord(r.driver) ?? {};
  const name =
    typeof driverRaw.name === 'string' && driverRaw.name.trim()
      ? driverRaw.name.trim()
      : 'Motorista';

  const departureTime =
    r.departureTime instanceof Date
      ? r.departureTime.toISOString()
      : typeof r.departureTime === 'string'
        ? r.departureTime
        : typeof r.departureAt === 'string'
          ? r.departureAt
          : '';

  return {
    id,
    originLat: num(r.originLat),
    originLng: num(r.originLng),
    destinationLat: num(r.destinationLat),
    destinationLng: num(r.destinationLng),
    departureTime,
    availableSeats: Math.max(0, Math.round(num(r.availableSeats))),
    costPerSeat: num(r.costPerSeat),
    distanceKm: num(r.distanceKm),
    driver: {
      name,
      photoUrl: typeof driverRaw.photoUrl === 'string' ? driverRaw.photoUrl : null,
    },
  };
}

/** Corpo de GET /api/rides: array na raiz ou em `data`. */
export function normalizeMapRides(payload: unknown): MapRide[] {
  if (Array.isArray(payload)) {
    return payload.map(normalizeMapRideItem).filter((x): x is MapRide => x !== null);
  }
  const root = asRecord(payload);
  const arr = root?.data;
  if (Array.isArray(arr)) {
    return arr.map(normalizeMapRideItem).filter((x): x is MapRide => x !== null);
  }
  return [];
}
