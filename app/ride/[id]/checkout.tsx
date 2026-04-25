import { useLocalSearchParams, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError, paymentsApi, rideApi } from '@/lib/api';
import { normalizeRideDetailPayload } from '@/lib/normalize-ride-detail';
import { parseDecimal } from '@/lib/parse-decimal';
import type { Ride } from '@/types/ride';
import {
  CheckoutErrorBlock,
  CheckoutHeader,
  CheckoutProcessingView,
  CheckoutReviewScroll,
  CheckoutSuccessScroll,
  type CheckoutReviewData,
  type CheckoutSuccessData,
} from '@/components/checkout/CheckoutProfessionalUI';

const BG = '#E8EDF7';
const MIN_CHECKOUT_MS = 1400;

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== 'object') return null;
  return v as Record<string, unknown>;
}

type Step = 'review' | 'processing' | 'success' | 'error';

export default function RideCheckoutScreen() {
  const { id: rideId, requestId } = useLocalSearchParams<{ id: string; requestId: string }>();
  const [step, setStep] = useState<Step>('review');
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [subtotal, setSubtotal] = useState(0);
  const [appFee, setAppFee] = useState(0);
  const [total, setTotal] = useState(0);
  const [seats, setSeats] = useState(1);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [ride, setRide] = useState<Ride | null>(null);
  const [successNote, setSuccessNote] = useState<string | undefined>(undefined);

  const load = useCallback(async () => {
    if (!rideId || !requestId) return;
    setLoadingRequest(true);
    setNetworkError(null);
    try {
      const raw = (await rideApi.getRequest(requestId)) as Record<string, unknown>;
      const status = typeof raw.status === 'string' ? raw.status.toUpperCase() : '';
      if (status !== 'AWAITING_PAYMENT') {
        setNetworkError('Esta solicitação não está aguardando pagamento.');
        setStep('error');
        return;
      }
      setSubtotal(parseDecimal(raw.estimatedCost));
      setAppFee(parseDecimal(raw.appFee));
      setTotal(parseDecimal(raw.totalCharged));
      const rs = raw.requestedSeats;
      setSeats(typeof rs === 'number' ? rs : typeof rs === 'string' ? parseInt(rs, 10) || 1 : 1);

      const rideNested = asRecord(raw.ride);
      let normalized: Ride | null = rideNested
        ? normalizeRideDetailPayload({
            ...rideNested,
            id: typeof rideNested.id === 'string' ? rideNested.id : rideId,
          })
        : null;
      if (!normalized) {
        const ridePayload = await rideApi.getById(rideId);
        normalized = normalizeRideDetailPayload(ridePayload as Record<string, unknown>);
      }
      setRide(normalized);
    } catch (e) {
      setNetworkError(
        e instanceof ApiError ? e.message : 'Não foi possível carregar os dados do pagamento.'
      );
      setStep('error');
    } finally {
      setLoadingRequest(false);
    }
  }, [rideId, requestId]);

  useEffect(() => {
    void load();
  }, [load]);

  const reviewData: CheckoutReviewData | null = useMemo(() => {
    if (!ride || !rideId || !requestId) return null;
    return {
      rideIdShort: rideId.slice(-4).toUpperCase(),
      requestIdShort: requestId.slice(-6).toUpperCase(),
      departureIso: ride.departureTime,
      origin: ride.origin,
      destination: ride.destination,
      driverName: ride.driver.name,
      seats,
      pricePerSeat: seats > 0 ? subtotal / seats : ride.price,
      subtotal,
      appFee,
      total,
    };
  }, [ride, rideId, requestId, seats, subtotal, appFee, total]);

  const successData: CheckoutSuccessData | null = useMemo(() => {
    if (!ride || !rideId) return null;
    return {
      rideIdShort: rideId.slice(-4).toUpperCase(),
      origin: ride.origin,
      destination: ride.destination,
      driverName: ride.driver.name,
      total,
      seats,
      mockNote: successNote,
    };
  }, [ride, rideId, total, seats, successNote]);

  async function handleConfirmPayment() {
    if (!requestId) return;
    setStep('processing');
    setNetworkError(null);
    setSuccessNote(undefined);
    try {
      await new Promise<void>((resolve) => setTimeout(resolve, MIN_CHECKOUT_MS));

      let mockRouteAvailable = false;
      try {
        await paymentsApi.mock(requestId);
        mockRouteAvailable = true;
      } catch (e) {
        if (e instanceof ApiError && (e.status === 404 || e.status === 405)) {
          mockRouteAvailable = false;
        } else {
          throw e;
        }
      }

      const after = (await rideApi.getRequest(requestId)) as Record<string, unknown>;
      const st = typeof after.status === 'string' ? after.status.toUpperCase() : '';

      if (st === 'PAID') {
        setSubtotal(parseDecimal(after.estimatedCost));
        setAppFee(parseDecimal(after.appFee));
        setTotal(parseDecimal(after.totalCharged));
        setSuccessNote(undefined);
        setStep('success');
        return;
      }

      if (!mockRouteAvailable) {
        setSuccessNote(
          'Sem POST /api/payments/mock no backend, o pedido continua AWAITING_PAYMENT no servidor. Os valores do resumo vêm do GET /requests (estimatedCost, appFee, totalCharged).'
        );
        setStep('success');
        return;
      }

      setNetworkError(
        'A rota de pagamento respondeu, mas o pedido não está PAID. Confira se o backend atualiza o status após o mock.'
      );
      setStep('error');
    } catch (e) {
      setNetworkError(
        e instanceof ApiError ? e.message : 'Falha de rede ou servidor indisponível. Tente de novo.'
      );
      setStep('error');
    }
  }

  function handleRetry() {
    setStep('review');
    setNetworkError(null);
    setSuccessNote(undefined);
    void load();
  }

  if (!rideId || !requestId) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: BG }]} edges={['top', 'bottom']}>
        <CheckoutHeader title="Checkout" subtitle="Link inválido" onBack={() => router.back()} />
        <View style={styles.center}>
          <Text style={styles.errTitle}>Faltam parâmetros da carona ou da solicitação.</Text>
          <TouchableOpacity style={styles.linkBtn} onPress={() => router.back()}>
            <Text style={styles.linkBtnText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loadingRequest && step === 'review') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: BG }]} edges={['top', 'bottom']}>
        <CheckoutHeader title="Checkout" subtitle="Campus Ride" onBack={() => router.back()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1A3FA0" />
          <Text style={styles.loadingHint}>Carregando pedido e valores…</Text>
          <Text style={styles.loadingSub}>Conferindo solicitação com o servidor</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: BG }]} edges={['top', 'bottom']}>
      <CheckoutHeader
        title={step === 'success' ? 'Confirmação' : step === 'processing' ? 'Pagamento' : 'Checkout'}
        subtitle="Campus Ride · pagamento seguro (mock)"
        onBack={() => router.back()}
      />

      {step === 'review' && reviewData && (
        <CheckoutReviewScroll data={reviewData} onConfirm={handleConfirmPayment} />
      )}

      {step === 'processing' && <CheckoutProcessingView />}

      {step === 'success' && successData && (
        <CheckoutSuccessScroll
          data={successData}
          onDone={() => router.replace(`/ride/${rideId}`)}
          doneLabel="Voltar para a carona"
        />
      )}

      {step === 'error' && (
        <CheckoutErrorBlock
          message={networkError ?? 'Algo deu errado.'}
          onRetry={handleRetry}
          onBack={() => router.back()}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  loadingHint: { fontSize: 16, fontWeight: '800', color: '#0D1B3E', marginTop: 12 },
  loadingSub: { fontSize: 13, color: '#6B7A99' },
  errTitle: { fontSize: 15, color: '#5C6B8C', textAlign: 'center', lineHeight: 22 },
  linkBtn: { marginTop: 12, paddingVertical: 12, paddingHorizontal: 20 },
  linkBtnText: { fontSize: 16, fontWeight: '800', color: '#1A3FA0' },
});
