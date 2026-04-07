import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/primary-button';
import { ProfileIcon } from '@/components/profile/profile-icon';
import { AUTH_MAX_CONTENT_WIDTH } from '@/constants/campus-ride-theme';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import { ApiError, userApi } from '@/lib/api';
import { clearAuthToken } from '@/lib/auth-token';

type ProfileData = {
  name: string;
  email: string;
  id: string;
};

const EMPTY_PROFILE: ProfileData = {
  name: 'Nao informado',
  email: 'Nao informado',
  id: 'Nao informado',
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function pickString(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function normalizeUser(payload: Record<string, unknown>): ProfileData {
  const firstLayer = asRecord(payload.user) ?? asRecord(payload.data) ?? payload;
  const data = asRecord(firstLayer.user) ?? firstLayer;

  return {
    name: pickString(data, ['name', 'fullName', 'nome']) ?? EMPTY_PROFILE.name,
    email: pickString(data, ['email']) ?? EMPTY_PROFILE.email,
    id: pickString(data, ['id', '_id', 'userId', 'matricula']) ?? EMPTY_PROFILE.id,
  };
}

function getInitials(name: string) {
  const initials = name
    .split(' ')
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('');

  return initials.toUpperCase() || 'U';
}

type MenuItemProps = {
  icon: Parameters<typeof ProfileIcon>[0]['name'];
  label: string;
  description?: string;
  badge?: string;
  onPress?: () => void;
  isLast?: boolean;
};

function MenuItem({ icon, label, description, badge, onPress, isLast }: MenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.menuItem, !isLast && styles.menuItemBorder]}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIconWrap}>
          <ProfileIcon name={icon} size={18} color={colors.primary[600]} />
        </View>
        <View style={styles.menuTextBlock}>
          <Text style={styles.menuItemLabel}>{label}</Text>
          {description ? <Text style={styles.menuItemDescription}>{description}</Text> : null}
        </View>
      </View>
      <View style={styles.menuItemRight}>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
        <ProfileIcon name="chevronRight" size={18} color={colors.neutral[400]} />
      </View>
    </TouchableOpacity>
  );
}

type InfoCardProps = {
  icon: Parameters<typeof ProfileIcon>[0]['name'];
  label: string;
  value: string;
  accentColor: string;
  backgroundColor: string;
};

function InfoCard({ icon, label, value, accentColor, backgroundColor }: InfoCardProps) {
  return (
    <View style={styles.infoCard}>
      <View style={[styles.infoIconWrap, { backgroundColor }]}>
        <ProfileIcon name={icon} size={18} color={accentColor} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await userApi.me();
      setProfile(normalizeUser(response));
      setErrorMessage(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setErrorMessage('Sua sessao expirou. Faca login novamente.');
        return;
      }

      const message = error instanceof ApiError ? error.message : 'Nao foi possivel carregar seus dados agora.';
      setErrorMessage(message);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfile(false);
    }, [loadProfile])
  );

  async function onLogout() {
    Alert.alert('Sair', 'Deseja encerrar sua sessao?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await clearAuthToken();
          router.replace('/login');
        },
      },
    ]);
  }

  function onSoonAction(title: string) {
    Alert.alert(title, 'Essa opcao ainda nao esta conectada no projeto.');
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.stateText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topTitle}>Perfil</Text>
          <Text style={styles.topSubtitle}>Dados da sua conta</Text>
        </View>
        <View style={styles.topAvatar}>
          <ProfileIcon name="avatar" size={30} color={colors.primary[600]} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void loadProfile(true);
            }}
            tintColor={colors.primary[600]}
          />
        }
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.heroCard}>
            <View style={styles.heroAvatarWrap}>
              <View style={styles.heroAvatar}>
                <Text style={styles.heroInitials}>{getInitials(profile.name)}</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <ProfileIcon name="verified" size={18} color={colors.success[600]} />
              </View>
            </View>

            <Text style={styles.heroName}>{profile.name}</Text>
            <Text style={styles.heroEmail}>{profile.email}</Text>

            {/* Componente de Conta autenticada */}
            
            {/* <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>Conta autenticada</Text>
            </View> */}
          </View>

          <View style={styles.infoGrid}>
            <InfoCard
              icon="email"
              label="Email"
              value={profile.email}
              accentColor={colors.primary[600]}
              backgroundColor={colors.primary[50]}
            />
            <InfoCard
              icon="id"
              label="ID"
              value={profile.id}
              accentColor={colors.secondary[700]}
              backgroundColor={colors.secondary[50]}
            />
          </View>

          {errorMessage ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <PrimaryButton
                label="Tentar novamente"
                onPress={() => {
                  void loadProfile(false);
                }}
              />
            </View>
          ) : null}

          <Section title="Conta">
            <MenuItem
              icon="edit"
              label="Editar perfil"
              description="Atualize seus dados pessoais"
              onPress={() => onSoonAction('Editar perfil')}
            />
            <MenuItem
              icon="notifications"
              label="Notificacoes"
              description="Preferencias de alertas e avisos"
              isLast
              onPress={() => onSoonAction('Notificacoes')}
            />
          </Section>

          <Section title="Ajuda e suporte">
            <MenuItem
              icon="help"
              label="Central de ajuda"
              description="Duvidas frequentes e suporte"
              onPress={() => onSoonAction('Central de ajuda')}
            />
            <MenuItem
              icon="privacy"
              label="Termos e privacidade"
              description="Politicas do Campus Ride"
              isLast
              onPress={() => onSoonAction('Termos e privacidade')}
            />
          </Section>

          <PrimaryButton label="Sair da conta" onPress={onLogout} variant="outlined" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.canvas,
  },
  topBar: {
    width: '100%',
    maxWidth: AUTH_MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  topTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  topSubtitle: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  topAvatar: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scroll: {
    flexGrow: 1,
    paddingTop: spacing[2],
    paddingBottom: spacing[8],
  },
  content: {
    width: '100%',
    maxWidth: AUTH_MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[5],
  },
  heroCard: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[5],
    alignItems: 'center',
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 2,
  },
  heroAvatarWrap: {
    marginBottom: spacing[4],
  },
  heroAvatar: {
    width: 108,
    height: 108,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    borderWidth: 4,
    borderColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInitials: {
    fontSize: 34,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
  },
  verifiedBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: {
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  heroEmail: {
    marginTop: spacing[1],
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  heroPill: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    backgroundColor: colors.success[50],
    borderWidth: 1,
    borderColor: colors.success[100],
  },
  heroPillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.success[700],
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing[4],
    gap: spacing[2],
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  errorCard: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.error,
    padding: spacing[4],
    gap: spacing[3],
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.error[700],
  },
  section: {
    gap: spacing[3],
  },
  sectionTitle: {
    paddingLeft: spacing[1],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  sectionCard: {
    backgroundColor: colors.background.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.muted,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextBlock: {
    flex: 1,
    gap: 2,
  },
  menuItemLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  menuItemDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginLeft: spacing[3],
  },
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success[50],
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.success[700],
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  stateText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});
