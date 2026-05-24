import { ridesApi } from '@/lib/api';

export type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

export type DrivingRouteResult = {
  coordinates: RouteCoordinate[];
  durationMinutes: number | null;
};

interface OsrmRouteResponse {
  code: string;
  routes?: Array<{
    geometry: { coordinates: [number, number][] };
    duration?: number;
    distance?: number;
  }>;
}

const OSRM_PUBLIC_URLS = [
  (originLng: number, originLat: number, destLng: number, destLat: number) =>
    `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`,
  (originLng: number, originLat: number, destLng: number, destLat: number) =>
    `https://routing.openstreetmap.de/routed-car/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`,
];

function estimateDurationMinutes(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(destination.lat - origin.lat);
  const dLng = toRad(destination.lng - origin.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(origin.lat)) *
      Math.cos(toRad(destination.lat)) *
      Math.sin(dLng / 2) ** 2;
  const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(5, Math.round((km / 45) * 60));
}

function straightLineFallback(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): DrivingRouteResult {
  return {
    coordinates: [
      { latitude: origin.lat, longitude: origin.lng },
      { latitude: destination.lat, longitude: destination.lng },
    ],
    durationMinutes: estimateDurationMinutes(origin, destination),
  };
}

async function fetchOsrmDirect(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<DrivingRouteResult | null> {
  for (const buildUrl of OSRM_PUBLIC_URLS) {
    const url = buildUrl(origin.lng, origin.lat, destination.lng, destination.lat);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) continue;

      const data = (await res.json()) as OsrmRouteResponse;
      const route = data.routes?.[0];
      if (data.code !== 'Ok' || !route?.geometry?.coordinates?.length) continue;

      const coordinates = route.geometry.coordinates.map(([lng, lat]) => ({
        latitude: lat,
        longitude: lng,
      }));
      if (coordinates.length < 2) continue;

      const durationMinutes =
        route.duration != null && Number.isFinite(route.duration)
          ? Math.max(1, Math.round(route.duration / 60))
          : estimateDurationMinutes(origin, destination);

      return { coordinates, durationMinutes };
    } catch {
      /* tenta próximo servidor */
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

async function fetchViaBackend(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<DrivingRouteResult | null> {
  try {
    const data = await ridesApi.routeGeometry({
      originLat: origin.lat,
      originLng: origin.lng,
      destinationLat: destination.lat,
      destinationLng: destination.lng,
    });
    if (!Array.isArray(data.coordinates) || data.coordinates.length < 2) return null;
    const coordinates = data.coordinates
      .map((p) => ({
        latitude: typeof p.latitude === 'number' ? p.latitude : NaN,
        longitude: typeof p.longitude === 'number' ? p.longitude : NaN,
      }))
      .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
    if (coordinates.length < 2) return null;
    return {
      coordinates,
      durationMinutes:
        typeof data.durationMinutes === 'number' && Number.isFinite(data.durationMinutes)
          ? Math.max(1, data.durationMinutes)
          : estimateDurationMinutes(origin, destination),
    };
  } catch {
    return null;
  }
}

/** Rota rodoviária: API do app → OSRM público → linha reta (último recurso). */
export async function fetchDrivingRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<DrivingRouteResult> {
  const fromApi = await fetchViaBackend(origin, destination);
  if (fromApi) return fromApi;

  const fromOsrm = await fetchOsrmDirect(origin, destination);
  if (fromOsrm) return fromOsrm;

  return straightLineFallback(origin, destination);
}
