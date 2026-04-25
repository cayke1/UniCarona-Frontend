import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { PrimaryButton } from '@/components/auth/primary-button';
import { useUser } from '@/contexts/user-context';
import { AUTH_MAX_CONTENT_WIDTH } from '@/constants/campus-ride-theme';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import { ApiError, formatApiValidationFields, ridesApi } from '@/lib/api';
import { geocodeAddressToPoint } from '@/lib/geocode-address';
import { parseDecimal } from '@/lib/parse-decimal';
import {
  defaultCostPerKm,
  distanceKmForPreview,
  estimateCostsFromDistanceKm,
  toDepartureIso,
  validateDepartureFuture,
} from '@/lib/publish-ride-helpers';

function formatBRL(reais: number): string {
  return reais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

type Estimation = {
  distanceKm: number;
  durationMin: number | null;
  estimatedTotalReais: number;
  costPerSeatReais: number;
  mode: 'route_api' | 'haversine';
};

export default function PublishRideScreen() {
  const { user, loading: userLoading } = useUser();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureAt, setDepartureAt] = useState('');
  const [seats, setSeats] = useState('3');
  const [originLat, setOriginLat] = useState<number | null>(null);
  const [originLng, setOriginLng] = useState<number | null>(null);
  const [destinationLat, setDestinationLat] = useState<number | null>(null);
  const [destinationLng, setDestinationLng] = useState<number | null>(null);
  const [estimation, setEstimation] = useState<Estimation | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const isDriver = user?.role === 'MOTORISTA';

  const runPreview = useCallback(async () => {
    if (!origin.trim() || !destination.trim()) {
      Toast.show({ type: 'info', text1: 'Preencha origem e destino para estimar.' });
      return;
    }
    const seatsNum = Number.parseInt(seats, 10);
    if (!Number.isFinite(seatsNum) || seatsNum < 1 || seatsNum > 8) {
      Toast.show({ type: 'error', text1: 'Informe de 1 a 8 vagas para estimar o custo por vaga.' });
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);
    setEstimation(null);

    try {
      const [o, d] = await Promise.all([
        geocodeAddressToPoint(origin.trim()),
        geocodeAddressToPoint(destination.trim()),
      ]);
      if (!o || !d) {
        setPreviewError(
          'Não foi possível localizar origem ou destino no mapa. Tente endereços mais completos (cidade, UF).'
        );
        return;
      }
      setOriginLat(o.latitude);
      setOriginLng(o.longitude);
      setDestinationLat(d.latitude);
      setDestinationLng(d.longitude);

      let routeKm: number | null = null;
      let durationMin: number | null = null;
      try {
        const route = await ridesApi.routeGeometry({
          originLat: o.latitude,
          originLng: o.longitude,
          destinationLat: d.latitude,
          destinationLng: d.longitude,
        });
        routeKm = route.distanceKm;
        durationMin = route.durationMinutes;
      } catch {
        /* POST /rides/route pode não existir no backend — usa Haversine */
      }

      const { distanceKm, mode } = distanceKmForPreview(
        o.latitude,
        o.longitude,
        d.latitude,
        d.longitude,
        routeKm
      );
      const { estimatedTotalCost, costPerSeat } = estimateCostsFromDistanceKm(distanceKm, seatsNum);

      setEstimation({
        distanceKm,
        durationMin,
        estimatedTotalReais: estimatedTotalCost,
        costPerSeatReais: costPerSeat,
        mode,
      });
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : 'Não foi possível calcular a estimativa.');
    } finally {
      setPreviewLoading(false);
    }
  }, [origin, destination, seats]);

  async function onSubmit() {
    if (!isDriver) return;
    if (!origin.trim() || !destination.trim()) {
      Toast.show({ type: 'error', text1: 'Origem e destino são obrigatórios.' });
      return;
    }
    const seatsNum = Number.parseInt(seats, 10);
    if (!Number.isFinite(seatsNum) || seatsNum < 1 || seatsNum > 8) {
      Toast.show({ type: 'error', text1: 'Número de vagas deve ser entre 1 e 8.' });
      return;
    }
    if (!departureAt.trim()) {
      Toast.show({ type: 'error', text1: 'Informe data e horário de partida.' });
      return;
    }

    const departureIso = toDepartureIso(departureAt);
    if (!departureIso) {
      Toast.show({
        type: 'error',
        text1: 'Data inválida',
        text2: 'Use formato ISO, ex.: 2026-04-22T15:00 ou 2026-04-22T15:00:00-03:00',
      });
      return;
    }
    const futureErr = validateDepartureFuture(departureIso);
    if (futureErr) {
      Toast.show({ type: 'error', text1: futureErr });
      return;
    }

    let oLat = originLat;
    let oLng = originLng;
    let dLat = destinationLat;
    let dLng = destinationLng;
    if (oLat == null || oLng == null || dLat == null || dLng == null) {
      Toast.show({
        type: 'info',
        text1: 'Geocodificando…',
        text2: 'Aguarde ou use “Pré-visualizar” antes para validar o endereço.',
      });
      const [o, d] = await Promise.all([
        geocodeAddressToPoint(origin.trim()),
        geocodeAddressToPoint(destination.trim()),
      ]);
      if (!o || !d) {
        Toast.show({
          type: 'error',
          text1: 'Não foi possível obter coordenadas',
          text2: 'Use “Pré-visualizar custo e distância” ou endereços mais completos.',
        });
        return;
      }
      oLat = o.latitude;
      oLng = o.longitude;
      dLat = d.latitude;
      dLng = d.longitude;
      setOriginLat(oLat);
      setOriginLng(oLng);
      setDestinationLat(dLat);
      setDestinationLng(dLng);
    }

    setSubmitLoading(true);
    try {
      const created = (await ridesApi.create({
        departureTime: departureIso,
        originAddress: origin.trim(),
        originLat: oLat,
        originLng: oLng,
        destinationAddress: destination.trim(),
        destinationLat: dLat,
        destinationLng: dLng,
        totalSeats: seatsNum,
      })) as Record<string, unknown>;
      const serverPerSeat = parseDecimal(created.costPerSeat);
      const serverKm = parseDecimal(created.distanceKm);
      Toast.show({
        type: 'success',
        text1: 'Carona publicada!',
        text2:
          serverPerSeat > 0
            ? `Servidor: ${formatBRL(serverPerSeat)}/vaga · ${serverKm > 0 ? `${serverKm.toFixed(1)} km` : ''}`
            : undefined,
      });
      router.replace('/(tabs)' as Href);
    } catch (e) {
      const fields = e instanceof ApiError ? formatApiValidationFields(e.body) : null;
      const msg =
        fields ??
        (e instanceof ApiError ? e.message : 'Não foi possível publicar. Tente novamente.');
      Toast.show({ type: 'error', text1: 'Não foi possível publicar', text2: msg });
    } finally {
      setSubmitLoading(false);
    }
  }

  if (userLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isDriver) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.blocked}>
          <Ionicons name="lock-closed-outline" size={40} color={colors.warning[600]} />
          <Text style={styles.blockedTitle}>Somente motoristas</Text>
          <Text style={styles.blockedText}>
            Torne-se motorista no perfil para publicar caronas.
          </Text>
          <PrimaryButton label="Ir para o perfil" onPress={() => router.replace('/(tabs)/profile' as Href)} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile' as Href))}
            hitSlop={12}
            style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.topTitle}>Publicar carona</Text>
          <View style={styles.topSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={styles.lead}>
              Informe origem e destino. Use a prévia para geocodificar e estimar custo (distância via API de
              rota quando disponível; caso contrário, distância em linha reta). O valor final da carona é
              calculado no servidor ao publicar.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Origem</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex.: Universidade Federal do Tocantins, Palmas"
                placeholderTextColor={colors.text.tertiary}
                value={origin}
                onChangeText={(t) => {
                  setOrigin(t);
                  setEstimation(null);
                  setOriginLat(null);
                  setOriginLng(null);
                }}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Destino</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex.: Terminal rodoviário de Palmas"
                placeholderTextColor={colors.text.tertiary}
                value={destination}
                onChangeText={(t) => {
                  setDestination(t);
                  setEstimation(null);
                  setDestinationLat(null);
                  setDestinationLng(null);
                }}
              />
            </View>

            <Pressable
              style={({ pressed }) => [styles.previewBtn, pressed && styles.previewBtnPressed]}
              onPress={() => void runPreview()}
              disabled={previewLoading}>
              {previewLoading ? (
                <ActivityIndicator color={colors.primary[700]} />
              ) : (
                <>
                  <Ionicons name="analytics-outline" size={20} color={colors.primary[700]} />
                  <Text style={styles.previewBtnLabel}>Pré-visualizar custo e distância</Text>
                </>
              )}
            </Pressable>

            {(estimation || previewError) && (
              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>Estimativa</Text>
                {previewError ? (
                  <Text style={styles.previewError}>{previewError}</Text>
                ) : estimation ? (
                  <>
                    <Text style={styles.previewHint}>
                      Tarifa referência: R$ {defaultCostPerKm().toFixed(2)}/km (defina EXPO_PUBLIC_COST_PER_KM
                      para igualar o servidor).
                    </Text>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewKey}>Distância</Text>
                      <Text style={styles.previewVal}>{estimation.distanceKm.toFixed(1)} km</Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewKey}>Tempo (aprox.)</Text>
                      <Text style={styles.previewVal}>
                        {estimation.durationMin != null ? `${Math.round(estimation.durationMin)} min` : '—'}
                      </Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewKey}>Origem da distância</Text>
                      <Text style={styles.previewVal}>
                        {estimation.mode === 'route_api' ? 'Rota (API)' : 'Linha reta'}
                      </Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewKey}>Custo total estimado</Text>
                      <Text style={styles.previewVal}>{formatBRL(estimation.estimatedTotalReais)}</Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewKey}>Por vaga ({seats} vaga{Number(seats) !== 1 ? 's' : ''})</Text>
                      <Text style={styles.previewVal}>{formatBRL(estimation.costPerSeatReais)}</Text>
                    </View>
                  </>
                ) : null}
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Partida (data e hora)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex.: 2026-04-22T15:00 ou 2026-04-22T15:00:00-03:00"
                placeholderTextColor={colors.text.tertiary}
                value={departureAt}
                onChangeText={setDepartureAt}
                autoCapitalize="none"
              />
              <Text style={styles.fieldHint}>Mínimo 15 minutos no futuro (regra do servidor).</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Vagas oferecidas</Text>
              <TextInput
                style={styles.input}
                placeholder="3"
                placeholderTextColor={colors.text.tertiary}
                value={seats}
                onChangeText={(t) => {
                  setSeats(t);
                  setEstimation(null);
                }}
                keyboardType="number-pad"
              />
            </View>

            <PrimaryButton label="Publicar carona" onPress={onSubmit} loading={submitLoading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
  },
  backBtn: {
    padding: spacing[1],
  },
  topTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  topSpacer: {
    width: 28,
  },
  scroll: {
    paddingBottom: spacing[10],
  },
  content: {
    width: '100%',
    maxWidth: AUTH_MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[4],
  },
  lead: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing[1],
  },
  field: {
    gap: spacing[1.5],
  },
  fieldHint: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: -4,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  input: {
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    minHeight: 52,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
  },
  previewBtnPressed: {
    opacity: 0.9,
  },
  previewBtnLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary[800],
  },
  previewCard: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.muted,
    padding: spacing[4],
    gap: spacing[2],
  },
  previewTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  previewHint: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: spacing[1],
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
  previewKey: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    flex: 1,
  },
  previewVal: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  previewError: {
    fontSize: typography.fontSize.sm,
    color: colors.error[700],
    lineHeight: 20,
  },
  blocked: {
    flex: 1,
    paddingHorizontal: spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  blockedTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  blockedText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing[2],
  },
});
