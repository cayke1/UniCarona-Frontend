import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError, ridesApi, userApi } from '@/lib/api';
import { useUser } from '@/contexts/user-context';
import type { DriverRide, DriverRideHistory, MyRequest } from '@/types/ride';

// ─── Status config ────────────────────────────────────────────────────────────

const REQUEST_STATUS: Record<
  MyRequest['status'],
  { label: string; color: string; bg: string; icon: React.ComponentProps<typeof Ionicons>['name'] }
> = {
  PENDING:          { label: 'Aguardando',       color: '#D97706', bg: '#FEF3C7', icon: 'time-outline' },
  ACCEPTED:         { label: 'Aceita',            color: '#16A34A', bg: '#DCFCE7', icon: 'checkmark-circle-outline' },
  AWAITING_PAYMENT: { label: 'Aguard. pagto.',    color: '#2563EB', bg: '#EFF6FF', icon: 'card-outline' },
  PAID:             { label: 'Confirmada',        color: '#15803D', bg: '#DCFCE7', icon: 'checkmark-done-outline' },
  REJECTED:         { label: 'Recusada',          color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle-outline' },
  CANCELLED:        { label: 'Cancelada',         color: '#6B7280', bg: '#F3F4F6', icon: 'ban-outline' },
};

const FAB_SIZE = 50;
const FAB_MARGIN = 20;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function fmtBRL(v: unknown) {
  const n =
    typeof v === 'number' && Number.isFinite(v)
      ? v
      : typeof v === 'string' && v.trim()
        ? Number(v.replace(',', '.'))
        : NaN;
  if (!Number.isFinite(n)) return 'R$ —';
  return `R$ ${n.toFixed(2).replace('.', ',')}`;
}

// ─── Passenger request card ───────────────────────────────────────────────────

function PassengerCard({ item }: { item: MyRequest }) {
  const cfg = REQUEST_STATUS[item.status];
  const isTerminal = item.status === 'REJECTED' || item.status === 'CANCELLED';

  return (
    <TouchableOpacity
      style={[styles.card, isTerminal && styles.cardMuted]}
      onPress={() => router.push(`/ride/${item.ride.id}`)}
      activeOpacity={0.75}>
      <View style={styles.routeRow}>
        <View style={styles.dotOrigin} />
        <Text style={styles.routeText} numberOfLines={1}>{item.ride.originAddress}</Text>
      </View>
      <View style={styles.routeConnector} />
      <View style={styles.routeRow}>
        <View style={styles.dotDest} />
        <Text style={styles.routeText} numberOfLines={1}>{item.ride.destinationAddress}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="person-outline" size={13} color="#6B7A99" />
          <Text style={styles.metaText}>{item.ride.driver.name}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={13} color="#6B7A99" />
          <Text style={styles.metaText}>{fmtDate(item.ride.departureTime)} {fmtTime(item.ride.departureTime)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={13} color="#6B7A99" />
          <Text style={styles.metaText}>{item.requestedSeats} vaga{item.requestedSeats > 1 ? 's' : ''}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={13} color={cfg.color} />
          <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
        <View style={[styles.badge, styles.priceBadge]}>
          <Ionicons name="cash-outline" size={13} color="#2563EB" />
          <Text style={[styles.badgeText, styles.priceBadgeText]}>
            {fmtBRL(item.totalCharged ?? item.estimatedCost)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Driver ride card ─────────────────────────────────────────────────────────

function DriverCard({ item }: { item: DriverRide }) {
  const count = item.pendingRequests.length;
  const hasPending = count > 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/ride/${item.id}`)}
      activeOpacity={0.75}>
      <View style={styles.routeRow}>
        <View style={styles.dotOrigin} />
        <Text style={styles.routeText} numberOfLines={1}>{item.originAddress}</Text>
      </View>
      <View style={styles.routeConnector} />
      <View style={styles.routeRow}>
        <View style={styles.dotDest} />
        <Text style={styles.routeText} numberOfLines={1}>{item.destinationAddress}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={13} color="#6B7A99" />
          <Text style={styles.metaText}>{fmtDate(item.departureTime)} {fmtTime(item.departureTime)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={13} color="#6B7A99" />
          <Text style={styles.metaText}>{item.availableSeats}/{item.totalSeats} vagas</Text>
        </View>
      </View>

      {count > 0 && (
        <View style={styles.requestsPreview}>
          {item.pendingRequests.slice(0, 3).map((req) => (
            <View key={req.id} style={styles.requestPreviewRow}>
              <View style={styles.passengerAvatar}>
                <Text style={styles.passengerAvatarText}>
                  {req.passenger.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                </Text>
              </View>
              <Text style={styles.passengerName} numberOfLines={1}>{req.passenger.name}</Text>
              <Text style={styles.requestMeta}>{req.requestedSeats} vaga{req.requestedSeats > 1 ? 's' : ''} · {fmtBRL(req.estimatedCost)}</Text>
            </View>
          ))}
          {count > 3 && (
            <Text style={styles.moreRequests}>+{count - 3} mais</Text>
          )}
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={[styles.badge, { backgroundColor: hasPending ? '#FEF3C7' : '#F3F4F6' }]}>
          <Ionicons
            name={hasPending ? 'notifications-outline' : 'checkmark-outline'}
            size={13}
            color={hasPending ? '#D97706' : '#6B7280'}
          />
          <Text style={[styles.badgeText, { color: hasPending ? '#D97706' : '#6B7280' }]}>
            {hasPending
              ? `${count} solicitaç${count > 1 ? 'ões' : 'ão'} pendente${count > 1 ? 's' : ''}`
              : 'Sem pendências'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#9BA8C0" />
      </View>
    </TouchableOpacity>
  );
}

// ─── Driver history card ──────────────────────────────────────────────────────

function DriverHistoryCard({ item }: { item: DriverRideHistory }) {
  return (
    <TouchableOpacity
      style={[styles.card, styles.cardMuted]}
      onPress={() => router.push(`/ride/${item.id}`)}
      activeOpacity={0.75}>
      <View style={styles.routeRow}>
        <View style={styles.dotOrigin} />
        <Text style={styles.routeText} numberOfLines={1}>{item.originAddress}</Text>
      </View>
      <View style={styles.routeConnector} />
      <View style={styles.routeRow}>
        <View style={styles.dotDest} />
        <Text style={styles.routeText} numberOfLines={1}>{item.destinationAddress}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={13} color="#6B7A99" />
          <Text style={styles.metaText}>{fmtDate(item.departureTime)} {fmtTime(item.departureTime)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={13} color="#6B7A99" />
          <Text style={styles.metaText}>{item.paidPassengers}/{item.totalSeats} passageiros</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={[styles.badge, { backgroundColor: '#DCFCE7' }]}>
          <Ionicons name="checkmark-done-outline" size={13} color="#15803D" />
          <Text style={[styles.badgeText, { color: '#15803D' }]}>Concluída</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#9BA8C0" />
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type Tab = 'driver' | 'passenger' | 'history';

type HistoryItem =
  | { kind: 'driver'; data: DriverRideHistory }
  | { kind: 'passenger'; data: MyRequest };

export default function SolicitacoesScreen() {
  const { user } = useUser();
  const isDriver = user?.role === 'MOTORISTA';
  const tabBarHeight = useBottomTabBarHeight();
  const fabBottom = tabBarHeight + FAB_MARGIN;

  const [tab, setTab] = useState<Tab>(isDriver ? 'driver' : 'passenger');
  const [myRequests, setMyRequests] = useState<MyRequest[]>([]);
  const [driverRides, setDriverRides] = useState<DriverRide[]>([]);
  const [driverHistory, setDriverHistory] = useState<DriverRideHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    if (isDriver) setTab('driver');
  }, [isDriver]);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const requests = await userApi.myRequests();
        setMyRequests(requests);

        if (isDriver) {
          const [rides, history] = await Promise.all([
            ridesApi.listMyDriverRides(),
            ridesApi.listMyDriverRideHistory(),
          ]);
          setDriverRides(rides);
          setDriverHistory(history);
        }
      } catch (err) {
        if (!silent)
          Alert.alert('Erro', err instanceof ApiError ? err.message : 'Não foi possível carregar');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isDriver],
  );

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const driverPending = driverRides.reduce((n, r) => n + r.pendingRequests.length, 0);
  const activeRequests = myRequests.filter(
    (r) => r.status === 'PENDING' || r.status === 'ACCEPTED' || r.status === 'AWAITING_PAYMENT',
  );
  const passengerPending = activeRequests.filter((r) => r.status === 'PENDING').length;
  const historyRequests = myRequests.filter(
    (r) => r.status === 'PAID' || r.status === 'REJECTED' || r.status === 'CANCELLED',
  );
  const historyItems: HistoryItem[] = [
    ...(isDriver ? driverHistory.map((d) => ({ kind: 'driver' as const, data: d })) : []),
    ...historyRequests.map((r) => ({ kind: 'passenger' as const, data: r })),
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#1A3FA0" />
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.root, { marginBottom: -tabBarHeight }]}>
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Solicitações</Text>
        <TouchableOpacity onPress={() => load(true)} style={styles.refreshBtn} activeOpacity={0.7}>
          <Ionicons name="refresh-outline" size={22} color="#1A3FA0" />
        </TouchableOpacity>
      </View>

      {/* Segment tabs */}
      <View style={styles.segment}>
        {isDriver && (
          <TouchableOpacity
            style={[styles.segBtn, tab === 'driver' && styles.segBtnActive]}
            onPress={() => setTab('driver')}
            activeOpacity={0.75}>
            <Text style={[styles.segBtnText, tab === 'driver' && styles.segBtnTextActive]}>
              Recebidas
            </Text>
            {driverPending > 0 && (
              <View style={styles.segBadge}>
                <Text style={styles.segBadgeText}>{driverPending}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.segBtn, tab === 'passenger' && styles.segBtnActive]}
          onPress={() => setTab('passenger')}
          activeOpacity={0.75}>
          <Text style={[styles.segBtnText, tab === 'passenger' && styles.segBtnTextActive]}>
            Enviadas
          </Text>
          {passengerPending > 0 && (
            <View style={styles.segBadge}>
              <Text style={styles.segBadgeText}>{passengerPending}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segBtn, tab === 'history' && styles.segBtnActive]}
          onPress={() => setTab('history')}
          activeOpacity={0.75}>
          <Text style={[styles.segBtnText, tab === 'history' && styles.segBtnTextActive]}>
            Histórico
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lists */}
      {tab === 'driver' && (
        <FlatList
          data={driverRides}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#1A3FA0" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="car-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Nenhuma carona ativa</Text>
              <Text style={styles.emptySubtitle}>Suas caronas publicadas aparecerão aqui</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/publish-ride')} activeOpacity={0.85}>
                <Text style={styles.emptyBtnText}>Publicar carona</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => <DriverCard item={item} />}
        />
      )}

      {tab === 'passenger' && (
        <FlatList
          data={activeRequests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#1A3FA0" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="ticket-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Nenhuma solicitação ativa</Text>
              <Text style={styles.emptySubtitle}>Suas solicitações de carona aparecerão aqui</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.replace('/')} activeOpacity={0.85}>
                <Text style={styles.emptyBtnText}>Buscar caronas</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => <PassengerCard item={item} />}
        />
      )}

      {tab === 'history' && (
        <FlatList
          data={historyItems}
          keyExtractor={(item) => `${item.kind}-${item.data.id}`}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#1A3FA0" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="time-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Sem histórico</Text>
              <Text style={styles.emptySubtitle}>Suas viagens concluídas aparecerão aqui</Text>
            </View>
          }
          renderItem={({ item }) =>
            item.kind === 'driver'
              ? <DriverHistoryCard item={item.data} />
              : <PassengerCard item={item.data} />
          }
        />
      )}
    </SafeAreaView>

      {isDriver ? (
        <Pressable
          style={({ pressed }) => [
            styles.fab,
            {
              bottom: fabBottom,
              width: FAB_SIZE,
              height: FAB_SIZE,
              borderRadius: FAB_SIZE / 2,
            },
            pressed && styles.fabPressed,
          ]}
          onPress={() => router.push('/publish-ride' as Href)}
          accessibilityRole="button"
          accessibilityLabel="Publicar carona"
          hitSlop={4}>
          <Ionicons name="car-sport" size={26} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F6FB' },
  safe: { flex: 1, backgroundColor: '#F4F6FB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F6FB' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0D1B3E', letterSpacing: -0.5 },
  refreshBtn: { padding: 6 },

  segment: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#E8EDF5',
    borderRadius: 14,
    padding: 3,
  },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 11,
    gap: 6,
  },
  segBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#00000020', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 3, elevation: 2 },
  segBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7A99' },
  segBtnTextActive: { color: '#1A3FA0', fontWeight: '700' },
  segBadge: { backgroundColor: '#F97316', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  segBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFF' },

  list: { paddingHorizontal: 16, paddingBottom: 100, gap: 12 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    gap: 8,
    shadowColor: 'rgba(26,63,160,0.10)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardMuted: { opacity: 0.65 },

  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dotOrigin: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#1A3FA0', backgroundColor: '#E0E8FF', flexShrink: 0 },
  dotDest: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1A3FA0', flexShrink: 0 },
  routeConnector: { width: 2, height: 12, backgroundColor: '#E8EDF5', marginLeft: 4 },
  routeText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0D1B3E' },

  divider: { height: 1, backgroundColor: '#E8EDF5' },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6B7A99' },

  requestsPreview: { backgroundColor: '#F8FAFF', borderRadius: 12, padding: 12, gap: 8 },
  requestPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  passengerAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E0E8FF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  passengerAvatarText: { fontSize: 10, fontWeight: '800', color: '#1A3FA0' },
  passengerName: { flex: 1, fontSize: 13, fontWeight: '600', color: '#0D1B3E' },
  requestMeta: { fontSize: 12, color: '#6B7A99' },
  moreRequests: { fontSize: 12, color: '#9BA8C0', textAlign: 'center', marginTop: 2 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  priceBadge: { backgroundColor: '#EFF6FF' },
  priceBadgeText: { color: '#2563EB' },

  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0D1B3E', marginTop: 8 },
  emptySubtitle: { fontSize: 14, color: '#6B7A99', textAlign: 'center', paddingHorizontal: 32 },
  emptyBtn: { marginTop: 16, backgroundColor: '#2E5BE8', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  fab: {
    position: 'absolute',
    right: 16,
    zIndex: 30,
    backgroundColor: '#1A3FA0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
});
