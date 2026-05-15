import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Ride, type PassengerRequest } from '@/types/ride';
import { ApiError, rideApi } from '@/lib/api';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  primary:        '#1A3FA0',
  primaryMid:     '#2563eb',
  primaryLight:   '#2E5BE8',
  accent:         colors.secondary[500],
  bg:             '#F4F6FB',
  card:           colors.neutral[0],
  text:           '#0D1B3E',
  textSub:        colors.neutral[500],
  textMuted:      colors.neutral[400],
  border:         colors.border.default,
  success:        colors.success[600],
  successBg:      colors.success[50],
  warningBg:      colors.warning[50],
  warningText:    colors.warning[700],
  hero:           '#0E2170',
  heroDim:        '#1A3FA0',
  shadow:         'rgba(26, 63, 160, 0.10)',
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDeparture(iso: string): { date: string; time: string } {
  if (!iso) return { date: '—', time: '—' };
  const d = new Date(iso);
  const isToday = d.toDateString() === new Date().toDateString();
  const date = isToday
    ? 'Hoje'
    : d.toLocaleDateString('pt-BR', { weekday: 'long', month: 'long', day: 'numeric' });
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

function driverInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function fmtBRL(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

// ─── Request Status Banner ────────────────────────────────────────────────────

function RequestStatusBanner({ status }: { status: PassengerRequest['status'] }) {
  const config = {
    pending: {
      icon: 'time-outline' as const,
      bg: C.warningBg,
      color: C.warningText,
      label: 'Aguardando confirmação do motorista',
    },
    awaiting_payment: {
      icon: 'wallet-outline' as const,
      bg: '#EEF2FF',
      color: C.primary,
      label: 'Motorista aceitou! Conclua o pagamento para garantir sua vaga.',
    },
    paid: {
      icon: 'checkmark-circle-outline' as const,
      bg: C.successBg,
      color: C.success,
      label: 'Pagamento confirmado. Sua vaga está garantida!',
    },
    accepted: {
      icon: 'checkmark-circle-outline' as const,
      bg: C.successBg,
      color: C.success,
      label: 'Vaga confirmada. Boa viagem!',
    },
    rejected: {
      icon: 'close-circle-outline' as const,
      bg: '#FEE2E2',
      color: '#DC2626',
      label: 'Sua solicitação foi recusada pelo motorista.',
    },
    cancelled: {
      icon: 'ban-outline' as const,
      bg: '#F3F4F6',
      color: '#6B7280',
      label: 'Você cancelou esta solicitação.',
    },
  }[status];

  return (
    <View style={[styles.statusBanner, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon} size={18} color={config.color} />
      <Text style={[styles.statusBannerText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

// ─── Join Modal ───────────────────────────────────────────────────────────────

type JoinStep = 'form' | 'preview' | 'submitting' | 'success';

type PreviewData = {
  seats: number;
  pricePerSeat: number;
  subtotal: number;
  appFee: number;
  total: number;
};

type JoinModalProps = {
  visible: boolean;
  ride: Ride;
  onClose: () => void;
  onSuccess: (requestId: string) => void;
};

function JoinModal({ visible, ride, onClose, onSuccess }: JoinModalProps) {
  const [step, setStep] = useState<JoinStep>('form');
  const [seats, setSeats] = useState(1);
  const [pickup, setPickup] = useState(ride.origin);
  const [dropoff, setDropoff] = useState(ride.destination);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [confirmedTotal, setConfirmedTotal] = useState(0);

  // Reset state when modal is re-opened
  useEffect(() => {
    if (!visible) {
      setStep('form');
      setSeats(1);
      setPickup(ride.origin);
      setDropoff(ride.destination);
      setPreview(null);
      setConfirmedTotal(0);
    }
  }, [visible, ride.origin, ride.destination]);

  function handleCalculate() {
    if (!pickup.trim() || !dropoff.trim()) {
      Alert.alert('Atenção', 'Informe os pontos de embarque e desembarque.');
      return;
    }
    const subtotal = ride.price * seats;
    const appFee = subtotal * 0.1;
    setPreview({ seats, pricePerSeat: ride.price, subtotal, appFee, total: subtotal + appFee });
    setStep('preview');
  }

  async function handleConfirm() {
    if (!preview) return;
    setStep('submitting');
    try {
      const result = await rideApi.joinRequest(ride.id, {
        requestedSeats: seats,
        pickupLocation: pickup.trim(),
        dropoffLocation: dropoff.trim(),
        pickupLat: ride.originCoordinate?.latitude,
        pickupLng: ride.originCoordinate?.longitude,
        dropoffLat: ride.destinationCoordinate?.latitude,
        dropoffLng: ride.destinationCoordinate?.longitude,
      });
      const rec = result as Record<string, unknown>;
      const requestId = typeof rec.id === 'string' ? rec.id : '';
      const total =
        typeof rec.totalCharged === 'number' ? rec.totalCharged :
        typeof rec.estimatedCost === 'number' ? rec.estimatedCost :
        preview.total;
      setConfirmedTotal(total);
      onSuccess(requestId);
      setStep('success');
    } catch (err) {
      setStep('preview');
      if (err instanceof ApiError) {
        const errorMap: Record<number, [string, string]> = {
          400: ['Vagas insuficientes', 'A carona não tem vagas suficientes para sua solicitação.'],
          409: ['Solicitação duplicada', 'Você já possui uma solicitação ativa para esta carona.'],
          404: ['Carona não encontrada', 'Esta carona não está mais disponível.'],
        };
        const [title, msg] = errorMap[err.status] ?? ['Erro', err.message];
        Alert.alert(title, msg);
      } else {
        Alert.alert('Erro', 'Não foi possível solicitar a carona. Tente novamente.');
      }
    }
  }

  const canClose = step !== 'submitting';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={canClose ? onClose : undefined}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={canClose ? onClose : undefined}
        />

        <View style={styles.modalSheet}>
          <View style={styles.sheetHandle} />

          {/* ── Step: form ── */}
          {step === 'form' && (
            <>
              <Text style={styles.sheetTitle}>Solicitar Carona</Text>

              <View style={styles.stepperSection}>
                <Text style={styles.stepperLabel}>Quantidade de vagas</Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={[styles.stepperBtn, seats <= 1 && styles.stepperBtnDisabled]}
                    onPress={() => setSeats((s) => Math.max(s - 1, 1))}
                    disabled={seats <= 1}
                    activeOpacity={0.7}>
                    <Ionicons name="remove" size={20} color={seats <= 1 ? C.textMuted : C.primary} />
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{seats}</Text>
                  <TouchableOpacity
                    style={[styles.stepperBtn, seats >= ride.availableSeats && styles.stepperBtnDisabled]}
                    onPress={() => setSeats((s) => Math.min(s + 1, ride.availableSeats))}
                    disabled={seats >= ride.availableSeats}
                    activeOpacity={0.7}>
                    <Ionicons
                      name="add"
                      size={20}
                      color={seats >= ride.availableSeats ? C.textMuted : C.primary}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.stepperHint}>
                  {ride.availableSeats} vaga{ride.availableSeats !== 1 ? 's' : ''} disponível{ride.availableSeats !== 1 ? 'is' : ''}
                </Text>
              </View>

              <View style={styles.locationsSection}>
                <View style={styles.locationField}>
                  <View style={styles.locationDotOrigin} />
                  <TextInput
                    style={styles.locationInput}
                    value={pickup}
                    onChangeText={setPickup}
                    placeholder="Ponto de embarque"
                    placeholderTextColor={C.textMuted}
                  />
                </View>
                <View style={styles.locationDivider} />
                <View style={styles.locationField}>
                  <Ionicons name="location" size={16} color={C.primary} />
                  <TextInput
                    style={styles.locationInput}
                    value={dropoff}
                    onChangeText={setDropoff}
                    placeholder="Ponto de desembarque"
                    placeholderTextColor={C.textMuted}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.confirmBtn} onPress={handleCalculate} activeOpacity={0.85}>
                <Ionicons name="calculator-outline" size={20} color="#fff" />
                <Text style={styles.confirmBtnText}>Ver custo estimado</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Step: preview / submitting ── */}
          {(step === 'preview' || step === 'submitting') && preview && (
            <>
              <View style={styles.previewHeader}>
                {step === 'preview' && (
                  <TouchableOpacity onPress={() => setStep('form')} style={styles.previewBackBtn} activeOpacity={0.7}>
                    <Ionicons name="arrow-back" size={20} color={C.text} />
                  </TouchableOpacity>
                )}
                <Text style={[styles.sheetTitle, step === 'submitting' && { flex: 1, textAlign: 'center' }]}>
                  Confirmar custo
                </Text>
                {step === 'preview' && <View style={{ width: 32 }} />}
              </View>

              <View style={styles.feeCard}>
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>{preview.seats} vaga{preview.seats > 1 ? 's' : ''} × R$ {fmtBRL(preview.pricePerSeat)}</Text>
                  <Text style={styles.feeValue}>R$ {fmtBRL(preview.subtotal)}</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Taxa de serviço (10%)</Text>
                  <Text style={styles.feeValue}>R$ {fmtBRL(preview.appFee)}</Text>
                </View>
                <View style={styles.feeDivider} />
                <View style={styles.feeRow}>
                  <Text style={styles.feeTotalLabel}>Total estimado</Text>
                  <Text style={styles.feeTotalValue}>R$ {fmtBRL(preview.total)}</Text>
                </View>
              </View>

              <View style={styles.previewLocations}>
                <Text style={styles.previewLocLabel}>
                  Embarque: <Text style={styles.previewLocValue}>{pickup}</Text>
                </Text>
                <Text style={styles.previewLocLabel}>
                  Desembarque: <Text style={styles.previewLocValue}>{dropoff}</Text>
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.confirmBtn, step === 'submitting' && styles.confirmBtnLoading]}
                onPress={handleConfirm}
                disabled={step === 'submitting'}
                activeOpacity={0.85}>
                {step === 'submitting' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    <Text style={styles.confirmBtnText}>Confirmar Solicitação</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* ── Step: success ── */}
          {step === 'success' && (
            <>
              <View style={styles.successBlock}>
                <Ionicons name="checkmark-circle" size={64} color={C.success} />
                <Text style={styles.successTitle}>Solicitação enviada!</Text>
                <Text style={styles.successSubtitle}>
                  O motorista foi notificado e irá confirmar em breve.
                </Text>
                <View style={[styles.feeCard, { width: '100%' }]}>
                  <View style={styles.feeRow}>
                    <Text style={styles.feeTotalLabel}>Total cobrado</Text>
                    <Text style={styles.feeTotalValue}>R$ {fmtBRL(confirmedTotal)}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.confirmBtn} onPress={() => router.back()} activeOpacity={0.85}>
                <Ionicons name="map-outline" size={20} color="#fff" />
                <Text style={styles.confirmBtnText}>Voltar ao mapa</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Hero Card ────────────────────────────────────────────────────────────────

function HeroCard({ origin, destination, date, time }: {
  origin: string;
  destination: string;
  date: string;
  time: string;
}) {
  return (
    <View style={styles.heroCard}>
      {/* Decorative circles imitating map rings */}
      <View style={styles.heroCircle1} />
      <View style={styles.heroCircle2} />
      <View style={styles.heroCircle3} />

      {/* Route path dots */}
      <View style={styles.heroRouteLine}>
        <View style={styles.heroRouteDotOrigin} />
        <View style={styles.heroRouteConnector} />
        <View style={styles.heroRouteDotDest} />
      </View>

      {/* Bottom overlay info */}
      <View style={styles.heroBottom}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>{date}</Text>
        </View>
        <Text style={styles.heroTime}>{time}</Text>
      </View>
    </View>
  );
}

// ─── Route Card ───────────────────────────────────────────────────────────────

function RouteCard({ origin, destination }: { origin: string; destination: string }) {
  return (
    <View style={styles.routeCard}>
      <Text style={styles.sectionLabel}>ROTA</Text>
      <View style={styles.routeBody}>
        {/* Vertical connector */}
        <View style={styles.routeLineContainer}>
          <View style={styles.routeDotOrigin} />
          <View style={styles.routeConnector} />
          <View style={styles.routeDotDest}>
            <View style={styles.routeDotDestInner} />
          </View>
        </View>
        {/* Addresses */}
        <View style={styles.routeAddresses}>
          <View style={styles.routeAddressBlock}>
            <Text style={styles.routeAddressLabel}>ORIGEM</Text>
            <Text style={styles.routeAddressText} numberOfLines={2}>{origin}</Text>
          </View>
          <View style={styles.routeAddressBlock}>
            <Text style={styles.routeAddressLabel}>DESTINO</Text>
            <Text style={styles.routeAddressText} numberOfLines={2}>{destination}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Price Card ───────────────────────────────────────────────────────────────

function PriceCard({ price, availableSeats, totalSeats }: {
  price: number;
  availableSeats: number;
  totalSeats: number;
}) {
  return (
    <View style={styles.priceCard}>
      <View>
        <Text style={styles.priceLabel}>CONTRIBUIÇÃO</Text>
        <Text style={styles.priceValue}>R$ {fmtBRL(price)}</Text>
      </View>
      <View style={styles.priceDivider} />
      <View style={styles.seatsRow}>
        <View style={styles.seatsInfo}>
          <Text style={styles.seatsLabel}>VAGAS</Text>
          <Text style={styles.seatsValue}>{availableSeats}/{totalSeats} disponíveis</Text>
        </View>
        <Ionicons name="people" size={32} color="rgba(255,255,255,0.4)" />
      </View>
    </View>
  );
}

// ─── Driver Card ──────────────────────────────────────────────────────────────

function DriverCard({ driver }: { driver: Ride['driver'] }) {
  const initials = driverInitials(driver.name);
  return (
    <View style={styles.driverCard}>
      <View style={styles.driverCardContent}>
        <View style={styles.driverAvatarWrap}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverAvatarText}>{initials}</Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success[500]} />
          </View>
        </View>
        <View style={styles.driverMeta}>
          <Text style={styles.driverName}>{driver.name}</Text>
          {driver.vehicle && (
            <Text style={styles.driverVehicle}>{driver.vehicle}</Text>
          )}
          {driver.rating != null && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#FBBF24" />
              <Text style={styles.ratingText}>{driver.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Details Grid ─────────────────────────────────────────────────────────────

function DetailsGrid({ ride, filledSeats }: { ride: Ride; filledSeats: number }) {
  const accepted = (ride.passengerRequests ?? []).filter(
    (r) => r.status === 'accepted' || r.status === 'paid'
  );
  const emptySlots = Math.max(0, ride.totalSeats - 1 - accepted.length);

  return (
    <View style={styles.detailsGrid}>
      {/* Vehicle */}
      <View style={styles.detailCard}>
        <View style={styles.detailCardHeader}>
          <Ionicons name="car-outline" size={14} color={C.textMuted} />
          <Text style={styles.sectionLabel}>VEÍCULO</Text>
        </View>
        {ride.driver.vehicle ? (
          <Text style={styles.vehicleName}>{ride.driver.vehicle}</Text>
        ) : (
          <Text style={[styles.vehicleName, { color: C.textMuted }]}>Não informado</Text>
        )}
      </View>

      {/* Passengers */}
      <View style={styles.detailCard}>
        <View style={styles.detailCardHeader}>
          <Ionicons name="people-outline" size={14} color={C.textMuted} />
          <Text style={styles.sectionLabel}>PASSAGEIROS</Text>
        </View>
        <View style={styles.passengersRow}>
          {accepted.map((p) => (
            <View key={p.id} style={styles.passengerAvatar}>
              <Text style={styles.passengerAvatarText}>{p.initials}</Text>
            </View>
          ))}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.passengerSlotEmpty}>
              <Ionicons name="person-add-outline" size={16} color={C.textMuted} />
            </View>
          ))}
        </View>
        <Text style={styles.passengerCount}>{filledSeats}/{ride.totalSeats - 1} vagas ocupadas</Text>
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Props = { ride: Ride; userId: string };

export default function PassengerRideScreen({ ride, userId }: Props) {
  const myRequest      = ride.passengerRequests?.find((r) => r.userId === userId);
  const [requestStatus, setRequestStatus] = useState<PassengerRequest['status'] | null>(
    myRequest?.status ?? null
  );
  const [myRequestId, setMyRequestId]     = useState(myRequest?.id ?? null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [cancelling, setCancelling]       = useState(false);

  useEffect(() => {
    const r = ride.passengerRequests?.find((x) => x.userId === userId);
    if (r) {
      setRequestStatus(r.status);
      setMyRequestId(r.id);
    }
  }, [ride.passengerRequests, userId]);

  const { date, time }  = formatDeparture(ride.departureTime);
  const filledSeats     = ride.totalSeats - ride.availableSeats;
  const shortId         = ride.id.slice(-4).toUpperCase();
  const isOpen          = ride.status === 'open' && ride.availableSeats > 0;

  async function handleCancel() {
    if (!myRequestId) return;
    Alert.alert('Cancelar solicitação', 'Tem certeza que deseja cancelar?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim, cancelar',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await rideApi.cancelRequest(myRequestId);
            setRequestStatus(null);
            setMyRequestId(null);
            Toast.show({ type: 'info', text1: 'Solicitação cancelada.' });
          } catch (err) {
            Alert.alert('Erro', err instanceof ApiError ? err.message : 'Não foi possível cancelar');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Carona</Text>
        <View style={styles.rideBadge}>
          <Text style={styles.rideBadgeText}>#{shortId}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {requestStatus && <RequestStatusBanner status={requestStatus} />}

        {/* ── Hero ── */}
        <HeroCard
          origin={ride.origin}
          destination={ride.destination}
          date={date}
          time={time}
        />

        {/* ── Route + Price row ── */}
        <View style={styles.bento}>
          <RouteCard origin={ride.origin} destination={ride.destination} />
          <PriceCard
            price={ride.price}
            availableSeats={ride.availableSeats}
            totalSeats={ride.totalSeats}
          />
        </View>

        {/* ── Driver ── */}
        <DriverCard driver={ride.driver} />

        {/* ── Vehicle + Passengers ── */}
        <DetailsGrid ride={ride} filledSeats={filledSeats} />

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Sticky CTA ── */}
      <View style={styles.ctaContainer}>
        {(requestStatus === null || requestStatus === 'cancelled') && isOpen && (
          <TouchableOpacity
            style={styles.ctaPrimary}
            onPress={() => setShowJoinModal(true)}
            activeOpacity={0.85}>
            <Ionicons name="car-sport-outline" size={20} color="#fff" />
            <Text style={styles.ctaText}>Solicitar Carona</Text>
          </TouchableOpacity>
        )}

        {requestStatus === 'pending' && (
          <TouchableOpacity
            style={styles.ctaSecondary}
            onPress={handleCancel}
            disabled={cancelling}
            activeOpacity={0.85}>
            {cancelling ? (
              <ActivityIndicator color={C.primary} />
            ) : (
              <>
                <Ionicons name="close-outline" size={20} color={C.primary} />
                <Text style={styles.ctaSecondaryText}>Cancelar Solicitação</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {requestStatus === 'awaiting_payment' && myRequestId && (
          <TouchableOpacity
            style={styles.ctaPrimary}
            onPress={() => router.push(`/ride/${ride.id}/checkout?requestId=${myRequestId}`)}
            activeOpacity={0.85}>
            <Ionicons name="card-outline" size={20} color="#fff" />
            <Text style={styles.ctaText}>Ir para pagamento</Text>
          </TouchableOpacity>
        )}

        {(requestStatus === 'paid' || requestStatus === 'accepted') && (
          <View style={[styles.ctaPrimary, { backgroundColor: C.success }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.ctaText}>
              {requestStatus === 'paid' ? 'Pagamento confirmado' : 'Vaga confirmada'}
            </Text>
          </View>
        )}

        {!isOpen && (requestStatus === null || requestStatus === 'cancelled') && (
          <View style={[styles.ctaPrimary, { backgroundColor: C.textMuted }]}>
            <Ionicons name="lock-closed-outline" size={20} color="#fff" />
            <Text style={styles.ctaText}>Embarque Fechado</Text>
          </View>
        )}
      </View>

      <JoinModal
        visible={showJoinModal}
        ride={ride}
        onClose={() => setShowJoinModal(false)}
        onSuccess={(requestId) => {
          setShowJoinModal(false);
          setRequestStatus('pending');
          setMyRequestId(requestId);
        }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing[4], paddingTop: spacing[3], gap: spacing[3] },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    backgroundColor: C.bg,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: '800',
    color: C.text,
  },
  rideBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1],
  },
  rideBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: C.primary,
    letterSpacing: 0.5,
  },

  // Status banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2.5],
    borderRadius: borderRadius.md,
    padding: spacing[3],
  },
  statusBannerText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    lineHeight: 18,
  },

  // ── Hero ──
  heroCard: {
    height: 200,
    borderRadius: borderRadius.xl,
    backgroundColor: C.hero,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: spacing[5],
  },
  heroCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    top: -80,
    right: -80,
  },
  heroCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    top: -30,
    right: -30,
  },
  heroCircle3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(46,91,232,0.25)',
    top: 20,
    right: 40,
  },
  heroRouteLine: {
    position: 'absolute',
    left: spacing[5],
    top: spacing[5],
    alignItems: 'center',
  },
  heroRouteDotOrigin: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  heroRouteConnector: {
    width: 2,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 4,
  },
  heroRouteDotDest: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.primaryMid,
    borderWidth: 2,
    borderColor: '#fff',
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

  // ── Bento row ──
  bento: {
    flexDirection: 'row',
    gap: spacing[3],
  },

  // Route card
  routeCard: {
    flex: 1.4,
    backgroundColor: C.card,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    gap: spacing[4],
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
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
  routeAddresses: {
    flex: 1,
    justifyContent: 'space-between',
  },
  routeAddressBlock: { gap: spacing[0.5] },
  routeAddressLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 1,
  },
  routeAddressText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: C.text,
    lineHeight: 18,
  },

  // Price card
  priceCard: {
    flex: 1,
    backgroundColor: C.primaryMid,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    justifyContent: 'space-between',
    shadowColor: 'rgba(37,99,235,0.35)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 6,
  },
  priceLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginBottom: spacing[0.5],
  },
  priceValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 28,
  },
  priceDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: spacing[3],
  },
  seatsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  seatsInfo: { gap: spacing[0.5] },
  seatsLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  seatsValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: '#fff',
  },

  // Driver card
  driverCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  driverCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  driverAvatarWrap: { position: 'relative' },
  driverAvatar: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.md,
    backgroundColor: '#E0E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverAvatarText: {
    fontSize: typography.fontSize.xl,
    fontWeight: '800',
    color: C.primary,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: C.card,
    borderRadius: borderRadius.full,
    padding: 2,
  },
  driverMeta: { flex: 1, gap: spacing[1] },
  driverName: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    color: C.text,
  },
  driverVehicle: {
    fontSize: typography.fontSize.sm,
    color: C.textSub,
    fontStyle: 'italic',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[0.5],
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: '#92400E',
  },

  // Section label
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 1.2,
  },

  // Details grid
  detailsGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  detailCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    gap: spacing[3],
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  vehicleName: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: C.text,
  },
  passengersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  passengerAvatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: '#E0E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerAvatarText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '700',
    color: C.primary,
  },
  passengerSlotEmpty: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: C.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerCount: {
    fontSize: typography.fontSize.xs,
    color: C.textMuted,
  },

  // CTA footer
  ctaContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
    paddingTop: spacing[3],
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  ctaPrimary: {
    backgroundColor: C.primaryMid,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2.5],
    shadowColor: 'rgba(37,99,235,0.35)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 6,
  },
  ctaText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  ctaSecondary: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2.5],
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: C.border,
  },
  ctaSecondaryText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',
    color: C.primary,
  },

  // Modal
  modalOverlay:  { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[10],
    paddingTop: spacing[3],
    gap: spacing[5],
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginBottom: spacing[1],
  },
  sheetTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.3,
  },
  stepperSection: { gap: spacing[2] },
  stepperLabel:   { fontSize: typography.fontSize.sm, fontWeight: '600', color: C.text },
  stepperRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing[5] },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: { backgroundColor: C.bg },
  stepperValue: {
    fontSize: 28,
    fontWeight: '800',
    color: C.primary,
    minWidth: 36,
    textAlign: 'center',
  },
  stepperHint: { fontSize: typography.fontSize.xs, color: C.textSub },

  locationsSection: {
    backgroundColor: C.bg,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    gap: spacing[1],
  },
  locationField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[1.5],
  },
  locationDotOrigin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.primary,
    backgroundColor: '#E0E8FF',
  },
  locationDivider: { height: 1, backgroundColor: C.border, marginLeft: spacing[6] },
  locationInput: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
    color: C.text,
    paddingVertical: 0,
  },

  feeCard: {
    backgroundColor: C.bg,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    gap: spacing[2.5],
  },
  feeRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeLabel:      { fontSize: typography.fontSize.sm, color: C.textSub },
  feeValue:      { fontSize: typography.fontSize.sm, fontWeight: '600', color: C.text },
  feeDivider:    { height: 1, backgroundColor: C.border },
  feeTotalLabel: { fontSize: typography.fontSize.base, fontWeight: '700', color: C.text },
  feeTotalValue: { fontSize: typography.fontSize.md, fontWeight: '900', color: C.primary },

  confirmBtn: {
    backgroundColor: C.primaryLight,
    borderRadius: borderRadius.md,
    paddingVertical: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2.5],
  },
  confirmBtnLoading: { opacity: 0.75 },
  confirmBtnText: { fontSize: typography.fontSize.base, fontWeight: '700', color: '#fff' },

  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewBackBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  previewLocations: { gap: spacing[1.5] },
  previewLocLabel: { fontSize: typography.fontSize.sm, color: C.textSub, fontWeight: '500' },
  previewLocValue: { color: C.text, fontWeight: '600' },

  successBlock: { alignItems: 'center', gap: spacing[3] },
  successTitle: { fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  successSubtitle: {
    fontSize: typography.fontSize.sm,
    color: C.textSub,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing[2],
  },
});
