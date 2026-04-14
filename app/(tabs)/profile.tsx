import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { PrimaryButton } from '@/components/auth/primary-button';
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
      const message =
        error instanceof ApiError
          ? error.message
          : 'Nao foi possivel carregar seus dados agora.';
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
          <View style={styles.logoBlock}>
            <View style={styles.logoCircle}>
              <Ionicons name="person-circle-outline" size={40} color={colors.primary[600]} />
            </View>
            <Text style={styles.brand}>Perfil</Text>
            <Text style={styles.subtitle}>Dados da sua conta</Text>
          </View>

          {errorMessage ? (
            <View style={styles.infoBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <PrimaryButton
                label="Tentar novamente"
                onPress={() => {
                  void loadProfile(false);
                }}
              />
            </View>
          ) : (
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nome</Text>
                <Text style={styles.infoValue}>{profile.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profile.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ID</Text>
                <Text style={styles.infoValue}>{profile.id}</Text>
              </View>
            </View>
          )}

          <PrimaryButton label="Sair da conta" onPress={onLogout} variant="danger" />
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
  scroll: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingTop: spacing[4],
    paddingBottom: spacing[8],
  },
  content: {
    width: '100%',
    maxWidth: AUTH_MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing[6],
  },
  logoBlock: {
    alignItems: 'center',
    marginBottom: spacing[5],
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  brand: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  infoRow: {
    gap: spacing[1],
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error[700],
    lineHeight: 20,
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