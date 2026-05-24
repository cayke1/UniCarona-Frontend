import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Ride, PassengerRequest } from '@/types/ride';
import { ApiError, rideApi } from '@/lib/api';
import {
  RideMapHeroCard,
  RideRouteForecastCard,
  formatHeroDeparture,
} from '@/components/ride-route-map';

// ─── Colors ──────────────────────────────────────────────────────────────────

const C = {
  primary: '#1A3FA0',
  primaryLight: '#2E5BE8',
  accent: '#F97316',
  bg: '#F4F6FB',
  card: '#FFFFFF',
  text: '#0D1B3E',
  textSub: '#6B7A99',
  textMuted: '#9BA8C0',
  border: '#E8EDF5',
  success: '#16A34A',
  toggleTrack: '#22C55E',
  occupancyFill: '#2E5BE8',
  occupancyEmpty: '#D6DCF0',
  bottomCard: '#1A3FA0',
  avatarBg1: '#D1FAE5',
  avatarBg2: '#1E3A5F',
  declineBg: '#F0F2F8',
  declineText: '#4B5680',
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function Avatar({
  initials,
  bgColor,
  textColor,
  size = 48,
}: {
  initials: string;
  bgColor: string;
  textColor: string;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.avatarContainer,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor },
      ]}>
      <Text style={[styles.avatarText, { color: textColor, fontSize: size * 0.33 }]}>
        {initials}
      </Text>
      <View style={styles.verifiedBadge}>
        <Ionicons name="checkmark-circle" size={14} color={C.success} />
      </View>
    </View>
  );
}

function OccupancyDots({ filled, total }: { filled: number; total: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, { backgroundColor: i < filled ? C.occupancyFill : C.occupancyEmpty }]}
        />
      ))}
    </View>
  );
}

function PassengerCard({
  passenger,
  index,
  onAccept,
  onDecline,
  isLocked,
}: {
  passenger: PassengerRequest;
  index: number;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  isLocked: boolean;
}) {
  const bgColor = index % 2 === 0 ? C.avatarBg1 : C.avatarBg2;
  const textColor = index % 2 === 0 ? C.success : '#FFFFFF';
  return (
    <View style={styles.passengerCard}>
      <View style={styles.passengerTop}>
        <Avatar initials={passenger.initials} bgColor={bgColor} textColor={textColor} size={52} />
        <View style={styles.passengerInfo}>
          <Text style={styles.passengerName}>{passenger.name}</Text>
          {passenger.course ? (
            <Text style={styles.passengerCourse}>{passenger.course}</Text>
          ) : null}
        </View>
        <View style={styles.priceBlock}>
          <Text style={styles.priceText}>R$ {passenger.pricePerSeat.toFixed(2).replace('.', ',')} × {passenger.requestedSeats}</Text>
          <Text style={styles.priceLabel}>Valor fixo</Text>
        </View>
      </View>
      <View style={styles.passengerActions}>
        <TouchableOpacity
          style={[styles.declineBtn, isLocked && styles.btnDisabled]}
          onPress={() => !isLocked && onDecline(passenger.id)}
          activeOpacity={isLocked ? 1 : 0.75}
          disabled={isLocked}>
          <Text style={[styles.declineBtnText, isLocked && styles.btnDisabledText]}>Recusar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.acceptBtn, isLocked && styles.btnDisabled]}
          onPress={() => !isLocked && onAccept(passenger.id)}
          activeOpacity={isLocked ? 1 : 0.8}
          disabled={isLocked}>
          <Text style={[styles.acceptBtnText, isLocked && styles.btnDisabledText]}>Aceitar Solicitação</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// ─── Main Component ───────────────────────────────────────────────────────────

type Props = { ride: Ride };

