import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError, rideApi } from '@/lib/api';
import { useUser } from '@/contexts/user-context';
import { isDriverUser } from '@/lib/user-types';
import { Ride } from '@/types/ride';
import { normalizeRideDetailPayload } from '@/lib/normalize-ride-detail';
import DriverRideScreen from '@/components/DriverRideScreen';
import PassengerRideScreen from '@/components/PassengerRideScreen';

export default function RideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, loading: userLoading } = useUser();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    rideApi
      .getById(id)
      .then((data) => {
        const normalized = normalizeRideDetailPayload(data as Record<string, unknown>);
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
        <ActivityIndicator size="large" color="#1A3FA0" />
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

  const isDriver = isDriverUser(user) && ride.driver.id === user.id;
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
