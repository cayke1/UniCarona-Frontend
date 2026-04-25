import * as Location from 'expo-location';
import { Platform } from 'react-native';

export type GeocodedPoint = { latitude: number; longitude: number };

async function geocodeNominatim(query: string): Promise<GeocodedPoint | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'pt-BR',
        'User-Agent': 'UniCarona/1.0 (campus ride app)',
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    const hit = data[0];
    if (!hit?.lat || !hit?.lon) return null;
    const latitude = parseFloat(hit.lat);
    const longitude = parseFloat(hit.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  } catch {
    return null;
  }
}

/**
 * Converte texto de endereço em coordenadas (nativo: expo-location; web: Nominatim).
 */
export async function geocodeAddressToPoint(address: string): Promise<GeocodedPoint | null> {
  const q = address.trim();
  if (!q) return null;

  if (Platform.OS !== 'web') {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const results = await Location.geocodeAsync(q);
        const r = results[0];
        if (r && typeof r.latitude === 'number' && typeof r.longitude === 'number') {
          return { latitude: r.latitude, longitude: r.longitude };
        }
      }
    } catch {
      /* fallback */
    }
  }

  return geocodeNominatim(q);
}
