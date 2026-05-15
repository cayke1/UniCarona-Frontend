import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/primary-button';
import { AUTH_MAX_CONTENT_WIDTH, CampusRideColors } from '@/constants/campus-ride-theme';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import { useUser } from '@/contexts/user-context';
import { authApi } from '@/lib/api';
import { clearAuthToken, getRefreshToken } from '@/lib/auth-token';
import { formatMoneyFromCents } from '@/lib/user-types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Azul principal alinhado ao mock (próximo ao #2563eb / #2d5bff). */
const BRAND_BLUE = '#2563EB';
const PAGE_BG = CampusRideColors.background;
const CARD_RADIUS = 14;
const ROW_RADIUS = 12;

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type MenuRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBg: string;
  iconColor: string;
  label: string;
  onPress: () => void;
  /** Pill verde (ex.: Ativo). */
  badge?: string;
  /** Texto neutro à direita (ex.: valor em R$). */
  detail?: string;
  isLast?: boolean;
};

function MenuRow({
  icon,
  iconBg,
  iconColor,
  label,
  onPress,
  badge,
  detail,
  isLast,
}: MenuRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        !isLast && styles.menuRowBorder,
        pressed && styles.menuRowPressed,
      ]}>
      <View style={[styles.menuIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      {detail ? <Text style={styles.menuDetail}>{detail}</Text> : null}
      {badge ? (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badge}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={colors.neutral[400]} />
    </Pressable>
  );
}

function MenuGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.menuGroup}>{children}</View>;
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export default function ProfileScreen() {
  const { user, loading, error, refreshUser, clearUser } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const prevRole = useRef<string | undefined>(undefined);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser();
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser]);

  useFocusEffect(
    useCallback(() => {
      void refreshUser();
    }, [refreshUser])
  );

  useEffect(() => {
    if (prevRole.current && user?.role && prevRole.current !== user.role) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    prevRole.current = user?.role;
  }, [user?.role]);

  async function onLogout() {
    try {
      const rt = await getRefreshToken();
      if (rt) {
        try {
          await authApi.logout(rt);
        } catch {
          /* sessão local encerra mesmo se a rede falhar */
        }
      }
    } finally {
      await clearAuthToken();
      clearUser();
      router.replace('/login');
    }
  }

  function onWithdraw() {
    Alert.alert(
      'Sacar saldo',
      'Em breve você poderá solicitar o saque para sua chave PIX cadastrada.'
    );
  }

  const isDriver = user?.role === 'MOTORISTA';
  const majorDisplay = user?.major?.trim() || 'Curso não informado';
  const institutionDisplay = user?.institution?.trim() || 'Instituição não informada';
  const offeredCount = 0;
  /** Contador de viagens como passageiro: integrar quando o backend expuser. */
  const takenCount = 0;
  const showBack = router.canGoBack();

  if (loading && !user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={BRAND_BLUE} />
          <Text style={styles.stateText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void onRefresh();
            }}
            tintColor={BRAND_BLUE}
          />
        }
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.profileBlock}>
            <View
              style={[
                styles.avatarTopZone,
                showBack ? styles.avatarTopZoneRow : styles.avatarTopZoneSolo,
              ]}>
              {showBack ? (
                <View style={styles.avatarSideRail}>
                  <Pressable
                    onPress={() => router.back()}
                    hitSlop={14}
                    style={styles.backLeft}
                    accessibilityRole="button"
                    accessibilityLabel="Voltar">
                    <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
                  </Pressable>
                </View>
              ) : null}
              <View
                style={[styles.avatarCenterCol, showBack ? styles.avatarCenterColFlex : undefined]}>
                <View style={styles.avatarWrap}>
                  <View style={styles.avatarRing}>
                    {user?.photoUrl ? (
                      <Image
                        source={{ uri: user.photoUrl }}
                        style={styles.avatarImg}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.avatarInner}>
                        <Text style={styles.avatarText}>
                          {initialsFromName(user?.name ?? '')}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={22} color={colors.success[600]} />
                  </View>
                </View>
              </View>
              {showBack ? <View style={styles.avatarSideRail} /> : null}
            </View>
            <Text style={styles.profileName}>{user?.name ?? '—'}</Text>
            <Text style={styles.profileMajor}>{majorDisplay}</Text>
            <View style={styles.institutionRow}>
              <Ionicons name="business" size={16} color={BRAND_BLUE} />
              <Text style={styles.institutionText}>{institutionDisplay}</Text>
            </View>
          </View>

          {error ? (
            <View style={styles.bannerError}>
              <Ionicons name="warning-outline" size={20} color={colors.error[700]} />
              <Text style={styles.bannerErrorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIconSq, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="heart-outline" size={18} color={BRAND_BLUE} />
              </View>
              <Text style={styles.statLabel}>OFERECIDAS</Text>
              <Text style={styles.statValue}>{offeredCount}</Text>
              <Text style={styles.statFootGreen}>
                {isDriver ? 'Publique uma carona' : '—'}
              </Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconSq, { backgroundColor: colors.warning[100] }]}>
                <Ionicons name="car" size={18} color={colors.warning[700]} />
              </View>
              <Text style={styles.statLabel}>PEGAS</Text>
              <Text style={styles.statValue}>{takenCount}</Text>
              <Text style={styles.statFootMuted}>Total de viagens</Text>
            </View>
          </View>

          <SectionLabel>CONFIGURAÇÕES DA CONTA</SectionLabel>
          <MenuGroup>
            <MenuRow
              icon="person-outline"
              iconBg={colors.neutral[100]}
              iconColor={colors.text.secondary}
              label="Editar perfil"
              onPress={() =>
                Alert.alert('Em breve', 'A edição de perfil estará disponível em uma próxima versão.')
              }
              isLast={false}
            />
            <MenuRow
              icon="notifications-outline"
              iconBg={colors.neutral[100]}
              iconColor={colors.text.secondary}
              label="Notificações"
              onPress={() =>
                Alert.alert('Notificações', 'Preferências de notificação em desenvolvimento.')
              }
              isLast
            />
          </MenuGroup>

          <SectionLabel>FINANÇAS</SectionLabel>
          <MenuGroup>
            {isDriver ? (
              <MenuRow
                icon="wallet-outline"
                iconBg={colors.neutral[100]}
                iconColor={colors.text.secondary}
                label="Saldo disponível"
                onPress={onWithdraw}
                detail={formatMoneyFromCents(user?.balanceCents ?? null)}
                isLast={false}
              />
            ) : null}
            <MenuRow
              icon="card-outline"
              iconBg={colors.neutral[100]}
              iconColor={colors.text.secondary}
              label="Métodos de pagamento"
              onPress={() =>
                isDriver
                  ? Alert.alert(
                      'PIX',
                      user?.pixKey
                        ? `Chave cadastrada: ${user.pixKey}`
                        : 'Cadastre sua chave PIX para receber por carona.'
                    )
                  : router.push('/become-driver' as Href)
              }
              badge={user?.pixKey ? 'Ativo' : undefined}
              isLast={false}
            />
            <MenuRow
              icon="receipt-outline"
              iconBg={colors.neutral[100]}
              iconColor={colors.text.secondary}
              label="Histórico de pagamento"
              onPress={() =>
                Alert.alert(
                  'Histórico de pagamento',
                  'O histórico de pagamentos estará disponível em breve.'
                )
              }
              isLast
            />
          </MenuGroup>

          <SectionLabel>AJUDA E SUPORTE</SectionLabel>
          <MenuGroup>
            <MenuRow
              icon="help-circle-outline"
              iconBg={colors.neutral[100]}
              iconColor={colors.text.secondary}
              label="Central de ajuda"
              onPress={() => Alert.alert('Ajuda', 'Entre em contato pelo e-mail de suporte da sua instituição.')}
              isLast={false}
            />
            <MenuRow
              icon="shield-checkmark-outline"
              iconBg={colors.neutral[100]}
              iconColor={colors.text.secondary}
              label="Termos e privacidade"
              onPress={() => Alert.alert('Termos', 'Documentos legais em elaboração.')}
              isLast
            />
          </MenuGroup>

          <Pressable
            onPress={() => {
              void onLogout();
            }}
            style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}>
            <Ionicons name="log-out-outline" size={20} color={colors.error[800]} />
            <Text style={styles.logoutLabel}>Sair da conta</Text>
          </Pressable>

          {!isDriver ? (
            <Pressable
              style={({ pressed }) => [styles.promoCard, pressed && styles.promoCardPressed]}
              onPress={() => router.push('/become-driver' as Href)}>
              <View style={styles.promoIconWrap}>
                <Ionicons name="rocket-outline" size={22} color={BRAND_BLUE} />
              </View>
              <View style={styles.promoTextWrap}>
                <Text style={styles.promoTitle}>Torne-se motorista</Text>
                <Text style={styles.promoSub}>
                  Cadastre sua chave PIX, publique caronas e receba por corrida.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={colors.text.tertiary} />
            </Pressable>
          ) : (
            <View style={styles.driverActions}>
              <PrimaryButton
                label="Publicar carona"
                onPress={() => router.push('/publish-ride' as Href)}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: spacing[12],
  },
  content: {
    width: '100%',
    maxWidth: AUTH_MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    marginTop: spacing[4],
    paddingHorizontal: spacing[5],
    gap: spacing[4],
  },
  profileBlock: {
    alignItems: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  avatarTopZone: {
    width: '100%',
    marginBottom: spacing[4],
  },
  avatarTopZoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  avatarTopZoneSolo: {
    alignItems: 'center',
  },
  /** Mesma largura à esquerda (voltar) e à direita (vazio) para o avatar ficar no centro da tela. */
  avatarSideRail: {
    width: 40,
    minWidth: 40,
  },
  backLeft: {
    padding: spacing[1],
    marginLeft: -spacing[1],
    marginTop: spacing[1],
  },
  avatarCenterCol: {
    alignItems: 'center',
  },
  avatarCenterColFlex: {
    flex: 1,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarRing: {
    width: 112,
    height: 112,
    borderRadius: borderRadius.full,
    borderWidth: 3,
    borderColor: BRAND_BLUE,
    padding: 3,
    backgroundColor: colors.background.surface,
    overflow: 'hidden',
  },
  avatarInner: {
    flex: 1,
    borderRadius: borderRadius.full,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.full,
  },
  avatarText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: BRAND_BLUE,
  },
  verifiedBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.full,
    padding: 2,
  },
  profileName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  profileMajor: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[500],
    marginBottom: spacing[3],
  },
  institutionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  institutionText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: BRAND_BLUE,
    flexShrink: 1,
  },
  bannerError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[200],
    borderRadius: CARD_RADIUS,
    padding: spacing[3],
  },
  bannerErrorText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.error[800],
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.surface,
    borderRadius: CARD_RADIUS,
    padding: spacing[4],
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  statIconSq: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  statLabel: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[500],
    letterSpacing: 0.8,
    marginBottom: spacing[1],
  },
  statValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  statFootGreen: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.success[700],
  },
  statFootMuted: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[500],
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[500],
    letterSpacing: 0.6,
    marginTop: spacing[1],
    marginBottom: -spacing[1],
  },
  menuGroup: {
    backgroundColor: colors.background.surface,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.muted,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: 14,
    paddingHorizontal: spacing[4],
    minHeight: 52,
    backgroundColor: colors.background.surface,
  },
  menuRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.muted,
  },
  menuRowPressed: {
    backgroundColor: colors.neutral[50],
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: ROW_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  menuDetail: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
    marginRight: spacing[1],
  },
  menuBadge: {
    backgroundColor: colors.success[100],
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    marginRight: spacing[1],
  },
  menuBadgeText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: colors.success[800],
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.error[50],
    borderRadius: CARD_RADIUS,
    paddingVertical: spacing[4],
    borderWidth: 1,
    borderColor: colors.error[100],
  },
  logoutBtnPressed: {
    opacity: 0.88,
  },
  logoutLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.error[800],
  },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.background.surface,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing[4],
  },
  promoCardPressed: {
    opacity: 0.92,
  },
  promoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: ROW_RADIUS,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoTextWrap: {
    flex: 1,
    gap: spacing[1],
  },
  promoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  promoSub: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  driverActions: {
    gap: spacing[3],
  },
  stateText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2.5],
  },
});