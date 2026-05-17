import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthTextField } from '@/components/auth/auth-text-field';
import { PrimaryButton } from '@/components/auth/primary-button';
import { AUTH_MAX_CONTENT_WIDTH, CampusRideColors } from '@/constants/campus-ride-theme';
import { ApiError, authApi } from '@/lib/api';

function passwordStrength(password: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (password.length === 0) return { level: 0, label: '', color: CampusRideColors.border };
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const long = password.length >= 12;
  const score = (hasUpper ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0) + (long ? 1 : 0);
  if (password.length < 8) return { level: 1, label: 'Fraca', color: '#ef4444' };
  if (score <= 1) return { level: 1, label: 'Fraca', color: '#ef4444' };
  if (score === 2) return { level: 2, label: 'Média', color: '#f59e0b' };
  return { level: 3, label: 'Forte', color: '#22c55e' };
}

const REDIRECT_DELAY_MS = 3000;

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(true);
  const [showConfirm, setShowConfirm] = useState(true);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [countdown, setCountdown] = useState(Math.ceil(REDIRECT_DELAY_MS / 1000));

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => router.replace('/login'), REDIRECT_DELAY_MS);
    const interval = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [done]);

  const strength = passwordStrength(newPassword);

  async function onSubmit() {
    if (!token) {
      Alert.alert('Link inválido', 'Este link de redefinição é inválido ou expirou.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Senha inválida', 'A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Senhas diferentes', 'A confirmação não confere com a nova senha.');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword });
      setDone(true);
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : 'Não foi possível redefinir a senha. Tente novamente.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {done ? (
              <>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle-outline" size={48} color="#22c55e" />
                </View>
                <Text style={styles.title}>Senha redefinida!</Text>
                <Text style={styles.lead}>
                  Sua senha foi alterada com sucesso. Você será redirecionado para o login em{' '}
                  <Text style={styles.countdown}>{countdown}s</Text>.
                </Text>
                <PrimaryButton
                  label="Ir para o login agora"
                  onPress={() => router.replace('/login')}
                  loading={false}
                />
              </>
            ) : (
              <>
                <Text style={styles.title}>Nova senha</Text>
                <Text style={styles.lead}>
                  Crie uma senha forte com pelo menos 8 caracteres.
                </Text>

                <AuthTextField
                  icon="lock-closed-outline"
                  placeholder="Nova senha"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={showNew}
                  onToggleSecure={() => setShowNew(!showNew)}
                />

                {newPassword.length > 0 && (
                  <View style={styles.strengthWrap}>
                    <View style={styles.strengthBarRow}>
                      {([1, 2, 3] as const).map((lvl) => (
                        <View
                          key={lvl}
                          style={[
                            styles.strengthSegment,
                            {
                              backgroundColor:
                                strength.level >= lvl ? strength.color : CampusRideColors.border,
                            },
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={[styles.strengthLabel, { color: strength.color }]}>
                      {strength.label}
                    </Text>
                  </View>
                )}

                <AuthTextField
                  icon="lock-closed-outline"
                  placeholder="Confirmar nova senha"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={showConfirm}
                  onToggleSecure={() => setShowConfirm(!showConfirm)}
                />

                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <Text style={styles.mismatch}>As senhas não conferem.</Text>
                )}

                <PrimaryButton label="Redefinir senha" onPress={onSubmit} loading={loading} />

                <Pressable style={styles.back} onPress={() => router.replace('/login')}>
                  <Text style={styles.link}>Voltar ao login</Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: CampusRideColors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 32,
  },
  content: {
    width: '100%',
    maxWidth: AUTH_MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: CampusRideColors.text,
    marginBottom: 4,
  },
  lead: {
    fontSize: 15,
    color: CampusRideColors.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  countdown: {
    fontWeight: '700',
    color: CampusRideColors.text,
  },
  strengthWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: -8,
  },
  strengthBarRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  mismatch: {
    fontSize: 13,
    color: '#ef4444',
    marginTop: -8,
  },
  back: {
    alignItems: 'center',
  },
  link: {
    color: CampusRideColors.primary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
});
