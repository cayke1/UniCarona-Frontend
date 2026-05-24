import React, { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { type RoutePoint } from '@/types/ride';
import { fetchDrivingRoute } from '@/lib/fetch-route';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';

const C = {
  primary: '#1A3FA0',
  primaryMid: '#2563eb',
  card: colors.neutral[0],
  text: '#0D1B3E',
  textMuted: colors.neutral[400],
  border: colors.border.default,
  hero: '#0E2170',
  routeLine: '#FBBF24',
  routeLineOutline: '#B45309',
} as const;

export function formatHeroDeparture(iso: string): { date: string; time: string } {
  if (!iso) return { date: '—', time: '—' };
  const d = new Date(iso);
  const isToday = d.toDateString() === new Date().toDateString();
  const date = isToday
    ? 'Hoje'
    : d.toLocaleDateString('pt-BR', { weekday: 'long', month: 'long', day: 'numeric' });
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

function formatTimeFromIso(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatArrivalTime(departureIso: string, durationMinutes: number): string {
  const d = new Date(departureIso);
  d.setMinutes(d.getMinutes() + durationMinutes);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function RideMapHeroCard({
  origin,
  destination,
  date,
  time,
  originCoordinate,
  destinationCoordinate,
  onRouteDuration,
}: {
  origin: string;
  destination: string;
  date: string;
  time: string;
  originCoordinate?: RoutePoint;
  destinationCoordinate?: RoutePoint;
  onRouteDuration?: (minutes: number | null) => void;
}) {
  const mapRef = useRef<MapView>(null);
  const onRouteDurationRef = useRef(onRouteDuration) as MutableRefObject<
    ((minutes: number | null) => void) | undefined
  >;
  onRouteDurationRef.current = onRouteDuration;
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const hasCoords =
    originCoordinate != null &&
    destinationCoordinate != null &&
    Number.isFinite(originCoordinate.latitude) &&
    Number.isFinite(originCoordinate.longitude) &&
    Number.isFinite(destinationCoordinate.latitude) &&
    Number.isFinite(destinationCoordinate.longitude);

  const endpointLine = useMemo((): RoutePoint[] => {
    if (!hasCoords || !originCoordinate || !destinationCoordinate) return [];
    return [originCoordinate, destinationCoordinate];
  }, [
    hasCoords,
    originCoordinate?.latitude,
    originCoordinate?.longitude,
    destinationCoordinate?.latitude,
    destinationCoordinate?.longitude,
  ]);

  const polylineCoords = useMemo(
    () => (routePoints.length >= 2 ? routePoints : endpointLine),
    [routePoints, endpointLine]
  );

  const fitMapToRoute = useCallback(() => {
    if (!mapRef.current || polylineCoords.length < 2) return;
    mapRef.current.fitToCoordinates(polylineCoords, {
      edgePadding: { top: 40, right: 40, bottom: 64, left: 40 },
      animated: false,
    });
  }, [polylineCoords]);

  useEffect(() => {
    if (!hasCoords || !originCoordinate || !destinationCoordinate) {
      setRoutePoints([]);
      onRouteDurationRef.current?.(null);
      return;
    }

    let cancelled = false;
    onRouteDurationRef.current?.(null);
    (async () => {
      const route = await fetchDrivingRoute(
        { lat: originCoordinate.latitude, lng: originCoordinate.longitude },
        { lat: destinationCoordinate.latitude, lng: destinationCoordinate.longitude }
      );
      if (cancelled) return;
      const points =
        route.coordinates.length >= 2 ? route.coordinates : endpointLine;
      setRoutePoints(points);
      onRouteDurationRef.current?.(route.durationMinutes);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    hasCoords,
    originCoordinate?.latitude,
    originCoordinate?.longitude,
    destinationCoordinate?.latitude,
    destinationCoordinate?.longitude,
    endpointLine,
  ]);

  useEffect(() => {
    if (mapReady) fitMapToRoute();
  }, [mapReady, fitMapToRoute, polylineCoords]);

  const initialRegion = hasCoords
    ? {
        latitude: (originCoordinate!.latitude + destinationCoordinate!.latitude) / 2,
        longitude: (originCoordinate!.longitude + destinationCoordinate!.longitude) / 2,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      }
    : undefined;

  return (
    <View style={styles.heroCard}>
      {hasCoords && initialRegion ? (
        <MapView
          ref={mapRef}
          style={styles.heroMap}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={initialRegion}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          pointerEvents="none"
          onMapReady={() => setMapReady(true)}>
          {polylineCoords.length >= 2 && (
            <>
              <Polyline
                coordinates={polylineCoords}
                strokeColor={C.routeLineOutline}
                strokeWidth={9}
                lineCap="round"
                lineJoin="round"
              />
              <Polyline
                coordinates={polylineCoords}
                strokeColor={C.routeLine}
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
              />
            </>
          )}
          <Marker coordinate={originCoordinate!} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.heroMapMarkerOrigin} />
          </Marker>
          <Marker coordinate={destinationCoordinate!} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.heroMapMarkerDest} />
          </Marker>
        </MapView>
      ) : null}

      <View style={styles.heroMapOverlay} pointerEvents="none" />

      <View style={styles.heroContent} pointerEvents="none">
        <View style={styles.heroPlaces}>
          <View style={styles.heroPlacesRouteCol}>
            <View style={styles.heroPlaceDotOrigin} />
            <View style={styles.heroPlacesConnector} />
            <View style={styles.heroPlaceDotDest} />
          </View>
          <View style={styles.heroPlacesTextCol}>
            <View style={styles.heroPlaceBlock}>
              <Text style={styles.heroPlaceLabel}>ORIGEM</Text>
              <Text style={styles.heroPlaceText} numberOfLines={2}>
                {origin}
              </Text>
            </View>
            <View style={styles.heroPlaceBlock}>
              <Text style={styles.heroPlaceLabel}>DESTINO</Text>
              <Text style={styles.heroPlaceText} numberOfLines={2}>
                {destination}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.heroBottom}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{date}</Text>
          </View>
          <Text style={styles.heroTime}>{time}</Text>
        </View>
      </View>
    </View>
  );
}

export function RideRouteForecastCard({
  departureTime,
  durationMinutes,
  style,
}: {
  departureTime: string;
  durationMinutes: number | null;
  style?: object;
}) {
  const pickupTime = formatTimeFromIso(departureTime);
  const arrivalTime =
    departureTime && durationMinutes != null
      ? formatArrivalTime(departureTime, durationMinutes)
      : null;

  return (
    <View style={[styles.routeCard, style]}>
      <Text style={styles.sectionLabel}>ROTA</Text>
      <View style={styles.routeBody}>
        <View style={styles.routeLineContainer}>
          <View style={styles.routeDotOrigin} />
          <View style={styles.routeConnector} />
          <View style={styles.routeDotDest}>
            <View style={styles.routeDotDestInner} />
          </View>
        </View>
        <View style={styles.routeForecasts}>
          <View style={styles.routeForecastBlock}>
            <Text style={styles.routeForecastLabel}>Embarque previsto</Text>
            <Text style={styles.routeForecastTime}>{pickupTime}</Text>
          </View>
          <View style={styles.routeForecastBlock}>
            <Text style={styles.routeForecastLabel}>Chegada prevista</Text>
            <Text style={styles.routeForecastTime}>{arrivalTime ?? '…'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    height: 220,
    borderRadius: borderRadius.xl,
    backgroundColor: C.hero,
    overflow: 'hidden',
  },
  heroMap: {
    ...StyleSheet.absoluteFillObject,
  },
  heroMapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 33, 112, 0.52)',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing[5],
  },
  heroPlaces: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'stretch',
  },
  heroPlacesRouteCol: {
    width: 14,
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 4,
  },
  heroPlacesConnector: {
    flex: 1,
    width: 3,
    minHeight: 28,
    backgroundColor: C.routeLine,
    borderRadius: 2,
    marginVertical: 4,
  },
  heroPlacesTextCol: {
    flex: 1,
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  heroPlaceBlock: { gap: 2 },
  heroPlaceLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.8,
  },
  heroPlaceDotOrigin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#93C5FD',
    flexShrink: 0,
  },
  heroPlaceDotDest: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    flexShrink: 0,
  },
  heroPlaceText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 18,
  },
  heroMapMarkerOrigin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#93C5FD',
  },
  heroMapMarkerDest: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: C.primaryMid,
  },
  heroBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  heroBadge: {
    backgroundColor: C.primaryMid,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  heroBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTime: {
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
    color: '#fff',
  },
  routeCard: {
    flex: 1.4,
    backgroundColor: C.card,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    gap: spacing[4],
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 1,
  },
  routeBody: {
    flexDirection: 'row',
    gap: spacing[3],
    flex: 1,
  },
  routeLineContainer: {
    alignItems: 'center',
    paddingTop: spacing[1],
  },
  routeDotOrigin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: C.primary,
    backgroundColor: '#E0E8FF',
  },
  routeConnector: {
    flex: 1,
    width: 2,
    backgroundColor: C.border,
    marginVertical: spacing[1],
    minHeight: 24,
  },
  routeDotDest: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.primaryMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeDotDestInner: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#fff',
  },
  routeForecasts: {
    flex: 1,
    justifyContent: 'space-between',
  },
  routeForecastBlock: { gap: spacing[0.5] },
  routeForecastLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 0.5,
  },
  routeForecastTime: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    color: C.text,
  },
});
