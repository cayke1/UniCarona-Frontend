import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError, rideApi } from '@/lib/api';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Ride } from '@/types/ride';
import { normalizeRideDetailPayload } from '@/lib/normalize-ride-detail';
import DriverRideScreen from '@/components/DriverRideScreen';
import PassengerRideScreen from '@/components/PassengerRideScreen';

export default function RideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, loading: userLoading } = useCurrentUser();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await rideApi.getById(id);
      const normalized = normalizeRideDetailPayload(data as Record<string, unknown>);
      if (!normalized) throw new Error('Dados da carona inválidos');
      setRide(normalized);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar carona');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => {
    void load();

    if (!id) return;
    let active = true;
    let abort: AbortController | null = null;

    const poll = async () => {
      while (active) {
        abort = new AbortController();
        try {
          const data = await rideApi.poll(id, abort.signal);
          if (!active) break;
          if (data) {
            const normalized = normalizeRideDetailPayload(data);
            if (normalized) setRide(normalized);
            else setRide(null); // carona cancelada/encerrada
          }
          // data === null → 304, sem mudança, re-faz imediatamente
        } catch {
          if (!active) break;
          // erro de rede: aguarda antes de tentar novamente
          await new Promise<void>((r) => setTimeout(r, 5_000));
        }
      }
    };

    void poll();

    return () => {
      active = false;
      abort?.abort();
    };
  }, [id, load]));

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
