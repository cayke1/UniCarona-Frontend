import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { SettingsToggleRow } from '@/components/support/settings-toggle-row';
import { SupportScreenLayout, supportUi } from '@/components/support/support-screen-layout';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  getNotificationPreferences,
  setNotificationPreferences,
  type NotificationPreferences,
} from '@/lib/notification-preferences';
export default function NotificationsScreen() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getNotificationPreferences().then((stored) => {
      if (!cancelled) {
        setPrefs(stored);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const updatePref = useCallback(
    (key: keyof NotificationPreferences, value: boolean) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        void setNotificationPreferences(next);
        return next;
      });
    },
    []
  );

  return (
    <SupportScreenLayout title="Notificações" subtitle="Campus Ride · alertas">
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="notifications-outline" size={28} color={supportUi.BRAND_BLUE} />
        </View>
        <Text style={styles.heroTitle}>O que você quer receber?</Text>
        <Text style={styles.heroSub}>
          Escolha os avisos sobre caronas, pagamentos e solicitações. Push real será integrado em
          versões futuras — por enquanto as preferências ficam salvas no app.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={supportUi.BRAND_BLUE} />
        </View>
      ) : (
        <>
          <Text style={supportUi.sectionLabel}>PUSH E ALERTAS</Text>
          <View style={styles.listCard}>
            <SettingsToggleRow
              icon="car-outline"
              title="Atualizações de carona"
              subtitle="Horário, rota e status da viagem"
              value={prefs.rideUpdates}
              onValueChange={(v) => updatePref('rideUpdates', v)}
            />
            <View style={styles.separator} />
            <SettingsToggleRow
              icon="card-outline"
              title="Pagamentos"
              subtitle="Confirmação, checkout e recibos"
              value={prefs.paymentUpdates}
              onValueChange={(v) => updatePref('paymentUpdates', v)}
            />
            <View style={styles.separator} />
            <SettingsToggleRow
              icon="people-outline"
              title="Solicitações"
              subtitle="Aceites, recusas e novos pedidos"
              value={prefs.requestUpdates}
              onValueChange={(v) => updatePref('requestUpdates', v)}
            />
            <View style={styles.separator} />
            <SettingsToggleRow
              icon="megaphone-outline"
              title="Novidades e promoções"
              subtitle="Campanhas e recursos do Campus Ride"
              value={prefs.promotions}
              onValueChange={(v) => updatePref('promotions', v)}
            />
          </View>

          <View style={styles.tipCard}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary[700]} />
            <Text style={styles.tipText}>
              Mesmo com tudo desligado, avisos críticos de segurança ou conta ainda poderão ser
              exibidos dentro do aplicativo.
            </Text>
          </View>
        </>
      )}
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
  loadingBox: {
    paddingVertical: spacing[8],
    alignItems: 'center',
  },
  listCard: {
    ...supportUi.card,
    padding: 0,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.muted,
    marginLeft: spacing[4] + 40 + spacing[3],
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
    borderRadius: borderRadius.md,
    padding: spacing[3],
  },
  tipText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.primary[800],
    lineHeight: 18,
  },
});
