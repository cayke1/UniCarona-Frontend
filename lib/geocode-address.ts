import * as Location from 'expo-location';
import { Platform } from 'react-native';

import { getGooglePlacesApiKey } from '@/lib/google-places';

export type GeocodedPoint = { latitude: number; longitude: number };

async function geocodeGoogle(query: string): Promise<GeocodedPoint | null> {
  const key = getGooglePlacesApiKey();
  if (!key) return null;
  const params = new URLSearchParams({
    address: query,
    key,
    language: 'pt-BR',
    region: 'br',
  });
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status: string;
      results?: Array<{ geometry?: { location?: { lat: number; lng: number } } }>;
    };
    if (data.status !== 'OK' || !data.results?.[0]?.geometry?.location) return null;
    const { lat, lng } = data.results[0].geometry.location;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { latitude: lat, longitude: lng };
  } catch {
    return null;
  }
}

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

  const google = await geocodeGoogle(q);
  if (google) return google;

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
