import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Ride } from '@/types/ride';
import { ApiError, rideApi } from '@/lib/api';

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
  successBg: '#DCFCE7',
  warningBg: '#FFF7ED',
  warningText: '#C2410C',
  shadow: 'rgba(26, 63, 160, 0.10)',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDeparture(iso: string): { date: string; time: string } {
  if (!iso) return { date: '—', time: '—' };
  const d = new Date(iso);
  const date = d.toLocaleDateString('pt-BR', { weekday: 'long', month: 'long', day: 'numeric' });
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

function driverInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// ─── Route Snapshot ───────────────────────────────────────────────────────────

function RouteSnapshot({ origin, destination }: { origin: string; destination: string }) {
  return (
    <View style={styles.routeSnapshot}>
      <View style={styles.routeSnapshotRow}>
        <View style={styles.routeDotOrigin} />
        <View style={styles.routeTextBlock}>
          <Text style={styles.routeSnapshotLabel}>ORIGEM</Text>
          <Text style={styles.routeSnapshotLocation} numberOfLines={2}>{origin}</Text>
        </View>
      </View>

      <View style={styles.routeSnapshotLine}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={i} style={styles.routeSnapshotDash} />
        ))}
      </View>

      <View style={styles.routeSnapshotRow}>
        <View style={styles.routeDotDest}>
          <Ionicons name="location" size={12} color="#FFFFFF" />
        </View>
        <View style={styles.routeTextBlock}>
          <Text style={styles.routeSnapshotLabel}>DESTINO</Text>
          <Text style={styles.routeSnapshotLocation} numberOfLines={2}>{destination}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Request Status Banner ────────────────────────────────────────────────────

