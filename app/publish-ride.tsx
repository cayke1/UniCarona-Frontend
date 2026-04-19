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
import { ApiError, ridesApi } from '@/lib/api';
import {
  formatMoneyFromCents,
  normalizePreviewPayload,
  type RidePreview,
} from '@/lib/user-types';

function parsePriceToCents(raw: string): number | undefined {
  const t = raw.trim().replace(/\s/g, '').replace(',', '.');
  if (!t) return undefined;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n * 100);
}

function emptyPreview(): RidePreview {
  return {
    distanceKm: null,
    durationMin: null,
    suggestedPriceCents: null,
    fuelCostCents: null,
  };
}

export default function PublishRideScreen() {
  const { user, loading: userLoading } = useUser();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureAt, setDepartureAt] = useState('');
  const [seats, setSeats] = useState('3');
  const [price, setPrice] = useState('');
  const [preview, setPreview] = useState<RidePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const isDriver = user?.role === 'MOTORISTA';

  const runPreview = useCallback(async () => {
    if (!origin.trim() || !destination.trim()) {
      Toast.show({ type: 'info', text1: 'Preencha origem e destino para estimar.' });
      return;
    }
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await ridesApi.preview({
        originAddress: origin.trim(),
        destinationAddress: destination.trim(),
      });
      setPreview(normalizePreviewPayload(res));
    } catch (e) {
      setPreview(emptyPreview());
      if (e instanceof ApiError && e.status === 404) {
        setPreviewError('Pré-visualização não disponível no servidor. Informe valores manualmente.');
      } else {
        const msg =
          e instanceof ApiError ? e.message : 'Não foi possível calcular a rota agora.';
        setPreviewError(msg);
      }
    } finally {
      setPreviewLoading(false);
    }
  }, [origin, destination]);

  async function onSubmit() {
    if (!isDriver) return;
    if (!origin.trim() || !destination.trim()) {
      Toast.show({ type: 'error', text1: 'Origem e destino são obrigatórios.' });
      return;
    }
    if (!departureAt.trim()) {
      Toast.show({ type: 'error', text1: 'Informe data e horário de partida.' });
      return;
    }
    const seatsNum = Number.parseInt(seats, 10);
    if (!Number.isFinite(seatsNum) || seatsNum < 1) {
      Toast.show({ type: 'error', text1: 'Número de vagas inválido.' });
      return;
    }
    const priceCents = parsePriceToCents(price);

    setSubmitLoading(true);
    try {
      await ridesApi.create({
        originAddress: origin.trim(),
        destinationAddress: destination.trim(),
        departureAt: departureAt.trim(),
        seatsOffered: seatsNum,
        priceCents,
      });
      Toast.show({ type: 'success', text1: 'Carona publicada!' });
      router.replace('/(tabs)/profile' as Href);
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : 'Não foi possível publicar. Tente novamente.';
      Toast.show({ type: 'error', text1: 'Erro', text2: msg });
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
              Informe origem e destino (endereço ou ponto de referência). Você pode estimar rota e
              custo antes de publicar.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Origem</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex.: Campus — portão principal"
                placeholderTextColor={colors.text.tertiary}
                value={origin}
                onChangeText={setOrigin}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Destino</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex.: Terminal rodoviário"
                placeholderTextColor={colors.text.tertiary}
                value={destination}
                onChangeText={setDestination}
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

            {(preview || previewError) && (
              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>Estimativa</Text>
                {previewError ? (
                  <Text style={styles.previewError}>{previewError}</Text>
                ) : (
                  <>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewKey}>Distância</Text>
                      <Text style={styles.previewVal}>
                        {preview?.distanceKm != null
                          ? `${preview.distanceKm.toFixed(1)} km`
                          : '—'}
                      </Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewKey}>Tempo (aprox.)</Text>
                      <Text style={styles.previewVal}>
                        {preview?.durationMin != null ? `${Math.round(preview.durationMin)} min` : '—'}
                      </Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewKey}>Sugestão de preço</Text>
                      <Text style={styles.previewVal}>
                        {formatMoneyFromCents(preview?.suggestedPriceCents ?? null)}
                      </Text>
                    </View>
                    <View style={styles.previewRow}>
                      <Text style={styles.previewKey}>Custo estimado (combustível)</Text>
                      <Text style={styles.previewVal}>
                        {formatMoneyFromCents(preview?.fuelCostCents ?? null)}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Partida (ISO ou texto livre)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex.: 2026-04-20T14:30:00-03:00"
                placeholderTextColor={colors.text.tertiary}
                value={departureAt}
                onChangeText={setDepartureAt}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.row2}>
              <View style={[styles.field, styles.rowItem]}>
                <Text style={styles.label}>Vagas</Text>
                <TextInput
                  style={styles.input}
                  placeholder="3"
                  placeholderTextColor={colors.text.tertiary}
                  value={seats}
                  onChangeText={setSeats}
                  keyboardType="number-pad"
                />
              </View>
              <View style={[styles.field, styles.rowItem]}>
                <Text style={styles.label}>Preço (R$) opcional</Text>
                <TextInput
                  style={styles.input}
                  placeholder="15,00"
                  placeholderTextColor={colors.text.tertiary}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                />
              </View>
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
  row2: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  rowItem: {
    flex: 1,
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
