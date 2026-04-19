import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError, rideApi } from '@/lib/api';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Ride, RideStatus, PassengerRequest } from '@/types/ride';
import DriverRideScreen from '@/components/DriverRideScreen';
import PassengerRideScreen from '@/components/PassengerRideScreen';

// ─── Normalizer ───────────────────────────────────────────────────────────────

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== 'object') return null;
  return v as Record<string, unknown>;
}

function normalizeRide(payload: Record<string, unknown>): Ride | null {
  const root = asRecord(payload.data) ?? asRecord(payload.ride) ?? payload;

  const rawId = root.id ?? root._id;
  const id = typeof rawId === 'string' ? rawId : String(rawId ?? '');
  if (!id) return null;

  const driverRaw = asRecord(root.driver) ?? {};
  const driver = {
    id: String(driverRaw.id ?? driverRaw._id ?? ''),
    name: typeof driverRaw.name === 'string' ? driverRaw.name : '',
    rating: typeof driverRaw.rating === 'number' ? driverRaw.rating : undefined,
    vehicle: typeof driverRaw.vehicle === 'string' ? driverRaw.vehicle : undefined,
  };

  const validStatuses: RideStatus[] = ['open', 'full', 'in_progress', 'completed', 'cancelled'];
  const rawStatus = typeof root.status === 'string' ? root.status : '';
  const status: RideStatus = validStatuses.includes(rawStatus as RideStatus)
    ? (rawStatus as RideStatus)
    : 'open';

  const coordsOrigin =
    asRecord(root.originCoordinate) ?? asRecord(root.origin_coordinate);
  const coordsDest =
    asRecord(root.destinationCoordinate) ?? asRecord(root.destination_coordinate);

  const rawRequests = Array.isArray(root.passengerRequests)
    ? root.passengerRequests
    : Array.isArray(root.requests)
    ? root.requests
    : [];

  const passengerRequests: PassengerRequest[] = rawRequests
    .map((r: unknown): PassengerRequest | null => {
      const req = asRecord(r);
      if (!req) return null;
      const userObj = asRecord(req.user);
      const name =
        typeof req.name === 'string'
          ? req.name
          : typeof userObj?.name === 'string'
          ? userObj.name
          : '';
      const initials =
        typeof req.initials === 'string'
          ? req.initials
          : name
              .split(' ')
              .slice(0, 2)
              .map((w: string) => w[0] ?? '')
              .join('')
              .toUpperCase() || '??';
      const reqStatus =
        req.status === 'accepted' || req.status === 'rejected' ? req.status : 'pending';
      return {
        id: String(req.id ?? req._id ?? ''),
        userId: String(userObj?.id ?? userObj?._id ?? req.userId ?? ''),
        name,
        initials,
        course: typeof req.course === 'string' ? req.course : undefined,
        price:
          typeof req.price === 'number'
            ? req.price
            : typeof root.price === 'number'
            ? root.price
            : 0,
        verified: Boolean(req.verified),
        status: reqStatus,
      };
    })
    .filter((r): r is PassengerRequest => r !== null);

  return {
    id,
    driver,
    origin: typeof root.origin === 'string' ? root.origin : '',
    destination: typeof root.destination === 'string' ? root.destination : '',
    originCoordinate: coordsOrigin
      ? { latitude: Number(coordsOrigin.latitude), longitude: Number(coordsOrigin.longitude) }
      : undefined,
    destinationCoordinate: coordsDest
      ? { latitude: Number(coordsDest.latitude), longitude: Number(coordsDest.longitude) }
      : undefined,
    departureTime:
      typeof root.departureTime === 'string'
        ? root.departureTime
        : typeof root.departure_time === 'string'
        ? root.departure_time
        : '',
    availableSeats:
      typeof root.availableSeats === 'number'
        ? root.availableSeats
        : typeof root.available_seats === 'number'
        ? root.available_seats
        : 0,
    totalSeats:
      typeof root.totalSeats === 'number'
        ? root.totalSeats
        : typeof root.total_seats === 'number'
        ? root.total_seats
        : 4,
    price: typeof root.price === 'number' ? root.price : 0,
    status,
    passengerRequests,
  };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, loading: userLoading } = useCurrentUser();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    rideApi
      .getById(id)
      .then((data) => {
        const normalized = normalizeRide(data);
        if (!normalized) throw new Error('Dados da carona inválidos');
        setRide(normalized);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : 'Erro ao carregar carona');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || userLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#0284C7" />
      </SafeAreaView>
    );
  }

  if (error || !ride || !user) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Carona não encontrada'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isDriver = user.role === 'driver' && ride.driver.id === user.id;
  if (isDriver) return <DriverRideScreen ride={ride} />;
  return <PassengerRideScreen ride={ride} userId={user.id} />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#F4F6FB',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
  },
  backBtnText: { fontSize: 14, fontWeight: '700', color: '#1A3FA0' },
});