function RequestStatusBanner({ status }: { status: 'pending' | 'accepted' | 'rejected' }) {
  const config = {
    pending: {
      icon: 'time-outline' as const,
      bg: C.warningBg,
      color: C.warningText,
      label: 'Solicitação enviada — aguardando confirmação do motorista',
    },
    accepted: {
      icon: 'checkmark-circle-outline' as const,
      bg: C.successBg,
      color: C.success,
      label: 'Sua vaga está confirmada! Boa viagem.',
    },
    rejected: {
      icon: 'close-circle-outline' as const,
      bg: '#FEE2E2',
      color: '#DC2626',
      label: 'Sua solicitação foi recusada pelo motorista.',
    },
  }[status];

  return (
    <View style={[styles.statusBanner, { backgroundColor: config.bg }]}>
      <Ionicons name={config.icon} size={20} color={config.color} />
      <Text style={[styles.statusBannerText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type Props = { ride: Ride; userId: string };

export default function PassengerRideScreen({ ride, userId }: Props) {
  const myRequest = ride.passengerRequests?.find((r) => r.userId === userId);
  const [requestStatus, setRequestStatus] = useState(myRequest?.status ?? null);
  const [loading, setLoading] = useState(false);

  const { date: dateStr, time: timeStr } = formatDeparture(ride.departureTime);
  const filledSeats = ride.totalSeats - ride.availableSeats;
  const shortId = ride.id.slice(-4).toUpperCase();
  const isOpen = ride.status === 'open' && ride.availableSeats > 0;

  async function handleJoin() {
    setLoading(true);
    try {
      await rideApi.joinRequest(ride.id);
      setRequestStatus('pending');
    } catch (err) {
      Alert.alert('Erro', err instanceof ApiError ? err.message : 'Não foi possível solicitar a carona');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    Alert.alert('Cancelar solicitação', 'Tem certeza que deseja cancelar?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim, cancelar',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await rideApi.cancelRequest(ride.id);
            setRequestStatus(null);
          } catch (err) {
            Alert.alert('Erro', err instanceof ApiError ? err.message : 'Não foi possível cancelar');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
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

        {/* ── Status Banner ── */}
        {requestStatus && <RequestStatusBanner status={requestStatus} />}

        {/* ── Route Snapshot ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rota</Text>
          <RouteSnapshot origin={ride.origin} destination={ride.destination} />
        </View>

        {/* ── Driver Info ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Motorista</Text>
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>{driverInitials(ride.driver.name)}</Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{ride.driver.name}</Text>
              {ride.driver.vehicle && (
                <Text style={styles.driverVehicle}>
                  <Ionicons name="car-outline" size={13} color={C.textSub} /> {ride.driver.vehicle}
                </Text>
              )}
            </View>
            {ride.driver.rating != null && (
              <View style={styles.ratingChip}>
                <Ionicons name="star" size={14} color="#FBBF24" />
                <Text style={styles.ratingText}>{ride.driver.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Ride Details ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalhes</Text>
          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={18} color={C.primary} />
              <View>
                <Text style={styles.detailLabel}>DATA</Text>
                <Text style={styles.detailValue}>{dateStr}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={18} color={C.primary} />
              <View>
                <Text style={styles.detailLabel}>HORÁRIO</Text>
                <Text style={styles.detailValue}>{timeStr}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={18} color={C.primary} />
              <View>
                <Text style={styles.detailLabel}>VAGAS</Text>
                <Text style={styles.detailValue}>
                  {ride.availableSeats} livre{ride.availableSeats !== 1 ? 's' : ''} de {ride.totalSeats}
                </Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="cash-outline" size={18} color={C.primary} />
              <View>
                <Text style={styles.detailLabel}>VALOR</Text>
                <Text style={styles.detailValue}>R$ {ride.price.toFixed(2).replace('.', ',')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Occupancy Bar ── */}
        <View style={styles.occupancyCard}>
          <View style={styles.occupancyHeader}>
            <Text style={styles.occupancyLabel}>Ocupação</Text>
            <Text style={styles.occupancyCount}>{filledSeats}/{ride.totalSeats}</Text>
          </View>
          <View style={styles.occupancyBar}>
            <View
              style={[
                styles.occupancyFill,
                { width: `${(filledSeats / ride.totalSeats) * 100}%` as any },
              ]}
            />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Sticky CTA ── */}
      <View style={styles.ctaContainer}>
        {requestStatus === null && isOpen && (
          <TouchableOpacity
            style={styles.ctaPrimary}
            onPress={handleJoin}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="car-sport-outline" size={20} color="#FFFFFF" />
                <Text style={styles.ctaPrimaryText}>Solicitar Carona</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {requestStatus === 'pending' && (
          <TouchableOpacity
            style={styles.ctaDanger}
            onPress={handleCancel}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color={C.primary} />
            ) : (
              <>
                <Ionicons name="close-outline" size={20} color={C.primary} />
                <Text style={styles.ctaDangerText}>Cancelar Solicitação</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {requestStatus === 'accepted' && (
          <View style={[styles.ctaPrimary, { backgroundColor: C.success }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.ctaPrimaryText}>Vaga Confirmada</Text>
          </View>
        )}

        {!isOpen && requestStatus === null && (
          <View style={[styles.ctaPrimary, { backgroundColor: C.textMuted }]}>
            <Ionicons name="lock-closed-outline" size={20} color="#FFFFFF" />
            <Text style={styles.ctaPrimaryText}>Embarque Fechado</Text>
          </View>
        )}
      </View>
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
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  rideBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  rideBadgeText: { fontSize: 11, fontWeight: '700', color: C.primary, letterSpacing: 0.5 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },

  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    padding: 14,
  },
  statusBannerText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },

  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 20,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    gap: 16,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },

  routeSnapshot: { gap: 4 },
  routeSnapshotRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  routeDotOrigin: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: C.primary,
    backgroundColor: '#E0E8FF',
    marginTop: 3,
    flexShrink: 0,
  },
  routeDotDest: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
    flexShrink: 0,
  },
  routeTextBlock: { flex: 1 },
  routeSnapshotLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: C.textMuted,
    letterSpacing: 1,
    marginBottom: 2,
  },
  routeSnapshotLocation: { fontSize: 16, fontWeight: '700', color: C.text, lineHeight: 22 },
  routeSnapshotLine: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingLeft: 7,
    gap: 3,
    marginVertical: 4,
  },
  routeSnapshotDash: { width: 2, height: 4, backgroundColor: C.border, borderRadius: 1 },

  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  driverAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E0E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverAvatarText: { fontSize: 18, fontWeight: '800', color: C.primary },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 17, fontWeight: '700', color: C.text },
  driverVehicle: { fontSize: 13, color: C.textSub, marginTop: 3 },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ratingText: { fontSize: 14, fontWeight: '700', color: '#92400E' },

  detailGrid: { gap: 14 },
  detailItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  detailLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: C.textMuted,
    letterSpacing: 1,
    marginBottom: 2,
  },
  detailValue: { fontSize: 15, fontWeight: '600', color: C.text },

  occupancyCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 18,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    gap: 10,
  },
  occupancyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  occupancyLabel: { fontSize: 14, fontWeight: '600', color: C.text },
  occupancyCount: { fontSize: 14, fontWeight: '700', color: C.primary },
  occupancyBar: {
    height: 8,
    backgroundColor: '#D6DCF0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  occupancyFill: { height: '100%', backgroundColor: C.primaryLight, borderRadius: 4 },

  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  ctaPrimary: {
    backgroundColor: C.primaryLight,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaPrimaryText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  ctaDanger: {
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  ctaDangerText: { fontSize: 16, fontWeight: '700', color: C.primary },
});
