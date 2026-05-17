import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { SupportScreenLayout, supportUi } from '@/components/support/support-screen-layout';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import { useUser } from '@/contexts/user-context';
import { ridesApi, userApi } from '@/lib/api';
import { isDriverUser } from '@/lib/user-types';
import type { DriverRideHistory, MyRequest } from '@/types/ride';

type HistoryEntry = {
  id: string;
  rideId: string;
  sortAt: number;
  kind: 'payment' | 'receipt';
  title: string;
  subtitle: string;
  amountLabel: string | null;
  statusLabel: string;
  statusTone: 'success' | 'neutral';
};

function formatBRL(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}

function truncateRoute(origin: string, destination: string): string {
  const o = origin.length > 28 ? `${origin.slice(0, 28)}…` : origin;
  const d = destination.length > 28 ? `${destination.slice(0, 28)}…` : destination;
  return `${o} → ${d}`;
}

function entriesFromPassengerRequests(requests: MyRequest[]): HistoryEntry[] {
  return requests
    .filter((r) => r.status === 'PAID')
    .map((r) => ({
      id: `pay-${r.id}`,
      rideId: r.ride.id,
      sortAt: new Date(r.createdAt).getTime(),
      kind: 'payment' as const,
      title: truncateRoute(r.ride.originAddress, r.ride.destinationAddress),
      subtitle: `${formatDateTime(r.createdAt)} · Motorista ${r.ride.driver.name}`,
      amountLabel: formatBRL(Number(r.totalCharged) || Number(r.estimatedCost) || 0),
      statusLabel: 'Pago',
      statusTone: 'success' as const,
    }));
}

function entriesFromDriverHistory(rides: DriverRideHistory[]): HistoryEntry[] {
  return rides
    .filter((r) => r.paidPassengers > 0)
    .map((r) => ({
      id: `recv-${r.id}`,
      rideId: r.id,
      sortAt: new Date(r.departureTime).getTime(),
      kind: 'receipt' as const,
      title: truncateRoute(r.originAddress, r.destinationAddress),
      subtitle: `${formatDateTime(r.departureTime)} · ${r.paidPassengers} passageiro(s) pagos`,
      amountLabel: null,
      statusLabel: 'Recebido',
      statusTone: 'success' as const,
    }));
}

function HistoryRow({ item }: { item: HistoryEntry }) {
  const iconName = item.kind === 'payment' ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline';
  const iconBg = item.kind === 'payment' ? '#EFF6FF' : '#ECFDF5';
  const iconColor = item.kind === 'payment' ? supportUi.BRAND_BLUE : colors.success[700];

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={() => router.push(`/ride/${item.rideId}`)}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.rowSub} numberOfLines={2}>
          {item.subtitle}
        </Text>
        <View style={styles.rowMeta}>
          <View
            style={[
              styles.statusPill,
              item.statusTone === 'success' ? styles.statusPillSuccess : styles.statusPillNeutral,
            ]}>
            <Text
              style={[
                styles.statusPillText,
                item.statusTone === 'success' ? styles.statusPillTextSuccess : styles.statusPillTextNeutral,
              ]}>
              {item.statusLabel}
            </Text>
          </View>
          {item.amountLabel ? <Text style={styles.amount}>{item.amountLabel}</Text> : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.neutral[400]} />
    </Pressable>
  );
}

export default function PaymentHistoryScreen() {
  const { user } = useUser();
  const isDriver = user ? isDriverUser(user) : false;
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const requests = await userApi.myRequests();
      const list: HistoryEntry[] = entriesFromPassengerRequests(requests);

      if (isDriver) {
        try {
          const driverHistory = await ridesApi.listMyDriverRideHistory();
          list.push(...entriesFromDriverHistory(driverHistory));
        } catch {
          // histórico do motorista opcional se rota indisponível
        }
      }

      list.sort((a, b) => b.sortAt - a.sortAt);
      setEntries(list);
    } catch {
      setError('Não foi possível carregar o histórico. Puxe para atualizar.');
      setEntries([]);
    }
  }, [isDriver]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load().finally(() => setLoading(false));
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <SupportScreenLayout title="Histórico de pagamento" subtitle="Campus Ride · finanças">
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="receipt-outline" size={28} color={supportUi.BRAND_BLUE} />
        </View>
        <Text style={styles.heroTitle}>Suas movimentações</Text>
        <Text style={styles.heroSub}>
          Pagamentos de caronas como passageiro
          {isDriver ? ' e caronas com passageiros pagos como motorista.' : '.'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={supportUi.BRAND_BLUE} />
          <Text style={styles.loadingText}>Carregando histórico…</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyCard}>
          <Ionicons name="cloud-offline-outline" size={32} color={colors.neutral[400]} />
          <Text style={styles.emptyTitle}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => void onRefresh()}>
            <Text style={styles.retryBtnText}>Tentar de novo</Text>
          </Pressable>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="document-text-outline" size={32} color={colors.neutral[400]} />
          <Text style={styles.emptyTitle}>Nenhum pagamento ainda</Text>
          <Text style={styles.emptySub}>
            Quando você pagar uma carona ou receber passageiros confirmados, o registro aparecerá
            aqui.
          </Text>
        </View>
      ) : (
        <>
          <Text style={supportUi.sectionLabel}>TRANSAÇÕES</Text>
          <View style={styles.listCard}>
            {entries.map((item, index) => (
              <View key={item.id}>
                <HistoryRow item={item} />
                {index < entries.length - 1 ? <View style={styles.separator} /> : null}
              </View>
            ))}
          </View>
        </>
      )}

      {!loading && entries.length > 0 ? (
        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={18} color={colors.warning[700]} />
          <Text style={styles.tipText}>
            Toque em um item para abrir os detalhes da carona. Valores exibidos são os registrados no
            app (ambiente de demonstração).
          </Text>
        </View>
      ) : null}
    </SupportScreenLayout>
  );
}

const styles = StyleSheet.create({
  hero: {
    ...supportUi.card,
    alignItems: 'center',
    gap: spacing[2],
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[1],
  },
  heroTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: spacing[2],
  },
  centered: {
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[8],
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  emptyCard: {
    ...supportUi.card,
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[6],
  },
  emptyTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing[2],
  },
  retryBtn: {
    marginTop: spacing[2],
    paddingVertical: 10,
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    backgroundColor: supportUi.BRAND_BLUE,
  },
  retryBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  listCard: {
    ...supportUi.card,
    padding: 0,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
  },
  rowPressed: {
    backgroundColor: colors.neutral[50],
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
    lineHeight: 19,
  },
  rowSub: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: spacing[2],
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  statusPillSuccess: {
    backgroundColor: colors.success[100],
  },
  statusPillNeutral: {
    backgroundColor: colors.neutral[100],
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
  },
  statusPillTextSuccess: {
    color: colors.success[800],
  },
  statusPillTextNeutral: {
    color: colors.text.secondary,
  },
  amount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.muted,
    marginLeft: spacing[4] + 44 + spacing[3],
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    backgroundColor: colors.warning[50],
    borderWidth: 1,
    borderColor: colors.warning[200],
    borderRadius: borderRadius.md,
    padding: spacing[3],
  },
  tipText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.warning[800],
    lineHeight: 18,
  },
});