export default function DriverRideScreen({ ride }: Props) {
  const [bookingOpen, setBookingOpen] = useState(
    ride.acceptingRequests ?? ride.status === 'open'
  );
  const [freezeEnabled, setFreezeEnabled] = useState(false);
  const [requests, setRequests] = useState<PassengerRequest[]>(
    ride.passengerRequests?.filter((r) => r.status === 'pending') ?? []
  );
  const [availableSeats, setAvailableSeats] = useState(ride.availableSeats);
  const [toggling, setToggling] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [completing, setCompleting] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [routeDurationMinutes, setRouteDurationMinutes] = useState<number | null>(null);

  const handleRouteDuration = useCallback((minutes: number | null) => {
    setRouteDurationMinutes(minutes);
  }, []);

  useEffect(() => {
    setRequests(ride.passengerRequests?.filter((r) => r.status === 'pending') ?? []);
    setAvailableSeats(ride.availableSeats);
    setBookingOpen(ride.acceptingRequests ?? ride.status === 'open');
  }, [ride]);

  async function executeCompleteRide() {
    setCompleting(true);
    try {
      await rideApi.completeRide(ride.id);
      router.back();
    } catch (err) {
      Alert.alert('Erro', err instanceof ApiError ? err.message : 'Não foi possível encerrar a viagem');
    } finally {
      setCompleting(false);
    }
  }

  function handleCompleteRide() {
    if (Platform.OS === 'web') {
      setShowCompleteConfirm(true);
    } else {
      Alert.alert(
        'Encerrar viagem',
        'Confirma que a viagem foi concluída? Esta ação não pode ser desfeita.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Encerrar', style: 'destructive', onPress: executeCompleteRide },
        ]
      );
    }
  }

  const now = Date.now();
  const departureMs = new Date(ride.departureTime).getTime();
  const departureValid = Number.isFinite(departureMs);
  const isAfterDeparture = departureValid && now >= departureMs;
  const isInFreezeWindow =
    departureValid &&
    freezeEnabled &&
    now >= departureMs - 30 * 60 * 1000 &&
    now < departureMs;
  /** Só bloqueia na UI se o motorista ativou o bloqueio 30 min antes; após partida a API decide. */
  const isLocked = isInFreezeWindow;

  const { date: dateStr, time: timeStr } = formatHeroDeparture(ride.departureTime);
  const filledSeats = ride.totalSeats - availableSeats;
  const shortId = ride.id.slice(-4).toUpperCase();

  async function handleToggleBooking(value: boolean) {
    setToggling(true);
    try {
      await rideApi.toggleBooking(ride.id, value);
      setBookingOpen(value);
    } catch (err) {
      Alert.alert('Erro', err instanceof ApiError ? err.message : 'Não foi possível alterar o status');
    } finally {
      setToggling(false);
    }
  }

  function addProcessing(id: string) {
    setProcessingIds((prev) => new Set(prev).add(id));
  }
  function removeProcessing(id: string) {
    setProcessingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }

  async function handleAccept(requestId: string) {
    if (isLocked || processingIds.has(requestId)) return;
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    addProcessing(requestId);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    setAvailableSeats((prev) => Math.max(0, prev - req.requestedSeats));

    try {
      await rideApi.acceptPassenger(requestId);
    } catch (err) {
      setRequests((prev) => [...prev, req]);
      setAvailableSeats((prev) => prev + req.requestedSeats);
      Alert.alert('Erro', err instanceof ApiError ? err.message : 'Não foi possível aceitar');
    } finally {
      removeProcessing(requestId);
    }
  }

  async function handleDecline(requestId: string) {
    if (isLocked || processingIds.has(requestId)) return;
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    addProcessing(requestId);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));

    try {
      await rideApi.rejectPassenger(requestId);
    } catch (err) {
      setRequests((prev) => [...prev, req]);
      Alert.alert('Erro', err instanceof ApiError ? err.message : 'Não foi possível recusar');
    } finally {
      removeProcessing(requestId);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerLabel}>MOTORISTA</Text>
          <Text style={styles.headerTitle}>Minha Carona</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        <RideMapHeroCard
          origin={ride.origin}
          destination={ride.destination}
          date={dateStr}
          time={timeStr}
          originCoordinate={ride.originCoordinate}
          destinationCoordinate={ride.destinationCoordinate}
          onRouteDuration={handleRouteDuration}
        />

        <View style={styles.bento}>
          <RideRouteForecastCard
            departureTime={ride.departureTime}
            durationMinutes={routeDurationMinutes}
          />
          <View style={styles.rideIdCard}>
            <Text style={styles.rideIdLabel}>CARONA</Text>
            <Text style={styles.rideIdValue}>#{shortId}</Text>
          </View>
        </View>

        {/* ── Occupancy & Status Row ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.statLabel}>OCUPAÇÃO</Text>
            <View style={styles.occupancyRow}>
              <Text style={styles.occupancyNumber}>{filledSeats}</Text>
              <Text style={styles.occupancyTotal}>/{ride.totalSeats}</Text>
            </View>
            <OccupancyDots filled={filledSeats} total={ride.totalSeats} />
          </View>

          <View style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.statLabel}>EMBARQUE</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusText}>
                {bookingOpen ? 'Aberto' : 'Fechado'}
              </Text>
              <Switch
                value={bookingOpen}
                onValueChange={handleToggleBooking}
                disabled={toggling}
                trackColor={{ false: C.occupancyEmpty, true: C.toggleTrack }}
                thumbColor="#FFFFFF"
                style={styles.switch}
              />
            </View>
          </View>
        </View>

        {/* ── Time-Based Freeze ── */}
        <View style={styles.freezeCard}>
          <View style={styles.freezeIconWrap}>
            <Ionicons name="timer-outline" size={22} color={C.accent} />
          </View>
          <View style={styles.freezeInfo}>
            <Text style={styles.freezeTitle}>Bloqueio por Horário</Text>
            <Text style={styles.freezeSubtitle}>Para solicitações 30 min antes</Text>
          </View>
          <TouchableOpacity
            onPress={() => setFreezeEnabled(!freezeEnabled)}
            style={[styles.freezeCheckbox, freezeEnabled && styles.freezeCheckboxActive]}
            activeOpacity={0.8}>
            {freezeEnabled && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>

        {/* ── Lock Banner ── */}
        {isLocked && (
          <View style={styles.lockBanner}>
            <Ionicons name="lock-closed-outline" size={16} color="#B45309" />
            <Text style={styles.lockBannerText}>
              {isAfterDeparture
                ? 'Esta carona já partiu — ações bloqueadas'
                : 'Ações bloqueadas 30 min antes da partida'}
            </Text>
          </View>
        )}

        {/* ── Passenger Requests ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Solicitações</Text>
          {requests.length > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{requests.length} PENDENTE{requests.length > 1 ? 'S' : ''}</Text>
            </View>
          )}
        </View>

        {requests.map((passenger, index) => (
          <PassengerCard
            key={passenger.id}
            passenger={passenger}
            index={index}
            onAccept={handleAccept}
            onDecline={handleDecline}
            isLocked={isLocked}
          />
        ))}

        {requests.length === 0 && (
          <View style={styles.emptyRequests}>
            <Ionicons name="people-outline" size={32} color={C.textMuted} />
            <Text style={styles.emptyText}>Nenhuma solicitação pendente</Text>
          </View>
        )}

        {/* ── Earnings Bottom Card ── */}
        <View style={styles.earningsCard}>
          <View>
            <Text style={styles.earningsLabel}>VALOR POR VAGA</Text>
            <Text style={styles.earningsAmount}>R$ {ride.price.toFixed(2).replace('.', ',')}</Text>
          </View>
          {ride.driver.rating != null && (
            <View style={styles.ratingBlock}>
              <Text style={styles.ratingValue}>{ride.driver.rating.toFixed(1)} ★</Text>
              <Text style={styles.ratingLabel}>SUA NOTA</Text>
            </View>
          )}
        </View>

        {isAfterDeparture && ride.status !== 'completed' && (
          <TouchableOpacity
            style={[styles.completeButton, completing && styles.completeButtonDisabled]}
            onPress={handleCompleteRide}
            disabled={completing}
            activeOpacity={0.8}
          >
            <Ionicons name="flag-outline" size={20} color="#fff" />
            <Text style={styles.completeButtonText}>
              {completing ? 'Encerrando…' : 'Encerrar viagem'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Confirmação web (Alert.alert não funciona no browser) */}
      <Modal
        visible={showCompleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompleteConfirm(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Encerrar viagem</Text>
            <Text style={styles.modalMessage}>
              Confirma que a viagem foi concluída? Esta ação não pode ser desfeita.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowCompleteConfirm(false)}
                activeOpacity={0.75}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, completing && styles.completeButtonDisabled]}
                onPress={async () => { setShowCompleteConfirm(false); await executeCompleteRide(); }}
                disabled={completing}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmText}>{completing ? 'Encerrando…' : 'Encerrar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: C.bg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: C.textSub,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.primary,
    letterSpacing: -0.3,
    textAlign: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },

  bento: {
    flexDirection: 'row',
    gap: 12,
  },
  rideIdCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 20,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  rideIdLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  rideIdValue: {
    fontSize: 22,
    fontWeight: '800',
    color: C.primary,
    letterSpacing: 0.5,
  },

  statsRow: { flexDirection: 'row' },
  statCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  occupancyRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 },
  occupancyNumber: { fontSize: 32, fontWeight: '800', color: C.primary, letterSpacing: -1 },
  occupancyTotal: { fontSize: 16, fontWeight: '600', color: C.textMuted, marginLeft: 2 },
  dotsRow: { flexDirection: 'row', gap: 5 },
  dot: { flex: 1, height: 5, borderRadius: 3 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statusText: { fontSize: 14, fontWeight: '700', color: C.text, flex: 1 },
  switch: { transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] },

  freezeCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  freezeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF4ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  freezeInfo: { flex: 1 },
  freezeTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  freezeSubtitle: { fontSize: 12, color: C.textSub, marginTop: 2 },
  freezeCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
  },
  freezeCheckboxActive: { backgroundColor: C.primary, borderColor: C.primary },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: C.text, letterSpacing: -0.3 },
  pendingBadge: {
    backgroundColor: C.accent,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  passengerCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    gap: 16,
  },
  passengerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: { fontWeight: '800', letterSpacing: -0.5 },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerInfo: { flex: 1 },
  passengerName: { fontSize: 16, fontWeight: '700', color: C.text, letterSpacing: -0.2 },
  passengerCourse: { fontSize: 13, color: C.textSub, marginTop: 2 },
  priceBlock: { alignItems: 'flex-end' },
  priceText: { fontSize: 16, fontWeight: '800', color: C.primary },
  priceLabel: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  passengerActions: { flexDirection: 'row', gap: 10 },
  declineBtn: {
    flex: 1,
    backgroundColor: C.declineBg,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  declineBtnText: { fontSize: 14, fontWeight: '700', color: C.declineText },
  acceptBtn: {
    flex: 2,
    backgroundColor: C.primaryLight,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  acceptBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  lockBannerText: { fontSize: 13, fontWeight: '600', color: '#B45309', flex: 1 },

  btnDisabled: { backgroundColor: '#E5E7EB', borderColor: '#E5E7EB' },
  btnDisabledText: { color: '#9CA3AF' },

  emptyRequests: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 14, color: C.textMuted },

  earningsCard: {
    backgroundColor: C.bottomCard,
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  earningsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  earningsAmount: { fontSize: 30, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1 },
  ratingBlock: { alignItems: 'flex-end' },
  ratingValue: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  ratingLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
    marginTop: 4,
  },

  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  completeButtonDisabled: {
    backgroundColor: '#FCA5A5',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0D1B3E', letterSpacing: -0.3 },
  modalMessage: { fontSize: 14, color: '#6B7A99', lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancel: {
    flex: 1,
    backgroundColor: '#F0F2F8',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: '#4B5680' },
  modalConfirm: {
    flex: 1,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
