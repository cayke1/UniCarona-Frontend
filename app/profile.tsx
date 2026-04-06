import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  NativeActionButton,
  NativeInfoRow,
  NativeSurfaceCard,
} from '@/components/components';
import { ThemedText } from '@/components/themed-text';
import { colors } from '@/constants/theme';
import { ApiError, userApi } from '@/lib/api';
import { clearAuthToken } from '@/lib/auth-token';

type ProfileData = {
  name: string;
  email: string;
  id: string;
  phone: string;
  course: string;
};

const EMPTY_PROFILE: ProfileData = {
  name: 'Nao informado',
  email: 'Nao informado',
  id: 'Nao informado',
  phone: 'Nao informado',
  course: 'Nao informado',
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
    phone: pickString(data, ['phone', 'telefone']) ?? EMPTY_PROFILE.phone,
    course: pickString(data, ['course', 'curso']) ?? EMPTY_PROFILE.course,
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
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <ThemedText style={styles.stateText}>Carregando perfil...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void loadProfile(true);
            }}
            tintColor={colors.primary[500]}
          />
        }>
        <View style={styles.headerRow}>
          <View style={styles.avatarWrap}>
            <Ionicons name="person" size={30} color={colors.primary[500]} />
          </View>
          <View style={styles.headerTextWrap}>
            <ThemedText style={styles.title}>Usuario</ThemedText>
            <ThemedText style={styles.subtitle}>Dados da sua conta</ThemedText>
          </View>
        </View>

        {errorMessage ? (
          <NativeSurfaceCard>
            <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
            <NativeActionButton
              label="Tentar novamente"
              onPress={() => {
                void loadProfile(false);
              }}
            />
          </NativeSurfaceCard>
        ) : (
          <NativeSurfaceCard>
            <NativeInfoRow label="Nome" value={profile.name} />
            <NativeInfoRow label="E-mail" value={profile.email} />
            <NativeInfoRow label="ID" value={profile.id} />
            <NativeInfoRow label="Telefone" value={profile.phone} />
            <NativeInfoRow label="Curso" value={profile.course} />
          </NativeSurfaceCard>
        )}

        <NativeActionButton label="Sair da conta" variant="danger" onPress={onLogout} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.app,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 16,
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  stateText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  headerTextWrap: {
    gap: 2,
  },
  title: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  errorText: {
    color: colors.error[600],
    fontSize: 14,
    lineHeight: 20,
  },
});
