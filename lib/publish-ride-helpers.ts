import { haversineKm } from '@/lib/geo-distance';

const MIN_FUTURE_MS = 15 * 60 * 1000;
const DEFAULT_COST_PER_KM = 1.5;

/** Alinhar ao default do backend (`COST_PER_KM`). */
export function defaultCostPerKm(): number {
  const n = Number(process.env.EXPO_PUBLIC_COST_PER_KM);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_COST_PER_KM;
}

export function estimateCostsFromDistanceKm(distanceKm: number, totalSeats: number) {
  const costPerKm = defaultCostPerKm();
  const estimatedTotalCost = distanceKm * costPerKm;
  const costPerSeat = totalSeats > 0 ? estimatedTotalCost / totalSeats : estimatedTotalCost;
  return {
    costPerKm,
    estimatedTotalCost: Math.round(estimatedTotalCost * 100) / 100,
    costPerSeat: Math.round(costPerSeat * 100) / 100,
  };
}

/** Converte entrada do usuário em ISO 8601 aceito pelo backend. */
export function toDepartureIso(input: string): string | null {
  const t = input.trim().replace(' ', 'T');
  if (!t) return null;
  let s = t;
  const hasZone = /[zZ]$|[+-]\d{2}:\d{2}$/.test(s);
  if (!hasZone) {
    if (s.includes('T')) {
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) s = `${s}:00`;
      else if (/^\d{4}-\d{2}-\d{2}T\d{2}$/.test(s)) s = `${s}:00:00`;
      s = `${s}-03:00`;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      s = `${s}T12:00:00-03:00`;
    }
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function validateDepartureFuture(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Data de partida inválida.';
  if (d.getTime() < Date.now() + MIN_FUTURE_MS) {
    return 'A partida deve ser pelo menos 15 minutos no futuro.';
  }
  return null;
}

export function distanceKmForPreview(
  oLat: number,
  oLng: number,
  dLat: number,
  dLng: number,
  routeGeometryKm: number | null
): { distanceKm: number; mode: 'route_api' | 'haversine' } {
  if (routeGeometryKm != null && Number.isFinite(routeGeometryKm) && routeGeometryKm > 0) {
    return { distanceKm: Math.round(routeGeometryKm * 100) / 100, mode: 'route_api' };
  }
  return {
    distanceKm: haversineKm(oLat, oLng, dLat, dLng),
    mode: 'haversine',
  };
}
