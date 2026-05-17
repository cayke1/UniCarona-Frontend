export type PlacePrediction = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

export type ResolvedPlace = {
  placeId: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
};

type AutocompleteResponse = {
  status: string;
  predictions?: Array<{
    place_id: string;
    description: string;
    structured_formatting?: { main_text: string; secondary_text?: string };
  }>;
  error_message?: string;
};

type DetailsResponse = {
  status: string;
  result?: {
    formatted_address?: string;
    geometry?: { location?: { lat: number; lng: number } };
  };
  error_message?: string;
};

export function getGooglePlacesApiKey(): string | null {
  const key =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY?.trim();
  return key || null;
}

export function isGooglePlacesConfigured(): boolean {
  return !!getGooglePlacesApiKey();
}

export function createPlacesSessionToken(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

export async function fetchPlacePredictions(
  input: string,
  sessionToken: string
): Promise<PlacePrediction[]> {
  const key = getGooglePlacesApiKey();
  const query = input.trim();
  if (!key || query.length < 2) return [];

  const params = new URLSearchParams({
    input: query,
    key,
    language: 'pt-BR',
    components: 'country:br',
    sessiontoken: sessionToken,
  });

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`
  );
  const data = (await res.json()) as AutocompleteResponse;

  if (data.status === 'ZERO_RESULTS') return [];
  if (data.status !== 'OK' || !data.predictions?.length) {
    if (__DEV__ && data.error_message) {
      console.warn('[Places Autocomplete]', data.status, data.error_message);
    }
    return [];
  }

  return data.predictions.map((p) => ({
    placeId: p.place_id,
    description: p.description,
    mainText: p.structured_formatting?.main_text ?? p.description,
    secondaryText: p.structured_formatting?.secondary_text ?? '',
  }));
}

export async function resolvePlaceDetails(
  placeId: string,
  sessionToken: string
): Promise<ResolvedPlace | null> {
  const key = getGooglePlacesApiKey();
  if (!key || !placeId) return null;

  const params = new URLSearchParams({
    place_id: placeId,
    key,
    language: 'pt-BR',
    sessiontoken: sessionToken,
    fields: 'geometry,formatted_address',
  });

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`
  );
  const data = (await res.json()) as DetailsResponse;

  if (data.status !== 'OK' || !data.result?.geometry?.location) {
    if (__DEV__ && data.error_message) {
      console.warn('[Places Details]', data.status, data.error_message);
    }
    return null;
  }

  const { lat, lng } = data.result.geometry.location;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    placeId,
    formattedAddress: data.result.formatted_address ?? '',
    latitude: lat,
    longitude: lng,
  };
}
